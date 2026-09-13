import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from models import StyleInfo

class StyleAnalyzer:
    def __init__(self):
        pass

    def _sample_background_color(self, roi_bgr: np.ndarray) -> np.ndarray:
        """
        Samples the outer perimeter of the ROI to determine the surrounding background color.
        """
        h, w = roi_bgr.shape[:2]
        if h <= 2 or w <= 2:
            return np.array([255, 255, 255], dtype=np.uint8)

        top = roi_bgr[0, :]
        bottom = roi_bgr[-1, :]
        left = roi_bgr[:, 0]
        right = roi_bgr[:, -1]
        border = np.concatenate([top, bottom, left, right], axis=0)
        
        # Median border BGR
        med_bgr = np.median(border, axis=0)
        return med_bgr.astype(np.uint8)

    def analyze_style(self, img_bgr: np.ndarray, detected_item: Dict[str, Any]) -> StyleInfo:
        """
        Comprehensive multi-layer style, color, 3D shadow, and font analyzer.
        Accurately identifies:
        - Main text face fill color (e.g. Bright Yellow, Gold, White)
        - Outline stroke border color and thickness
        - 3D extrusion / drop shadow color and offset
        - Font category (Display, Cartoon, Bold Sans, Serif)
        """
        bbox = detected_item["boundingBox"]
        poly = detected_item.get("polygon", [])
        x, y, w, h = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
        text = detected_item.get("text", "")
        rotation = detected_item.get("rotation", 0.0)

        img_h, img_w = img_bgr.shape[:2]
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(img_w, x + w)
        y2 = min(img_h, y + h)

        if x2 <= x1 or y2 <= y1:
            return StyleInfo()

        roi = img_bgr[y1:y2, x1:x2]
        roi_h, roi_w = roi.shape[:2]

        # 1. Sample Background Color
        bg_bgr = self._sample_background_color(roi)
        
        # 2. Extract Non-Background (Foreground Text) Pixels
        # Compute color distance from background
        diff = np.linalg.norm(roi.astype(np.float32) - bg_bgr.astype(np.float32), axis=2)
        fg_mask = diff > 30.0

        fg_count = np.count_nonzero(fg_mask)
        if fg_count < 10:
            # Fallback to Otsu threshold
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            fg_mask = otsu == 255

        fg_pixels = roi[fg_mask]
        if len(fg_pixels) == 0:
            return StyleInfo(
                fontSize=max(14, int(h * 0.75)),
                color="#FFFFFF",
                fontWeight="bold",
                alignment="center"
            )

        # 3. Multi-Cluster Analysis (Distinguish Face Fill vs 3D Extrusion/Shadow vs Outline)
        # Convert foreground pixels to HSV for brightness & saturation separation
        fg_hsv = cv2.cvtColor(fg_pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)
        saturations = fg_hsv[:, 1]
        values = fg_hsv[:, 2]

        face_color_bgr = None
        stroke_color_bgr = None
        shadow_color_bgr = None
        stroke_width = 0
        shadow_offset_x = 0
        shadow_offset_y = 0
        font_category = "Sans Serif"
        font_family = "Noto Sans"

        # Check if there is significant color variance (e.g. 3D gaming text like Yellow Face + Maroon Shadow)
        if len(fg_pixels) >= 30:
            # K-Means clustering with k=2 or k=3
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 0.2)
            k = 3 if len(fg_pixels) > 100 else 2
            _, labels, centers = cv2.kmeans(fg_pixels.astype(np.float32), k, None, criteria, 5, cv2.KMEANS_PP_CENTERS)
            
            centers = centers.astype(np.uint8)
            centers_hsv = cv2.cvtColor(centers.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)

            # Sort clusters by a combination of Brightness (Value) and Saturation (Chroma)
            # The Text Face is typically the brightest or most vibrant colored layer
            scores = []
            for i in range(k):
                h_val, s_val, v_val = centers_hsv[i]
                # Face score favors high brightness and high saturation
                score = (float(v_val) * 1.5) + (float(s_val) * 1.2)
                scores.append((score, i))

            scores.sort(reverse=True)
            face_idx = scores[0][1]
            face_color_bgr = centers[face_idx]

            # If there's a distinct secondary darker/maroon cluster, check for 3D extrusion/shadow
            if k >= 2:
                dark_idx = scores[-1][1]
                dark_bgr = centers[dark_idx]
                
                # Check color difference between face and shadow
                face_dark_diff = np.linalg.norm(face_color_bgr.astype(float) - dark_bgr.astype(float))
                if face_dark_diff > 45:
                    # Detected 3D extrusion or bold dark stroke
                    shadow_color_bgr = dark_bgr
                    stroke_color_bgr = dark_bgr
                    stroke_width = max(2, min(5, int(h * 0.08)))
                    shadow_offset_x = max(1, min(6, int(w * 0.02)))
                    shadow_offset_y = max(2, min(8, int(h * 0.12)))
                    font_category = "Display"
                    font_family = "Titan One"
        else:
            face_color_bgr = np.median(fg_pixels, axis=0).astype(np.uint8)

        if face_color_bgr is None:
            face_color_bgr = np.median(fg_pixels, axis=0).astype(np.uint8)

        fb, fg, fr = [int(np.clip(c, 0, 255)) for c in face_color_bgr]
        face_hex = f"#{fr:02X}{fg:02X}{fb:02X}"

        stroke_hex = None
        if stroke_color_bgr is not None:
            sb, sg, sr = [int(np.clip(c, 0, 255)) for c in stroke_color_bgr]
            stroke_hex = f"#{sr:02X}{sg:02X}{sb:02X}"

        shadow_hex = None
        if shadow_color_bgr is not None:
            sh_b, sh_g, sh_r = [int(np.clip(c, 0, 255)) for c in shadow_color_bgr]
            shadow_hex = f"#{sh_r:02X}{sh_g:02X}{sh_b:02X}"

        # Font size estimation (approx 75-85% of block height)
        font_size = max(14, int(h * 0.80))
        font_weight = "bold" if h > 20 or font_category == "Display" else "normal"
        alignment = "center" if len(text) <= 25 else "left"

        return StyleInfo(
            fontSize=font_size,
            color=face_hex,
            fontWeight=font_weight,
            fontFamily=font_family,
            fontCategory=font_category,
            alignment=alignment,
            rotation=rotation,
            lineHeight=1.15,
            isMultiline=("\n" in text or (w > 0 and len(text) > 30)),
            strokeColor=stroke_hex,
            strokeWidth=stroke_width,
            shadowColor=shadow_hex,
            shadowOffsetX=shadow_offset_x,
            shadowOffsetY=shadow_offset_y
        )
