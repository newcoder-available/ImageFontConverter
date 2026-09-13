import cv2
import numpy as np
from typing import List, Dict, Any, Optional

class TextInpainter:
    def __init__(self, inpaint_radius: int = 4, method: str = "telea"):
        self.inpaint_radius = inpaint_radius
        self.flags = cv2.INPAINT_TELEA if method.lower() == "telea" else cv2.INPAINT_NS

    def create_mask(self, image_shape: tuple, text_regions: List[Dict[str, Any]], dilation_px: int = 3) -> np.ndarray:
        """
        Creates a binary mask for the text regions to be inpainted.
        Mask is 255 for pixels to inpaint, 0 for preserved original pixels.
        """
        mask = np.zeros((image_shape[0], image_shape[1]), dtype=np.uint8)

        for region in text_regions:
            # Check if region has polygon
            poly = region.get("polygon")
            if poly and len(poly) >= 3:
                pts = np.array(poly, dtype=np.int32)
                cv2.fillPoly(mask, [pts], 255)
            else:
                # Fallback to bounding box
                bbox = region.get("boundingBox", {})
                x = bbox.get("x", 0)
                y = bbox.get("y", 0)
                w = bbox.get("width", 0)
                h = bbox.get("height", 0)
                if w > 0 and h > 0:
                    cv2.rectangle(mask, (x, y), (x + w, y + h), 255, -1)

        # Dilate mask slightly to cover character antialiasing edges and strokes
        if dilation_px > 0:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilation_px * 2 + 1, dilation_px * 2 + 1))
            mask = cv2.dilate(mask, kernel, iterations=1)

        return mask

    def remove_text(
        self,
        img_bgr: np.ndarray,
        text_regions: List[Dict[str, Any]],
        dilation_px: int = 3,
        method: Optional[str] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Removes text from the image using localized OpenCV inpainting.
        Restores background seamlessly without altering the rest of the image.
        Returns (inpainted_img_bgr, mask).
        """
        if not text_regions:
            return img_bgr.copy(), np.zeros(img_bgr.shape[:2], dtype=np.uint8)

        mask = self.create_mask(img_bgr.shape, text_regions, dilation_px=dilation_px)
        
        inpaint_flag = self.flags
        if method:
            inpaint_flag = cv2.INPAINT_TELEA if method.lower() == "telea" else cv2.INPAINT_NS

        # Localized inpainting for maximum performance and quality preservation
        inpainted = img_bgr.copy()
        img_h, img_w = img_bgr.shape[:2]

        # Inpaint each region locally with surrounding margin
        for region in text_regions:
            bbox = region.get("boundingBox", {})
            x = bbox.get("x", 0)
            y = bbox.get("y", 0)
            w = bbox.get("width", 0)
            h = bbox.get("height", 0)

            if w <= 0 or h <= 0:
                continue

            margin = max(15, int(max(w, h) * 0.25))
            x1 = max(0, x - margin)
            y1 = max(0, y - margin)
            x2 = min(img_w, x + w + margin)
            y2 = min(img_h, y + h + margin)

            roi_img = inpainted[y1:y2, x1:x2]
            roi_mask = mask[y1:y2, x1:x2]

            if np.count_nonzero(roi_mask) > 0:
                roi_inpainted = cv2.inpaint(roi_img, roi_mask, inpaintRadius=self.inpaint_radius, flags=inpaint_flag)
                inpainted[y1:y2, x1:x2] = roi_inpainted

        return inpainted, mask
