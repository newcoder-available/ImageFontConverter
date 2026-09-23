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
    SupportedLanguage(
        code="en", name="English", nativeName="English", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Montserrat", "Impact"]
    ),
    SupportedLanguage(
        code="ja", name="Japanese", nativeName="日本語", script="Japanese (Kanji/Kana)", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans JP", "M PLUS Rounded 1c", "Hiragino Kaku Gothic Pro"]
    ),
    SupportedLanguage(
        code="hi", name="Hindi", nativeName="हिन्दी", script="Devanagari", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Devanagari", "Tiro Devanagari Hindi", "Poppins"]
    ),
    SupportedLanguage(
        code="zh-CN", name="Chinese (Simplified)", nativeName="简体中文", script="Han (Simplified)", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans SC", "Source Han Sans CN", "Microsoft YaHei"]
    ),
    SupportedLanguage(
        code="zh-TW", name="Chinese (Traditional)", nativeName="繁體中文", script="Han (Traditional)", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans TC", "Source Han Sans TC", "Microsoft JhengHei"]
    ),
    SupportedLanguage(
        code="ko", name="Korean", nativeName="한국어", script="Hangul", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans KR", "Nanum Gothic", "Malgun Gothic"]
    ),
    SupportedLanguage(
        code="de", name="German", nativeName="Deutsch", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Oswald", "Montserrat"]
    ),
    SupportedLanguage(
        code="fr", name="French", nativeName="Français", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Lato", "Montserrat"]
    ),
    SupportedLanguage(
        code="es", name="Spanish", nativeName="Español", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Poppins", "Montserrat"]
    ),
    SupportedLanguage(
        code="it", name="Italian", nativeName="Italiano", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Playfair Display", "Montserrat"]
    ),
    SupportedLanguage(
        code="pt", name="Portuguese", nativeName="Português", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Rubik", "Montserrat"]
    ),
    SupportedLanguage(
        code="ar", name="Arabic", nativeName="العربية", script="Arabic", direction="rtl", isRtl=True,
        recommendedFonts=["Noto Sans Arabic", "Cairo", "Tajawal", "Amiri"]
    ),
    SupportedLanguage(
        code="he", name="Hebrew", nativeName="עברית", script="Hebrew", direction="rtl", isRtl=True,
        recommendedFonts=["Noto Sans Hebrew", "Heebo", "Assistant", "Rubik"]
    ),
    SupportedLanguage(
        code="ru", name="Russian", nativeName="Русский", script="Cyrillic", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans", "Roboto", "Rubik", "Oswald"]
    ),
    SupportedLanguage(
        code="uk", name="Ukrainian", nativeName="Українська", script="Cyrillic", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans", "Roboto", "Montserrat", "Rubik"]
    ),
    SupportedLanguage(
        code="nl", name="Dutch", nativeName="Nederlands", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Open Sans", "Montserrat"]
    ),
    SupportedLanguage(
        code="th", name="Thai", nativeName="ไทย", script="Thai", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Thai", "Prompt", "Kanit", "Sarabun"]
    ),
    SupportedLanguage(
        code="vi", name="Vietnamese", nativeName="Tiếng Việt", script="Latin (Vietnamese)", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Be Vietnam Pro", "Inter", "Nunito"]
    ),
    SupportedLanguage(
        code="id", name="Indonesian", nativeName="Bahasa Indonesia", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Poppins", "Montserrat"]
    ),
    SupportedLanguage(
        code="ms", name="Malay", nativeName="Bahasa Melayu", script="Latin", direction="ltr", isRtl=False,
        recommendedFonts=["Roboto", "Inter", "Poppins", "Montserrat"]
    ),
    SupportedLanguage(
        code="bn", name="Bengali", nativeName="বাংলা", script="Bengali", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Bengali", "Hind Siliguri", "Galada"]
    ),
    SupportedLanguage(
        code="ta", name="Tamil", nativeName="தமிழ்", script="Tamil", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Tamil", "Mukta Malar", "Pavanam"]
    ),
    SupportedLanguage(
        code="te", name="Telugu", nativeName="తెలుగు", script="Telugu", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Telugu", "Suranna", "Ramabhadra"]
    ),
    SupportedLanguage(
        code="mr", name="Marathi", nativeName="मराठी", script="Devanagari", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Devanagari", "Mukta", "Poppins"]
    ),
    SupportedLanguage(
        code="gu", name="Gujarati", nativeName="ગુજરાતી", script="Gujarati", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Gujarati", "Rasa", "Mogra"]
    ),
    SupportedLanguage(
        code="pa", name="Punjabi", nativeName="ਪੰਜਾਬੀ", script="Gurmukhi", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Gurmukhi", "Mukta Mahee"]
    ),
    SupportedLanguage(
        code="kn", name="Kannada", nativeName="ಕನ್ನಡ", script="Kannada", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Kannada", "Baloo Tamma 2"]
    ),
    SupportedLanguage(
        code="ml", name="Malayalam", nativeName="മലയാളം", script="Malayalam", direction="ltr", isRtl=False,
        recommendedFonts=["Noto Sans Malayalam", "Manjari", "Gayathri"]
    )
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
    "hebrew": "he",
    "russian": "ru",
    "ukrainian": "uk",
    "thai": "th",
    "vietnamese": "vi",
    "indonesian": "id",
    "malay": "ms",
    "bengali": "bn",
    "tamil": "ta",
    "telugu": "te",
    "marathi": "mr",
    "gujarati": "gu",
    "punjabi": "pa",
    "kannada": "kn",
    "malayalam": "ml",
    "english": "en",
}

# Offline UI / gaming / e-commerce dictionary fallback for rock-solid performance
COMMON_UI_DICTIONARY: Dict[str, Dict[str, str]] = {
    "BOOSTER": {
        "ja": "ブースター",
        "hi": "बूस्टर",
        "zh-CN": "助推器",
        "zh-TW": "推進器",
        "ko": "부스터",
        "de": "BOOSTER",
        "fr": "BOOSTER",
        "es": "PROPULSOR",
        "it": "BOOSTER",
        "pt": "IMPULSIONADOR",
        "ar": "معزز",
        "he": "מאיץ",
        "ru": "УСКОРИТЕЛЬ",
        "uk": "ПРИСКОРЮВАЧ",
        "nl": "BOOSTER",
        "th": "บูสเตอร์",
        "vi": "TĂNG TỐC",
        "id": "PENINGKAT",
        "ms": "PENGGALAK",
        "bn": "বুস্টার",
        "ta": "பூஸ்டர்",
        "te": "బూస్టర్",
        "mr": "बूस्टर",
        "gu": "બૂસ્ટર",
        "pa": "ਬੂਸਟਰ",
        "kn": "ಬೂಸ್ಟರ್",
        "ml": "ബൂസ്റ്റർ",
    },
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
        "he": "התחל משחק",
        "ru": "НАЧАТЬ ИГРУ",
        "uk": "ПОЧАТИ ГРУ",
        "th": "เริ่มเกม",
        "vi": "BẮT ĐẦU CHƠI",
        "id": "MULAI PERMAINAN",
        "bn": "খেলা শুরু করুন",
        "ta": "விளையாட்டை தொடங்கு",
        "te": "ఆట ప్రారంభించండి",
    },
    "SPECIAL OFFER": {
        "fr": "OFFRE SPÉCIALE",
        "es": "OFERTA ESPECIAL",
        "de": "SONDERANGEBOT",
        "it": "OFFERTA SPECIALE",
        "pt": "OFERTA ESPECIAL",
        "nl": "SPECIALE AANBIEDING",
        "zh-CN": "特别优惠",
        "zh-TW": "特別優惠",
        "ja": "特別オファー",
        "ko": "특별 혜택",
        "hi": "विशेष ऑफर",
        "ar": "عرض خاص",
        "he": "הצעה מיוחדת",
        "ru": "СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ",
        "uk": "СПЕЦІАЛЬНА ПРОПОЗИЦІЯ",
        "th": "ข้อเสนอพิเศษ",
        "vi": "ƯU ĐÃI ĐẶC BIỆT",
        "id": "PENAWARAN SPESIAL",
        "bn": "বিশেষ অফার",
        "ta": "சிறப்பு சலுகை",
        "te": "ప్రత్యేక ఆఫర్",
    },
    "SUMMER MEGA SALE": {
        "fr": "GRANDE VENTE D'ÉTÉ",
        "es": "MEGA VENTA DE VERANO",
        "de": "SOMMER-MEGA-VERKAUF",
        "it": "MEGA SALDI ESTIVI",
        "pt": "MEGA LIQUIDAÇÃO DE VERÃO",
        "zh-CN": "夏季大促销",
        "zh-TW": "夏季大特賣",
        "ja": "サマーメガセール",
        "ko": "여름 메가 세일",
        "hi": "समर मेगा सेल",
        "ar": "تخفيضات الصيف الكبرى",
        "he": "מבצע קיץ ענק",
        "ru": "ЛЕТНЯЯ МЕГА-РАСПРОДАЖА",
        "uk": "ЛІТНІЙ МЕГА РОЗПРОДАЖ",
        "th": "มหกรรมลดราคาฤดูร้อน",
        "vi": "ĐẠI TIỆC GIẢM GIÁ MÙA HÈ",
        "id": "MEGA DISKON MUSIM PANAS",
        "bn": "গ্রীষ্মকালীন মেগা সেল",
        "ta": "கோடைக்கால மெகா விற்பனை",
    },
    "SHOP NOW": {
        "fr": "ACHETER MAINTENANT",
        "es": "COMPRAR AHORA",
        "de": "JETZT EINKAUFEN",
        "it": "ACQUISTA ORA",
        "pt": "COMPRE AGORA",
        "nl": "NU WINKELEN",
        "zh-CN": "立即购买",
        "zh-TW": "立即購買",
        "ja": "今すぐ購入",
        "ko": "지금 쇼핑하기",
        "hi": "अभी खरीदें",
        "ar": "تسوق الآن",
        "he": "קנה עכשיו",
        "ru": "КУПИТЬ СЕЙЧАС",
        "uk": "КУПУЙТЕ ЗАРАЗ",
        "th": "ช้อปเลย",
        "vi": "MUA NGAY",
        "id": "BELANJA SEKARANG",
        "bn": "এখনই কিনুন",
        "ta": "இப்போதே வாங்குங்கள்",
        "te": "ఇప్పుడే కొనండి",
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
        "he": "מנצח",
        "ru": "ПОБЕДИТЕЛЬ",
        "uk": "ПЕРЕМОЖЕЦЬ",
        "th": "ผู้ชนะ",
        "vi": "NGƯỜI CHIẾN THẮNG",
        "id": "PEMENANG",
        "bn": "বিজয়ী",
        "ta": "வெற்றியாளர்",
        "te": "విజేత",
    },
    "HIGHS AND LOWS": {
        "fr": "HAUTS ET BAS",
        "es": "ALTOS Y BAJOS",
        "de": "HÖHEN UND TIEFEN",
        "it": "ALTI E BASSI",
        "pt": "ALTOS E BAIXOS",
        "zh-CN": "起起落落",
        "zh-TW": "起起落落",
        "ja": "浮き沈み",
        "ko": "우여곡절",
        "hi": "उतार-चढ़ाव",
        "ar": "تقلبات",
        "he": "עליות ומורדות",
        "ru": "ВЗЛЕТЫ И ПАДЕНИЯ",
        "uk": "ЗЛЕТИ І ПАДІННЯ",
        "th": "ขึ้นๆ ลงๆ",
        "vi": "THĂNG TRẦM",
        "id": "PASANG SURUT",
        "bn": "উত্থান-পতন",
        "ta": "ஏற்ற இறக்கங்கள்",
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
        try:
            sl = "auto" if not source_lang or source_lang == "auto" else source_lang
            tl = LANGUAGE_CODE_MAP.get(target_lang.lower(), target_lang)
            # Standardize for Google Translate single endpoint
            if tl == "zh-CN":
                tl = "zh-CN"
            elif tl == "zh-TW":
                tl = "zh-TW"
            elif "-" in tl:
                tl = tl.split("-")[0]

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

        # Skip translation for pure numbers, symbols, measurements or identifiers
        if re.match(r'^[\d\s\.,:;\-_+=\$%#@!&*()\/\\|<>~`\'"]+$', clean_text):
            return text

        cache_key = f"{source_lang}:{target_lang}:{clean_text}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        tgt_code = LANGUAGE_CODE_MAP.get(target_lang.lower(), target_lang)
        upper_text = clean_text.upper()

        # 1. UI Dictionary lookup
        if upper_text in COMMON_UI_DICTIONARY and tgt_code in COMMON_UI_DICTIONARY[upper_text]:
            res = COMMON_UI_DICTIONARY[upper_text][tgt_code]
            final_res = self._match_casing(clean_text, res)
            self.cache[cache_key] = final_res
            return final_res

        # 2. HTTP Google Translate fallback
        http_res = self._http_translate_fallback(clean_text, source_lang, target_lang)
        if http_res:
            final_res = self._match_casing(clean_text, http_res)
            self.cache[cache_key] = final_res
            return final_res

        # 3. DeepTranslator fallback
        try:
            dt_tgt = tgt_code.lower()
            if dt_tgt == "zh-cn":
                dt_tgt = "zh-CN"
            elif dt_tgt == "zh-tw":
                dt_tgt = "zh-TW"
            translator = GoogleTranslator(source=source_lang if source_lang != "auto" else "auto", target=dt_tgt)
            res = translator.translate(clean_text)
            if res:
                final_res = self._match_casing(clean_text, res)
                self.cache[cache_key] = final_res
                return final_res
        except Exception:
            pass

        return clean_text

    @staticmethod
    def get_supported_languages() -> List[SupportedLanguage]:
        return SUPPORTED_LANGUAGES

    @staticmethod
    def get_language_by_code(code: str) -> Optional[SupportedLanguage]:
        normalized = code.lower().replace("_", "-")
        for lang in SUPPORTED_LANGUAGES:
            if lang.code.lower() == normalized:
                return lang
        return None
