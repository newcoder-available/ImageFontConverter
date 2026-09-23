import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from models import StyleInfo, QAResult, QACheckItem, TextBlock
from .base import (
    BaseVisionProvider,
    BaseLanguageDetectionProvider,
    BaseTranslationProvider,
    BaseTypographyProvider,
    BaseImageEditingProvider,
    BaseQAProvider
)

class MockVisionProvider(BaseVisionProvider):
    """
    High-accuracy local OCR vision engine utilizing RapidOCR (ONNX)
    or synthetic semantic region generator.
    """
    def __init__(self):
        try:
            from ocr_engine import OCREngine
            self.ocr = OCREngine()
        except Exception:
            self.ocr = None

    def detect_regions(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        if self.ocr:
            try:
                results = self.ocr.detect_text(img_bgr)
                if results:
                    return results
            except Exception:
                pass
        
        # Fallback synthetic detection for standard demo graphics
        h, w = img_bgr.shape[:2]
        return [
            {
                "id": "text_001",
                "text": "BOOSTER",
                "confidence": 0.99,
                "boundingBox": {"x": int(w * 0.3), "y": int(h * 0.35), "width": int(w * 0.4), "height": int(h * 0.15)},
                "polygon": [[int(w * 0.3), int(h * 0.35)], [int(w * 0.7), int(h * 0.35)], [int(w * 0.7), int(h * 0.5)], [int(w * 0.3), int(h * 0.5)]],
                "rotation": 0.0
            }
        ]

class MockLanguageDetectionProvider(BaseLanguageDetectionProvider):
    """Detects source language and script using regex heuristics & Unicode blocks."""
    def detect_language(self, text: str) -> Dict[str, Any]:
        t = text.strip()
        if not t:
            return {"language": "English", "code": "en", "script": "Latin", "direction": "ltr", "confidence": 0.95}

        # Check CJK
        if any('\u4e00' <= char <= '\u9fff' for char in t):
            # Check Kana for Japanese
            if any('\u3040' <= char <= '\u30ff' for char in t):
                return {"language": "Japanese", "code": "ja", "script": "Japanese", "direction": "ltr", "confidence": 0.99}
            return {"language": "Chinese", "code": "zh-CN", "script": "Han", "direction": "ltr", "confidence": 0.98}

        # Check Hangul for Korean
        if any('\uac00' <= char <= '\ud7af' for char in t):
            return {"language": "Korean", "code": "ko", "script": "Hangul", "direction": "ltr", "confidence": 0.99}

        # Check Devanagari for Hindi/Marathi
        if any('\u0900' <= char <= '\u097f' for char in t):
            return {"language": "Hindi", "code": "hi", "script": "Devanagari", "direction": "ltr", "confidence": 0.99}

        # Check Arabic
        if any('\u0600' <= char <= '\u06ff' for char in t):
            return {"language": "Arabic", "code": "ar", "script": "Arabic", "direction": "rtl", "confidence": 0.99}

        # Check Cyrillic
        if any('\u0400' <= char <= '\u04ff' for char in t):
            return {"language": "Russian", "code": "ru", "script": "Cyrillic", "direction": "ltr", "confidence": 0.97}

        # Check Hebrew
        if any('\u0590' <= char <= '\u05ff' for char in t):
            return {"language": "Hebrew", "code": "he", "script": "Hebrew", "direction": "rtl", "confidence": 0.99}

        # Default Latin
        return {"language": "English", "code": "en", "script": "Latin", "direction": "ltr", "confidence": 0.99}

class MockTranslationProvider(BaseTranslationProvider):
    """Contextual translation provider backed by TranslationService & domain dictionaries."""
    def __init__(self):
        from translator import TranslationService
        self.service = TranslationService()

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[str] = None,
        text_type: Optional[str] = None,
        glossary: Optional[Dict[str, Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        clean = text.strip()
        upper = clean.upper()

        # Check user-defined glossary override first
        if glossary and upper in glossary:
            if target_lang in glossary[upper]:
                return {
                    "sourceText": clean,
                    "targetText": glossary[upper][target_lang],
                    "targetLanguage": target_lang,
                    "confidence": 1.0,
                    "isGlossaryOverride": True
                }

        translated = self.service.translate_text(clean, source_lang=source_lang, target_lang=target_lang)
        return {
            "sourceText": clean,
            "targetText": translated,
            "targetLanguage": target_lang,
            "confidence": 0.98,
            "isGlossaryOverride": False
        }

class MockTypographyProvider(BaseTypographyProvider):
    """Extracts typography styling, colors, 3D shadows, and stroke from image regions."""
    def __init__(self):
        from style_analyzer import StyleAnalyzer
        self.analyzer = StyleAnalyzer()

    def analyze_typography(self, img_bgr: np.ndarray, region_data: Dict[str, Any]) -> StyleInfo:
        return self.analyzer.analyze_style(img_bgr, region_data)

class MockImageEditingProvider(BaseImageEditingProvider):
    """Inpainting & script-native text rendering engine."""
    def __init__(self):
        from inpainter import TextInpainter
        from text_renderer import TextRenderer
        self.inpainter = TextInpainter(inpaint_radius=4, method="telea")
        self.renderer = TextRenderer()

    def inpaint_text_regions(self, img_bgr: np.ndarray, regions: List[Dict[str, Any]]) -> np.ndarray:
        inpainted, _ = self.inpainter.remove_text(img_bgr, regions, dilation_px=3)
        return inpainted

    def render_text(self, background_bgr: np.ndarray, text_blocks: List[TextBlock], target_lang: str) -> np.ndarray:
        return self.renderer.render_all_blocks(background_bgr, text_blocks, target_lang=target_lang)

class MockQAProvider(BaseQAProvider):
    """Localization QA validator."""
    def __init__(self):
        from qa_engine import LocalizationQAEngine
        self.qa = LocalizationQAEngine()

    def validate(
        self,
        original_img: np.ndarray,
        localized_img: np.ndarray,
        text_blocks: List[TextBlock],
        target_lang: str
    ) -> QAResult:
        h, w = original_img.shape[:2]
        return self.qa.validate_localization(
            original_img=original_img,
            localized_img=localized_img,
            text_blocks=text_blocks,
            target_lang=target_lang,
            image_w=w,
            image_h=h
        )
