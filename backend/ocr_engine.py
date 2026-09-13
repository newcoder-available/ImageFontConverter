import math
import numpy as np
import cv2
from typing import List, Dict, Any, Tuple, Optional
from rapidocr_onnxruntime import RapidOCR
from models import BoundingBox, StyleInfo, TextBlock

class OCREngine:
    def __init__(self):
        # Initialize RapidOCR engine
        self.engine = RapidOCR()

    def detect_text(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs RapidOCR on the input BGR image.
        Returns a structured list of detected text items with polygon vertices,
        bounding boxes, orientation angle, and confidence scores.
        """
        ocr_result, _ = self.engine(img_bgr)
        if not ocr_result:
            return []

        results = []
        for idx, item in enumerate(ocr_result):
            # item format: [polygon_points, text, confidence]
            # polygon_points is typically [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
            poly_raw = item[0]
            text = str(item[1]).strip()
            confidence = float(item[2])

            if not text:
                continue

            polygon = [[int(round(pt[0])), int(round(pt[1]))] for pt in poly_raw]
            poly_np = np.array(polygon, dtype=np.int32)

            # Axis-aligned bounding box
            x, y, w, h = cv2.boundingRect(poly_np)
            
            # Ensure coordinates stay within image boundary
            img_h, img_w = img_bgr.shape[:2]
            x = max(0, min(x, img_w - 1))
            y = max(0, min(y, img_h - 1))
            w = max(1, min(w, img_w - x))
            h = max(1, min(h, img_h - y))

            # Calculate rotation angle from top edge of polygon: pt0 -> pt1
            angle = 0.0
            if len(polygon) >= 2:
                dx = polygon[1][0] - polygon[0][0]
                dy = polygon[1][1] - polygon[0][1]
                angle = math.degrees(math.atan2(dy, dx))
                # Normalize angle around 0
                if abs(angle) < 1.5:
                    angle = 0.0

            results.append({
                "id": f"text_{idx + 1:03d}",
                "text": text,
                "confidence": round(confidence, 4),
                "boundingBox": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h)
                },
                "polygon": polygon,
                "rotation": round(angle, 2)
            })

        return results

    def group_text_regions(self, detected_items: List[Dict[str, Any]], line_threshold_ratio: float = 0.6) -> List[Dict[str, Any]]:
        """
        Groups nearby text lines that belong to the same logical paragraph or vertical stack if beneficial.
        For exact layout preservation, we keep individual block granularity by default.
        """
        return detected_items
