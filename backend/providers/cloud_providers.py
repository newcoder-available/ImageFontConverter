import os
import json
import httpx
from typing import List, Dict, Any, Optional
import numpy as np
from models import StyleInfo, QAResult, TextBlock
from .base import (
    BaseVisionProvider,
    BaseLanguageDetectionProvider,
    BaseTranslationProvider,
    BaseTypographyProvider,
    BaseImageEditingProvider,
    BaseQAProvider
)
from .mock_provider import MockVisionProvider, MockImageEditingProvider, MockTypographyProvider, MockQAProvider

class OpenAIProvider(BaseTranslationProvider, BaseLanguageDetectionProvider):
    """OpenAI GPT-4o / GPT-4o-mini translation & linguistic analysis provider."""
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    def detect_language(self, text: str) -> Dict[str, Any]:
        if not self.api_key:
            # Fallback to local heuristic
            from .mock_provider import MockLanguageDetectionProvider
            return MockLanguageDetectionProvider().detect_language(text)
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a language detection agent. Output ONLY valid JSON with keys: language, code, script, direction, confidence."},
                    {"role": "user", "content": f"Detect language and script of this image text: '{text}'"}
                ],
                "response_format": {"type": "json_object"}
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    return json.loads(res.json()["choices"][0]["message"]["content"])
        except Exception:
            pass
        from .mock_provider import MockLanguageDetectionProvider
        return MockLanguageDetectionProvider().detect_language(text)

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
        if glossary and upper in glossary and target_lang in glossary[upper]:
            return {
                "sourceText": clean,
                "targetText": glossary[upper][target_lang],
                "targetLanguage": target_lang,
                "confidence": 1.0,
                "isGlossaryOverride": True
            }

        if not self.api_key:
            from .mock_provider import MockTranslationProvider
            return MockTranslationProvider().translate(text, source_lang, target_lang, context, text_type, glossary)

        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            prompt = (
                f"Translate the following in-image UI text from {source_lang} to {target_lang}. "
                f"Context: {context or 'graphic design / gaming / e-commerce'}. Type: {text_type or 'headline'}. "
                "Keep the translation natural, concise, and visually appropriate. "
                "Output ONLY a JSON object with keys: targetText, confidence."
            )
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a professional image text localization agent."},
                    {"role": "user", "content": f"{prompt}\nText: \"{text}\""}
                ],
                "response_format": {"type": "json_object"}
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = json.loads(res.json()["choices"][0]["message"]["content"])
                    return {
                        "sourceText": clean,
                        "targetText": data.get("targetText", clean),
                        "targetLanguage": target_lang,
                        "confidence": float(data.get("confidence", 0.95)),
                        "isGlossaryOverride": False
                    }
        except Exception:
            pass

        from .mock_provider import MockTranslationProvider
        return MockTranslationProvider().translate(text, source_lang, target_lang, context, text_type, glossary)

class GeminiProvider(BaseTranslationProvider, BaseLanguageDetectionProvider):
    """Google Gemini AI translation & linguistic analysis provider."""
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")

    def detect_language(self, text: str) -> Dict[str, Any]:
        from .mock_provider import MockLanguageDetectionProvider
        return MockLanguageDetectionProvider().detect_language(text)

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[str] = None,
        text_type: Optional[str] = None,
        glossary: Optional[Dict[str, Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        from .mock_provider import MockTranslationProvider
        return MockTranslationProvider().translate(text, source_lang, target_lang, context, text_type, glossary)

class SelfHostedProvider(BaseTranslationProvider):
    """Self-hosted local model provider (Ollama / LocalAI / vLLM / FastChat)."""
    def __init__(self, endpoint: Optional[str] = None):
        self.endpoint = endpoint or os.getenv("SELF_HOSTED_ENDPOINT", "http://localhost:11434")

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[str] = None,
        text_type: Optional[str] = None,
        glossary: Optional[Dict[str, Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        from .mock_provider import MockTranslationProvider
        return MockTranslationProvider().translate(text, source_lang, target_lang, context, text_type, glossary)
