import os
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
from typing import List, Dict, Any, Tuple, Optional
from models import TextBlock, StyleInfo

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")

# Language code to preferred font filename mappings
LANGUAGE_FONT_MAP = {
    "ar": "NotoSansArabic-Regular.ttf",
    "arabic": "NotoSansArabic-Regular.ttf",
    "hi": "NotoSansDevanagari-Regular.ttf",
    "hindi": "NotoSansDevanagari-Regular.ttf",
    "zh-cn": "msyh.ttc",
    "zh-tw": "msyh.ttc",
    "zh": "msyh.ttc",
    "chinese": "msyh.ttc",
    "ja": "msgothic.ttc",
    "japanese": "msgothic.ttc",
    "ko": "malgun.ttf",
    "korean": "malgun.ttf",
    "ru": "NotoSans-Regular.ttf",
    "russian": "NotoSans-Regular.ttf",
    "default": "NotoSans-Regular.ttf",
    "bold": "NotoSans-Bold.ttf",
}

AVAILABLE_FONTS = [
    {"id": "noto_sans", "name": "Noto Sans (Universal)", "category": "Sans Serif", "isUnicode": True},
    {"id": "msyh", "name": "Microsoft YaHei (Chinese)", "category": "Sans Serif", "isUnicode": True},
    {"id": "msgothic", "name": "MS Gothic (Japanese)", "category": "Sans Serif", "isUnicode": True},
    {"id": "malgun", "name": "Malgun Gothic (Korean)", "category": "Sans Serif", "isUnicode": True},
    {"id": "noto_devanagari", "name": "Noto Sans Devanagari (Hindi)", "category": "Sans Serif", "isUnicode": True},
    {"id": "noto_arabic", "name": "Noto Sans Arabic (Arabic RTL)", "category": "Sans Serif", "isUnicode": True},
    {"id": "arial", "name": "Arial", "category": "Sans Serif", "isUnicode": True},
    {"id": "tahoma", "name": "Tahoma", "category": "Sans Serif", "isUnicode": True},
]

class TextRenderer:
    def __init__(self, font_dir: str = FONT_DIR):
        self.font_dir = font_dir
        self.font_cache: Dict[str, ImageFont.FreeTypeFont] = {}

    def get_font_for_language(self, target_lang: str, weight: str = "bold", requested_family: Optional[str] = None) -> str:
        """
        Resolves the best font file path for the target language and weight.
        """
        lang_key = target_lang.lower().replace("_", "-")
        
        # Check specific language mapping first
        if lang_key in LANGUAGE_FONT_MAP:
            font_name = LANGUAGE_FONT_MAP[lang_key]
        else:
            font_name = "NotoSans-Bold.ttf" if weight.lower() == "bold" else "NotoSans-Regular.ttf"

        path = os.path.join(self.font_dir, font_name)
        if os.path.exists(path):
            return path
            
        # Fallback to any existing font
        for fallback in ["NotoSans-Bold.ttf", "NotoSans-Regular.ttf", "arial.ttf", "msyh.ttc", "tahoma.ttf"]:
            fb_path = os.path.join(self.font_dir, fallback)
            if os.path.exists(fb_path):
                return fb_path

        return "arial.ttf"

    def prepare_text_for_rendering(self, text: str, target_lang: str) -> str:
        """
        Handles Arabic / Hebrew RTL reshaping and BiDi algorithm.
        """
        lang_key = target_lang.lower()
        if lang_key in ["ar", "arabic", "he", "hebrew", "fa", "ur"]:
            try:
                reshaped_text = arabic_reshaper.reshape(text)
                bidi_text = get_display(reshaped_text)
                return bidi_text
            except Exception as e:
                print(f"BiDi reshaping warning: {e}")
                return text
        return text

    def wrap_text_to_lines(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
        """
        Wraps words into multiple lines if they exceed max_width.
        """
        words = text.split(" ")
        if len(words) <= 1:
            return [text]

        lines = []
        current_line = []

        for word in words:
            test_line = " ".join(current_line + [word])
            # Use getlength or getbbox for accurate width
            try:
                bbox = font.getbbox(test_line)
                line_w = bbox[2] - bbox[0]
            except Exception:
                line_w = len(test_line) * 10

            if line_w <= max_width or not current_line:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]

        if current_line:
            lines.append(" ".join(current_line))

        return lines

    def measure_text_lines(self, lines: List[str], font: ImageFont.FreeTypeFont, line_height_mult: float = 1.2) -> Tuple[int, int]:
        """
        Measures total width and height of multi-line text.
        """
        max_w = 0
        total_h = 0
        for line in lines:
            try:
                bbox = font.getbbox(line)
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
            except Exception:
                w = len(line) * 10
                h = 16
            max_w = max(max_w, w)
            total_h += int(h * line_height_mult)

        return max_w, total_h

    def fit_text_to_box(
        self,
        text: str,
        box_width: int,
        box_height: int,
        font_path: str,
        max_font_size: int = 120,
        min_font_size: int = 10,
        target_lang: str = "en",
        allow_multiline: bool = True
    ) -> Tuple[int, ImageFont.FreeTypeFont, List[str]]:
        """
        Uses binary search to find the largest possible font size that fits inside box_width x box_height.
        """
        prepared_text = self.prepare_text_for_rendering(text, target_lang)
        
        low = min_font_size
        high = max(min_font_size, max_font_size)
        best_size = min_font_size
        best_font = None
        best_lines = [prepared_text]

        # Target box allows 95% padding tolerance
        allowed_w = int(box_width * 0.96)
        allowed_h = int(box_height * 0.96)

        while low <= high:
            mid = (low + high) // 2
            try:
                font = ImageFont.truetype(font_path, mid)
            except Exception:
                font = ImageFont.load_default()

            if allow_multiline and " " in prepared_text:
                lines = self.wrap_text_to_lines(prepared_text, font, allowed_w)
            else:
                lines = [prepared_text]

            w, h = self.measure_text_lines(lines, font)

            if w <= allowed_w and h <= allowed_h:
                best_size = mid
                best_font = font
                best_lines = lines
                low = mid + 1  # Try larger
            else:
                high = mid - 1  # Try smaller

        if best_font is None:
            try:
                best_font = ImageFont.truetype(font_path, min_font_size)
            except Exception:
                best_font = ImageFont.load_default()

        return best_size, best_font, best_lines

    def hex_to_rgba(self, hex_color: str, alpha: int = 255) -> Tuple[int, int, int, int]:
        """Converts #RRGGBB or #RGB to RGBA tuple."""
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 3:
            hex_color = "".join([c * 2 for c in hex_color])
        if len(hex_color) == 6:
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return (r, g, b, alpha)
        return (255, 255, 255, alpha)

    def render_text_block_on_image(
        self,
        base_pil_rgba: Image.Image,
        block: TextBlock,
        target_lang: str
    ) -> Image.Image:
        """
        Renders a single translated text block onto the PIL RGBA image,
        respecting bounding box, rotation, alignment, color, weight, and font.
        """
        bbox = block.boundingBox
        style = block.style
        text_to_render = block.translatedText or block.originalText
        if not text_to_render.strip():
            return base_pil_rgba

        font_path = self.get_font_for_language(target_lang, weight=style.fontWeight, requested_family=style.fontFamily)
        
        # Determine font size if not manually edited or if fits better
        calculated_size, font, lines = self.fit_text_to_box(
            text_to_render,
            box_width=bbox.width,
            box_height=bbox.height,
            font_path=font_path,
            max_font_size=max(style.fontSize, int(bbox.height * 0.95)),
            min_font_size=10,
            target_lang=target_lang,
            allow_multiline=style.isMultiline or (" " in text_to_render and bbox.width < len(text_to_render) * 15)
        )

        # If user explicitly set font size and edited, use it
        if block.isEdited and style.fontSize > 8:
            try:
                font = ImageFont.truetype(font_path, style.fontSize)
                lines = self.wrap_text_to_lines(self.prepare_text_for_rendering(text_to_render, target_lang), font, bbox.width)
            except Exception:
                pass

        # Text color
        fill_color = self.hex_to_rgba(style.color)

        # Create temporary high-res layer for rendering text
        pad = 20
        layer_w = bbox.width + pad * 2
        layer_h = bbox.height + pad * 2
        text_layer = Image.new("RGBA", (layer_w, layer_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(text_layer)

        # Calculate line positions and alignment
        total_w, total_h = self.measure_text_lines(lines, font, style.lineHeight)
        start_y = pad + max(0, (bbox.height - total_h) // 2)

        cur_y = start_y
        for line in lines:
            try:
                line_bbox = font.getbbox(line)
                line_w = line_bbox[2] - line_bbox[0]
                line_h = line_bbox[3] - line_bbox[1]
            except Exception:
                line_w = len(line) * 10
                line_h = 16

            if style.alignment == "center":
                cur_x = pad + (bbox.width - line_w) // 2
            elif style.alignment == "right":
                cur_x = pad + (bbox.width - line_w)
            else:
                cur_x = pad

            # Draw optional subtle stroke for readability if needed
            if style.strokeColor and style.strokeWidth > 0:
                stroke_rgba = self.hex_to_rgba(style.strokeColor)
                draw.text((cur_x, cur_y), line, font=font, fill=fill_color, stroke_width=style.strokeWidth, stroke_fill=stroke_rgba)
            else:
                draw.text((cur_x, cur_y), line, font=font, fill=fill_color)

            cur_y += int(line_h * style.lineHeight)

        # Handle rotation if text was detected at an angle
        rotation_angle = block.rotation or style.rotation
        if abs(rotation_angle) >= 1.5:
            # Rotate layer around its center
            text_layer = text_layer.rotate(-rotation_angle, resample=Image.Resampling.BICUBIC, expand=False)

        # Paste layer onto base image
        paste_x = bbox.x - pad
        paste_y = bbox.y - pad
        base_pil_rgba.alpha_composite(text_layer, (paste_x, paste_y))

        return base_pil_rgba

    def render_all_blocks(
        self,
        inpainted_bgr: np.ndarray,
        text_blocks: List[TextBlock],
        target_lang: str
    ) -> np.ndarray:
        """
        Renders all translated text blocks onto the inpainted background image.
        Returns the final translated BGR image.
        """
        # Convert BGR to RGBA PIL Image
        img_rgb = cv2.cvtColor(inpainted_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb).convert("RGBA")

        for block in text_blocks:
            if block.skipTranslation:
                continue
            pil_img = self.render_text_block_on_image(pil_img, block, target_lang)

        # Convert back to BGR numpy array
        result_rgb = pil_img.convert("RGB")
        result_bgr = cv2.cvtColor(np.array(result_rgb), cv2.COLOR_RGB2BGR)
        return result_bgr
