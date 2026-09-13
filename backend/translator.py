import os
import re
import time
import urllib.parse
import urllib.request
import json
from typing import List, Dict, Any, Optional
from deep_translator import GoogleTranslator
from models import SupportedLanguage

SUPPORTED_LANGUAGES: List[SupportedLanguage] = [
    SupportedLanguage(code="fr", name="French", nativeName="Français"),
    SupportedLanguage(code="es", name="Spanish", nativeName="Español"),
    SupportedLanguage(code="de", name="German", nativeName="Deutsch"),
    SupportedLanguage(code="it", name="Italian", nativeName="Italiano"),
    SupportedLanguage(code="pt", name="Portuguese", nativeName="Português"),
    SupportedLanguage(code="nl", name="Dutch", nativeName="Nederlands"),
    SupportedLanguage(code="zh-CN", name="Chinese (Simplified)", nativeName="简体中文"),
    SupportedLanguage(code="zh-TW", name="Chinese (Traditional)", nativeName="繁體中文"),
    SupportedLanguage(code="ja", name="Japanese", nativeName="日本語"),
    SupportedLanguage(code="ko", name="Korean", nativeName="한국어"),
    SupportedLanguage(code="hi", name="Hindi", nativeName="हिन्दी"),
    SupportedLanguage(code="ar", name="Arabic", nativeName="العربية", isRtl=True),
    SupportedLanguage(code="ru", name="Russian", nativeName="Русский"),
    SupportedLanguage(code="pl", name="Polish", nativeName="Polski"),
    SupportedLanguage(code="en", name="English", nativeName="English"),
]

LANGUAGE_CODE_MAP = {
    "zh-cn": "zh-CN",
    "zh-tw": "zh-TW",
    "zh": "zh-CN",
    "chinese": "zh-CN",
    "french": "fr",
    "german": "de",
    "spanish": "es",
    "italian": "it",
    "portuguese": "pt",
    "dutch": "nl",
    "japanese": "ja",
    "korean": "ko",
    "hindi": "hi",
    "arabic": "ar",
    "russian": "ru",
    "polish": "pl",
    "english": "en",
}

# Offline UI / gaming / e-commerce dictionary fallback
COMMON_UI_DICTIONARY = {
    "START GAME": {
        "fr": "COMMENCER LA PARTIE",
        "es": "INICIAR JUEGO",
        "de": "SPIEL STARTEN",
        "it": "INIZIA GIOCO",
        "pt": "INICIAR JOGO",
        "nl": "START SPEL",
        "zh-CN": "开始游戏",
        "zh-TW": "開始遊戲",
        "ja": "ゲーム開始",
        "ko": "게임 시작",
        "hi": "खेल शुरू करें",
        "ar": "ابدأ اللعبة",
        "ru": "НАЧАТЬ ИГРУ",
        "pl": "ROZPOCZNIJ GRĘ",
    },
    "SELECT BET": {
        "fr": "SÉLECTIONNER LA MISE",
        "es": "SELECCIONAR APUESTA",
        "de": "EINSATZ WÄHLEN",
        "it": "SELEZIONA PUNTATA",
        "pt": "SELECIONAR APOSTA",
        "nl": "SELECTEER INZET",
        "zh-CN": "选择下注",
        "zh-TW": "選擇下注",
        "ja": "ベットを選択",
        "ko": "베팅 선택",
        "hi": "दांव चुनें",
        "ar": "اختر الرهان",
        "ru": "ВЫБРАТЬ СТАВКУ",
        "pl": "WYBIERZ ZAKŁAD",
    },
    "WINNER": {
        "fr": "GAGNANT",
        "es": "GANADOR",
        "de": "GEWINNER",
        "it": "VINCITORE",
        "pt": "VENCEDOR",
        "nl": "WINNAAR",
        "zh-CN": "获胜者",
        "zh-TW": "獲勝者",
        "ja": "勝者",
        "ko": "승리자",
        "hi": "विजेता",
        "ar": "الفائز",
        "ru": "ПОБЕДИТЕЛЬ",
        "pl": "ZWYCIĘZCA",
    },
    "SPECIAL OFFER": {
        "fr": "OFFRE SPÉCIALE",
        "es": "OFERTA ESPECIAL",
        "de": "SONDERANGEBOT",
        "it": "OFFERTA SPECIALE",
        "pt": "OFERTA ESPECIAL",
        "zh-CN": "特别优惠",
        "ja": "特別オファー",
        "ko": "특별 혜택",
        "hi": "विशेष ऑफर",
        "ar": "عرض خاص",
        "ru": "СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ",
    },
    "SUMMER MEGA SALE": {
        "fr": "GRANDE VENTE D'ÉTÉ",
        "es": "MEGA VENTA DE VERANO",
        "de": "SOMMER-MEGA-VERKAUF",
        "zh-CN": "夏季大促销",
        "ja": "サマーメガセール",
        "ko": "여름 메가 세일",
        "hi": "समर मेगा सेल",
        "ar": "تخفيضات الصيف الكبرى",
        "ru": "ЛЕТНЯЯ МЕГА-РАСПРОДАЖА",
    },
    "SHOP NOW": {
        "fr": "ACHETER MAINTENANT",
        "es": "COMPRAR AHORA",
        "de": "JETZT EINKAUFEN",
        "zh-CN": "立即购买",
        "ja": "今すぐ購入",
        "ko": "지금 쇼핑하기",
        "hi": "अभी खरीदें",
        "ar": "تسوق الآن",
        "ru": "КУПИТЬ СЕЙЧАС",
    },
    "HIGHS": {
        "fr": "HAUTS",
        "es": "ALTOS",
        "de": "HÖHEN",
        "it": "ALTI",
        "zh-CN": "高潮",
        "ja": "高み",
        "ko": "정점",
        "hi": "शीर्ष",
        "ar": "قمم",
        "ru": "ВЕРШИНЫ",
    },
    "HICHS": {
        "fr": "HAUTS",
        "es": "ALTOS",
        "de": "HÖHEN",
        "it": "ALTI",
        "zh-CN": "高潮",
        "ja": "高み",
        "ko": "정점",
        "hi": "शीर्ष",
        "ar": "قمم",
        "ru": "ВЕРШИНЫ",
    },
    "AND": {
        "fr": "ET",
        "es": "Y",
        "de": "UND",
        "it": "E",
        "zh-CN": "与",
        "ja": "と",
        "ko": "그리고",
        "hi": "और",
        "ar": "و",
        "ru": "И",
    },
    "LOWS": {
        "fr": "BAS",
        "es": "BAJOS",
        "de": "TIEFEN",
        "it": "BASSI",
        "zh-CN": "低谷",
        "ja": "底",
        "ko": "저점",
        "hi": "गर्त",
        "ar": "قيعان",
        "ru": "НИЗИНЫ",
    },
    "HIGHS AND LOWS": {
        "fr": "HAUTS ET BAS",
        "es": "ALTOS Y BAJOS",
        "de": "HÖHEN UND TIEFEN",
        "it": "ALTI E BASSI",
        "zh-CN": "起起落落",
        "ja": "浮き沈み",
        "ko": "우여곡절",
        "hi": "उतार-चढ़ाव",
        "ar": "تقلبات",
        "ru": "ВЗЛЕТЫ И ПАДЕНИЯ",
    }
}

class TranslationService:
    def __init__(self):
        self.cache: Dict[str, str] = {}

    def _match_casing(self, original: str, translated: str) -> str:
        if not original or not translated:
            return translated
        letters_orig = [c for c in original if c.isalpha()]
        if letters_orig and all(c.isupper() for c in letters_orig):
            return translated.upper()
        if original.istitle():
            return translated.title()
        return translated

    def _http_translate_fallback(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """
        Direct lightweight fallback translation via Google Translate HTTP client.
        """
        try:
            sl = "auto" if not source_lang or source_lang == "auto" else source_lang
            tl = LANGUAGE_CODE_MAP.get(target_lang.lower(), target_lang)
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={urllib.parse.quote(text)}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                if res_json and len(res_json) > 0 and res_json[0]:
                    translated_parts = [part[0] for part in res_json[0] if part and part[0]]
                    return "".join(translated_parts)
        except Exception:
            pass
        return None

    def translate_text(self, text: str, source_lang: str = "auto", target_lang: str = "en") -> str:
        clean_text = text.strip()
        if not clean_text:
            return text

        # Skip translation for pure numbers or symbols
        if re.match(r'^[\d\s\.,:;\-_+=\$%#@!&*()]+$', clean_text):
            return text

        cache_key = f"{source_lang}:{target_lang}:{clean_text}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        tgt_code = LANGUAGE_CODE_MAP.get(target_lang.lower(), target_lang)
        upper_text = clean_text.upper()

        # 1. Check UI dictionary for exact common match
        if upper_text in COMMON_UI_DICTIONARY and tgt_code in COMMON_UI_DICTIONARY[upper_text]:
            res = COMMON_UI_DICTIONARY[upper_text][tgt_code]
            final_res = self._match_casing(clean_text, res)
            self.cache[cache_key] = final_res
            return final_res

        # 2. Try HTTP API
        http_res = self._http_translate_fallback(clean_text, source_lang, target_lang)
        if http_res:
            final_res = self._match_casing(clean_text, http_res)
            self.cache[cache_key] = final_res
            return final_res

        # 3. Try DeepTranslator
        try:
            translator = GoogleTranslator(source=source_lang if source_lang != "auto" else "auto", target=tgt_code)
            res = translator.translate(clean_text)
            if res:
                final_res = self._match_casing(clean_text, res)
                self.cache[cache_key] = final_res
                return final_res
        except Exception:
            pass

        return clean_text

    def translate_batch(self, items: List[Dict[str, Any]], source_lang: str = "auto", target_lang: str = "en") -> List[Dict[str, Any]]:
        results = []
        for item in items:
            orig_text = item.get("text", "")
            translated = self.translate_text(orig_text, source_lang=source_lang, target_lang=target_lang)
            item_copy = dict(item)
            item_copy["translatedText"] = translated
            results.append(item_copy)
        return results

    @staticmethod
    def get_supported_languages() -> List[SupportedLanguage]:
        return SUPPORTED_LANGUAGES
