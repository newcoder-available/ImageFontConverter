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

FONT_FAMILY_MAP = {
    "titan one": "titanone-regular.ttf",
    "arial black": "ariblk.ttf",
    "impact": "impact.ttf",
    "comic bold": "comicbd.ttf",
    "cooper black": "coopbl.ttf",
    "segoe black": "seguibl.ttf",
    "noto sans": "NotoSans-Regular.ttf",
    "noto bold": "NotoSans-Bold.ttf",
}

AVAILABLE_FONTS = [
    {"id": "titan_one", "name": "Titan One (3D / Cartoon / Display)", "category": "Display", "isUnicode": True},
    {"id": "ariblk", "name": "Arial Black (Heavy Bold)", "category": "Display", "isUnicode": True},
    {"id": "impact", "name": "Impact (Condensed Bold)", "category": "Display", "isUnicode": True},
    {"id": "coopbl", "name": "Cooper Black (Rounded)", "category": "Display", "isUnicode": True},
    {"id": "noto_sans", "name": "Noto Sans (Universal)", "category": "Sans Serif", "isUnicode": True},
    {"id": "msyh", "name": "Microsoft YaHei (Chinese)", "category": "Sans Serif", "isUnicode": True},
    {"id": "msgothic", "name": "MS Gothic (Japanese)", "category": "Sans Serif", "isUnicode": True},
    {"id": "malgun", "name": "Malgun Gothic (Korean)", "category": "Sans Serif", "isUnicode": True},
    {"id": "noto_devanagari", "name": "Noto Sans Devanagari (Hindi)", "category": "Sans Serif", "isUnicode": True},
    {"id": "noto_arabic", "name": "Noto Sans Arabic (Arabic RTL)", "category": "Sans Serif", "isUnicode": True},
]

class TextRenderer:
    def __init__(self, font_dir: str = FONT_DIR):
        self.font_dir = font_dir
        self.font_cache: Dict[str, ImageFont.FreeTypeFont] = {}

    def get_font_for_language(
        self,
        target_lang: str,
        weight: str = "bold",
        requested_family: Optional[str] = None,
        font_category: Optional[str] = None
    ) -> str:
        """
        Resolves the best font file path matching the typography style (Display / 3D / Bold / Regular)
        and target language Unicode coverage.
        """
        lang_key = target_lang.lower().replace("_", "-")

        # 1. Check specific non-Latin language fonts first (CJK, Arabic, Hindi)
        if lang_key in ["ar", "arabic", "hi", "hindi", "zh-cn", "zh-tw", "zh", "chinese", "ja", "japanese", "ko", "korean"]:
            font_name = LANGUAGE_FONT_MAP.get(lang_key, "NotoSans-Regular.ttf")
            path = os.path.join(self.font_dir, font_name)
            if os.path.exists(path):
                return path

        # 2. Check requested family
        if requested_family:
            req_key = requested_family.lower().strip()
            if req_key in FONT_FAMILY_MAP:
                cand = os.path.join(self.font_dir, FONT_FAMILY_MAP[req_key])
                if os.path.exists(cand):
                    return cand

        # 3. For Display / Cartoon style in Latin/Western languages, use punchy Display fonts
        if font_category and font_category.lower() in ["display", "cartoon", "game", "comic"]:
            for display_font in ["titanone-regular.ttf", "ariblk.ttf", "coopbl.ttf", "impact.ttf", "seguibl.ttf"]:
                p = os.path.join(self.font_dir, display_font)
                if os.path.exists(p):
                    return p

        # 4. Standard Latin / Cyrillic fallback
        bold_path = os.path.join(self.font_dir, "NotoSans-Bold.ttf")
        reg_path = os.path.join(self.font_dir, "NotoSans-Regular.ttf")
        if weight.lower() == "bold" and os.path.exists(bold_path):
            return bold_path
        if os.path.exists(reg_path):
            return reg_path

        # 5. Generic fallback
        for fb in ["ariblk.ttf", "arial.ttf", "tahoma.ttf"]:
            fb_path = os.path.join(self.font_dir, fb)
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
        words = text.split(" ")
        if len(words) <= 1:
            return [text]

        lines = []
        current_line = []

        for word in words:
            test_line = " ".join(current_line + [word])
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

    def measure_text_lines(self, lines: List[str], font: ImageFont.FreeTypeFont, line_height_mult: float = 1.15) -> Tuple[int, int]:
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
        max_font_size: int = 140,
        min_font_size: int = 10,
        target_lang: str = "en",
        allow_multiline: bool = True
    ) -> Tuple[int, ImageFont.FreeTypeFont, List[str]]:
        """
        Binary search font sizing with multiline wrapping to perfectly fill bounding boxes.
        """
        prepared_text = self.prepare_text_for_rendering(text, target_lang)
        
        low = min_font_size
        high = max(min_font_size, max_font_size)
        best_size = min_font_size
        best_font = None
        best_lines = [prepared_text]

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
                low = mid + 1
            else:
                high = mid - 1

        if best_font is None:
            try:
                best_font = ImageFont.truetype(font_path, min_font_size)
            except Exception:
                best_font = ImageFont.load_default()

        return best_size, best_font, best_lines

    def hex_to_rgba(self, hex_color: Optional[str], alpha: int = 255) -> Tuple[int, int, int, int]:
        if not hex_color:
            return (255, 255, 255, alpha)
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
        Renders a single translated text block onto the PIL RGBA image with:
        - 3D Extrusion & Drop Shadow depth layers
        - Thick Outline Stroke
        - Vibrant Foreground Face Fill
        - Accurate scale, centering, and rotation
        """
        bbox = block.boundingBox
        style = block.style
        text_to_render = block.translatedText or block.originalText
        if not text_to_render.strip():
            return base_pil_rgba

        font_path = self.get_font_for_language(
            target_lang=target_lang,
            weight=style.fontWeight,
            requested_family=style.fontFamily,
            font_category=style.fontCategory
        )
        
        # Calculate optimal font size
        calculated_size, font, lines = self.fit_text_to_box(
            text_to_render,
            box_width=bbox.width,
            box_height=bbox.height,
            font_path=font_path,
            max_font_size=max(style.fontSize, int(bbox.height * 0.95)),
            min_font_size=12,
            target_lang=target_lang,
            allow_multiline=style.isMultiline or (" " in text_to_render and bbox.width < len(text_to_render) * 16)
        )

        if block.isEdited and style.fontSize > 8:
            try:
                font = ImageFont.truetype(font_path, style.fontSize)
                lines = self.wrap_text_to_lines(self.prepare_text_for_rendering(text_to_render, target_lang), font, bbox.width)
            except Exception:
                pass

        # Color definitions
        face_rgba = self.hex_to_rgba(style.color)
        stroke_rgba = self.hex_to_rgba(style.strokeColor) if style.strokeColor else None
        shadow_rgba = self.hex_to_rgba(style.shadowColor) if style.shadowColor else None

        # Create temporary canvas
        pad = 30
        layer_w = bbox.width + pad * 2
        layer_h = bbox.height + pad * 2
        text_layer = Image.new("RGBA", (layer_w, layer_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(text_layer)

        total_w, total_h = self.measure_text_lines(lines, font, style.lineHeight)
        start_y = pad + max(0, (bbox.height - total_h) // 2)

        # 1. Render 3D Extrusion / Shadow Depth Layers
        if shadow_rgba and (style.shadowOffsetY > 0 or style.shadowOffsetX > 0):
            steps = max(style.shadowOffsetY, style.shadowOffsetX)
            for step in range(steps, 0, -1):
                off_x = int(round(style.shadowOffsetX * (step / steps)))
                off_y = int(round(style.shadowOffsetY * (step / steps)))
                cur_y = start_y + off_y
                for line in lines:
                    try:
                        line_bbox = font.getbbox(line)
                        line_w = line_bbox[2] - line_bbox[0]
                        line_h = line_bbox[3] - line_bbox[1]
                    except Exception:
                        line_w = len(line) * 10
                        line_h = 16

                    if style.alignment == "center":
                        cur_x = pad + (bbox.width - line_w) // 2 + off_x
                    elif style.alignment == "right":
                        cur_x = pad + (bbox.width - line_w) + off_x
                    else:
                        cur_x = pad + off_x

                    if style.strokeWidth > 0:
                        draw.text((cur_x, cur_y), line, font=font, fill=shadow_rgba, stroke_width=style.strokeWidth, stroke_fill=shadow_rgba)
                    else:
                        draw.text((cur_x, cur_y), line, font=font, fill=shadow_rgba)

                    cur_y += int(line_h * style.lineHeight)

        # 2. Render Outer Stroke Outline (if present)
        if stroke_rgba and style.strokeWidth > 0:
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

                draw.text((cur_x, cur_y), line, font=font, fill=stroke_rgba, stroke_width=style.strokeWidth, stroke_fill=stroke_rgba)
                cur_y += int(line_h * style.lineHeight)

        # 3. Render Vibrant Foreground Text Face
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

            draw.text((cur_x, cur_y), line, font=font, fill=face_rgba)
            cur_y += int(line_h * style.lineHeight)

        # 4. Handle Rotation
        rotation_angle = block.rotation or style.rotation
        if abs(rotation_angle) >= 1.5:
            text_layer = text_layer.rotate(-rotation_angle, resample=Image.Resampling.BICUBIC, expand=False)

        # Paste onto base image
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
        img_rgb = cv2.cvtColor(inpainted_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb).convert("RGBA")

        for block in text_blocks:
            if block.skipTranslation:
                continue
            pil_img = self.render_text_block_on_image(pil_img, block, target_lang)

        result_rgb = pil_img.convert("RGB")
        result_bgr = cv2.cvtColor(np.array(result_rgb), cv2.COLOR_RGB2BGR)
        return result_bgr
