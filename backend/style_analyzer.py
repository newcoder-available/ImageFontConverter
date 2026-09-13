import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from models import StyleInfo

class StyleAnalyzer:
    def __init__(self):
        pass

    def extract_dominant_text_color(self, img_bgr: np.ndarray, bbox: Dict[str, int], polygon: List[List[int]]) -> str:
        """
        Extracts dominant text color from character strokes inside the text polygon.
        Uses Otsu thresholding / gradient magnitude to separate foreground text strokes
        from background pixels, avoiding simple average color bleeding.
        """
        x, y, w, h = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
        if w <= 2 or h <= 2:
            return "#FFFFFF"

        # Crop ROI
        roi = img_bgr[y:y+h, x:x+w]
        if roi.size == 0:
            return "#FFFFFF"

        # Convert to grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Determine if text is bright-on-dark or dark-on-bright using border sample
        # Sample border pixels of ROI (which are predominantly background)
        top_edge = gray[0, :]
        bottom_edge = gray[-1, :]
        left_edge = gray[:, 0]
        right_edge = gray[:, -1]
        border_pixels = np.concatenate([top_edge, bottom_edge, left_edge, right_edge])
        bg_val = np.median(border_pixels)

        # Otsu thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Determine which binary value corresponds to text foreground
        fg_mask = (thresh == 255) if bg_val < 128 else (thresh == 0)

        # If mask is empty or too large (e.g. whole box), fall back to gradient edge pixels
        fg_count = np.count_nonzero(fg_mask)
        total_pixels = w * h
        if fg_count < 5 or fg_count > (total_pixels * 0.85):
            # Compute Sobel gradients to find stroke edges
            grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0)
            grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1)
            mag = cv2.magnitude(grad_x, grad_y)
            fg_mask = mag > np.percentile(mag, 70)

        fg_pixels = roi[fg_mask]
        if len(fg_pixels) == 0:
            # Fallback to center crop
            center_crop = roi[h//4:3*h//4, w//4:3*w//4]
            if center_crop.size > 0:
                mean_bgr = np.mean(center_crop, axis=(0, 1))
            else:
                mean_bgr = np.mean(roi, axis=(0, 1))
            b, g, r = [int(np.clip(c, 0, 255)) for c in mean_bgr]
            return f"#{r:02X}{g:02X}{b:02X}"

        # Median color of foreground strokes (robust against noise)
        med_bgr = np.median(fg_pixels, axis=0)
        b, g, r = [int(np.clip(c, 0, 255)) for c in med_bgr]
        return f"#{r:02X}{g:02X}{b:02X}"

    def analyze_style(self, img_bgr: np.ndarray, detected_item: Dict[str, Any]) -> StyleInfo:
        """
        Estimates font style, size, color, weight, and category for a detected text block.
        """
        bbox = detected_item["boundingBox"]
        poly = detected_item.get("polygon", [])
        h = bbox["height"]
        w = bbox["width"]
        text = detected_item["text"]
        rotation = detected_item.get("rotation", 0.0)

        # Extract dominant color
        color_hex = self.extract_dominant_text_color(img_bgr, bbox, poly)

        # Estimate font size (typically 70-85% of line height for single-line text)
        estimated_font_size = max(12, int(h * 0.78))

        # Estimate font weight based on stroke width / height ratio
        # By default, headings or high-confidence UI text are bold
        font_weight = "bold" if h > 22 or len(text) < 15 else "normal"

        # Alignment estimation
        # Short button/banner text tends to be center aligned; multi-word left-aligned
        alignment = "center" if len(text) <= 20 else "left"

        # Font category estimation
        font_category = "Sans Serif"

        return StyleInfo(
            fontSize=estimated_font_size,
            color=color_hex,
            fontWeight=font_weight,
            fontFamily="Noto Sans",
            fontCategory=font_category,
            alignment=alignment,
            rotation=rotation,
            lineHeight=1.2,
            isMultiline=("\n" in text or (w > 0 and len(text) > 30))
        )
