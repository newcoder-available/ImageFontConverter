import os
import time
import copy
import numpy as np
from typing import List, Dict, Any, Optional, Tuple

from models import (
    TextBlock,
    BoundingBox,
    StyleInfo,
    QAResult,
    LocalizedVariant,
    ProcessImageResponse,
    MultiProcessResponse,
    AnalyzeImageResponse,
    SettingsConfig
)
from providers.mock_provider import (
    MockVisionProvider,
    MockLanguageDetectionProvider,
    MockTranslationProvider,
    MockTypographyProvider,
    MockImageEditingProvider,
    MockQAProvider
)
from providers.cloud_providers import OpenAIProvider, GeminiProvider, SelfHostedProvider
from .classification_agent import TextClassificationAgent
from .glossary_manager import GlossaryManager

def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()
        except Exception:
            pass

class LocalizationOrchestrator:
    """
    Central AI Agent Orchestration Pipeline:
    Coordinates Vision -> Language Detection -> Classification -> Context Translation ->
    Typography Analysis -> Mask Inpainting -> Reconstruction -> AI QA verification
    with iterative automated correction loops.
    """
    def __init__(self):
        load_env_file()
        openai_key = os.getenv("OPENAI_API_KEY", "")
        provider = os.getenv("AI_PROVIDER", "openai" if openai_key else "mock")

        self.settings = SettingsConfig(
            aiProvider=provider,
            openaiApiKey=openai_key,
            apiKeyConfigured=bool(openai_key)
        )
        self.glossary_mgr = GlossaryManager()
        self.classifier = TextClassificationAgent()
        
        # Initialize providers
        self.vision_provider = MockVisionProvider()
        self.typography_provider = MockTypographyProvider()
        self.image_editing_provider = MockImageEditingProvider()
        self.qa_provider = MockQAProvider()

        if provider == "openai" and openai_key:
            self.translation_provider = OpenAIProvider(api_key=openai_key)
            self.lang_detect_provider = OpenAIProvider(api_key=openai_key)
        else:
            self.translation_provider = MockTranslationProvider()
            self.lang_detect_provider = MockLanguageDetectionProvider()

    def update_settings(self, new_settings: SettingsConfig):
        self.settings = new_settings
        if new_settings.aiProvider == "openai" and new_settings.openaiApiKey:
            self.translation_provider = OpenAIProvider(api_key=new_settings.openaiApiKey)
            self.lang_detect_provider = OpenAIProvider(api_key=new_settings.openaiApiKey)
        elif new_settings.aiProvider == "gemini" and new_settings.geminiApiKey:
            self.translation_provider = GeminiProvider(api_key=new_settings.geminiApiKey)
            self.lang_detect_provider = GeminiProvider(api_key=new_settings.geminiApiKey)
        elif new_settings.aiProvider == "self-hosted":
            self.translation_provider = SelfHostedProvider(endpoint=new_settings.selfHostedEndpoint)
        else:
            self.translation_provider = MockTranslationProvider()
            self.lang_detect_provider = MockLanguageDetectionProvider()

    def analyze_image(self, img_bgr: np.ndarray) -> Tuple[AnalyzeImageResponse, List[Dict[str, Any]], np.ndarray]:
        """
        Runs Vision Analysis, Language Detection, and Text Classification on an image.
        """
        start_time = time.time()
        h, w = img_bgr.shape[:2]

        # 1. Vision & Text Region Detection
        raw_regions = self.vision_provider.detect_regions(img_bgr)
        
        # 2. Overall & per-block Language Detection + Classification
        text_blocks: List[TextBlock] = []
        detected_languages: List[str] = []
        primary_script = "Latin"
        primary_direction = "ltr"
        overall_confidence = 0.99

        for region in raw_regions:
            orig_text = region["text"]
            box = region["boundingBox"]
            conf = region.get("confidence", 1.0)
            poly = region.get("polygon", [])
            rot = region.get("rotation", 0.0)

            # Language Detection Agent
            lang_info = self.lang_detect_provider.detect_language(orig_text)
            detected_languages.append(lang_info.get("language", "English"))
            primary_script = lang_info.get("script", "Latin")
            primary_direction = lang_info.get("direction", "ltr")
            overall_confidence = min(overall_confidence, lang_info.get("confidence", 0.99))

            # Classification Agent
            classification, text_type, hierarchy = self.classifier.classify_text(
                orig_text, confidence=conf, box_w=box["width"], box_h=box["height"]
            )

            # Typography Analysis Agent
            style = self.typography_provider.analyze_typography(img_bgr, region)

            block = TextBlock(
                id=region["id"],
                originalText=orig_text,
                translatedText=orig_text,
                sourceLanguage=lang_info.get("language", "English"),
                script=lang_info.get("script", "Latin"),
                confidence=conf,
                boundingBox=BoundingBox(**box),
                polygon=poly,
                rotation=rot,
                type=text_type,
                hierarchy=hierarchy,
                classification=classification,
                style=style,
                isEdited=False,
                skipTranslation=(classification == "PROTECTED")
            )
            text_blocks.append(block)

        # Determine dominant source language
        primary_lang = "English"
        if detected_languages:
            primary_lang = max(set(detected_languages), key=detected_languages.count)

        # 3. Create Inpainted background
        inpainted_bgr = self.image_editing_provider.inpaint_text_regions(img_bgr, raw_regions)

        elapsed_ms = (time.time() - start_time) * 1000
        analysis = AnalyzeImageResponse(
            success=True,
            sourceLanguage=primary_lang,
            detectedScript=primary_script,
            languageConfidence=round(overall_confidence, 2),
            direction=primary_direction,
            imageWidth=w,
            imageHeight=h,
            textBlocks=text_blocks,
            processingTimeMs=round(elapsed_ms, 2)
        )
        return analysis, raw_regions, inpainted_bgr

    def localize_for_language(
        self,
        img_bgr: np.ndarray,
        inpainted_bgr: np.ndarray,
        text_blocks: List[TextBlock],
        source_lang: str,
        target_lang: str
    ) -> LocalizedVariant:
        """
        Executes Contextual Translation -> Typography Mapping -> Rendering -> AI QA
        with automatic correction pass loop (up to 3 attempts).
        """
        from translator import TranslationService
        lang_meta = TranslationService.get_language_by_code(target_lang)
        lang_name = lang_meta.name if lang_meta else target_lang.upper()
        native_name = lang_meta.nativeName if lang_meta else lang_name
        script = lang_meta.script if lang_meta else "Universal"
        direction = lang_meta.direction if lang_meta else "ltr"
        is_rtl = lang_meta.isRtl if lang_meta else False

        glossary_dict = self.glossary_mgr.get_glossary_dict()

        # Step 1: Translate blocks
        variant_blocks: List[TextBlock] = []
        for b in text_blocks:
            cloned = b.model_copy(deep=True)
            if not cloned.skipTranslation:
                tr_res = self.translation_provider.translate(
                    text=cloned.originalText,
                    source_lang=source_lang,
                    target_lang=target_lang,
                    context="gaming/marketing/UI",
                    text_type=cloned.type,
                    glossary=glossary_dict
                )
                cloned.translatedText = tr_res.get("targetText", cloned.originalText)
            else:
                cloned.translatedText = cloned.originalText
            variant_blocks.append(cloned)

        # Step 2: Render & QA with correction loops
        rendered_bgr = None
        qa_result = None
        max_attempts = 3
        
        for attempt in range(1, max_attempts + 1):
            rendered_bgr = self.image_editing_provider.render_text(
                inpainted_bgr, variant_blocks, target_lang=target_lang
            )
            qa_result = self.qa_provider.validate(
                original_img=img_bgr,
                localized_img=rendered_bgr,
                text_blocks=variant_blocks,
                target_lang=target_lang
            )
            qa_result.correctionAttempts = attempt - 1

            if qa_result.overallPassed or attempt == max_attempts:
                break

            # Correction pass adjustments:
            # If boundary fitting is slightly tight, adapt font size by -10%
            if qa_result.boundaryFittingScore < 90.0:
                for vb in variant_blocks:
                    vb.style.fontSize = max(12, int(vb.style.fontSize * 0.9))

        # Encode rendered image
        import cv2
        import base64
        import io
        from PIL import Image
        
        rgb = cv2.cvtColor(rendered_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

        return LocalizedVariant(
            targetLanguage=target_lang,
            languageName=lang_name,
            nativeName=native_name,
            script=script,
            direction=direction,
            isRtl=is_rtl,
            translatedImageBase64=b64,
            textBlocks=variant_blocks,
            qaResult=qa_result
        )
