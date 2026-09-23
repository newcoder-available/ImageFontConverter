import re
from typing import Dict, Any, Tuple
from models import TextClassificationType, TextRegionType

class TextClassificationAgent:
    """
    Classifies detected text regions into TRANSLATABLE, PROTECTED, or AMBIGUOUS.
    Protects brand names, logos, URLs, email addresses, numbers, model codes, and serial numbers.
    """
    URL_REGEX = re.compile(r'^(https?:\/\/|www\.)[^\s]+$', re.IGNORECASE)
    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    PURE_NUMBER_REGEX = re.compile(r'^[\d\s\.,:;\-_+=\$%#@!&*()\/\\|<>~`\'"€£¥₹]+$')
    SERIAL_CODE_REGEX = re.compile(r'^[A-Z0-9]{2,}[-_][A-Z0-9]{2,}$')
    
    # Common global brand marks that should not be translated by default unless overridden
    GLOBAL_PROTECTED_BRANDS = {
        "NIKE", "ADIDAS", "APPLE", "GOOGLE", "MICROSOFT", "SONY", "SAMSUNG", "PLAYSTATION",
        "XBOX", "NINTENDO", "STEAM", "DISCORD", "TWITCH", "YOUTUBE", "TIKTOK", "INSTAGRAM",
        "FACEBOOK", "TWITTER", "BMW", "MERCEDES", "AUDI", "PORSCHE", "COCA-COLA", "PEPSI"
    }

    def classify_text(self, text: str, confidence: float = 1.0, box_w: int = 100, box_h: int = 40) -> Tuple[str, str, int]:
        """
        Returns (classification, text_type, hierarchy_level)
        classification: TRANSLATABLE | PROTECTED | AMBIGUOUS
        text_type: headline | title | subtitle | button | badge | body | logo | label
        hierarchy: 1 (primary) to 4 (minor)
        """
        clean = text.strip()
        upper = clean.upper()

        # 1. Pure numbers or currency symbols
        if self.PURE_NUMBER_REGEX.match(clean):
            return TextClassificationType.PROTECTED.value, TextRegionType.LABEL.value, 3

        # 2. URLs or emails
        if self.URL_REGEX.match(clean) or self.EMAIL_REGEX.match(clean):
            return TextClassificationType.PROTECTED.value, TextRegionType.LABEL.value, 4

        # 3. Model numbers or serial identifiers (e.g. RTX-4090, PRO-MAX-2)
        if self.SERIAL_CODE_REGEX.match(clean):
            return TextClassificationType.PROTECTED.value, TextRegionType.LABEL.value, 3

        # 4. Known protected brand marks
        if upper in self.GLOBAL_PROTECTED_BRANDS:
            return TextClassificationType.PROTECTED.value, TextRegionType.LOGO.value, 1

        # 5. Determine UI hierarchy & type based on size & semantics
        if box_h >= 60 or (box_w > 300 and box_h >= 45):
            text_type = TextRegionType.HEADLINE.value
            hierarchy = 1
        elif any(btn_kw in upper for btn_kw in ["START", "PLAY", "BUY", "SHOP", "DOWNLOAD", "CLAIM", "JOIN", "OPEN", "SUBMIT"]):
            text_type = TextRegionType.BUTTON.value
            hierarchy = 2
        elif any(badge_kw in upper for badge_kw in ["OFF", "SALE", "NEW", "HOT", "VIP", "PRO", "FREE", "LIMITED", "MAX"]):
            text_type = TextRegionType.BADGE.value
            hierarchy = 2
        elif len(clean.split()) > 4:
            text_type = TextRegionType.BODY.value
            hierarchy = 3
        else:
            text_type = TextRegionType.TITLE.value
            hierarchy = 2

        # 6. Single ambiguous character/fragment
        if len(clean) == 1 and not clean.isalpha():
            return TextClassificationType.AMBIGUOUS.value, text_type, hierarchy

        return TextClassificationType.TRANSLATABLE.value, text_type, hierarchy
