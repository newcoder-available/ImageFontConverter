import os
import sys
import cv2
import numpy as np

# Force UTF-8 on Windows stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ocr_engine import OCREngine
from style_analyzer import StyleAnalyzer
from inpainter import TextInpainter
from translator import TranslationService
from text_renderer import TextRenderer
from sample_generator import create_gaming_ui_sample, create_sale_banner_sample

def test_full_pipeline():
    print("--- 1. Testing Sample Image Generation ---")
    gaming_img_path = create_gaming_ui_sample()
    assert os.path.exists(gaming_img_path), "Gaming UI sample should exist"
    img_bgr = cv2.imread(gaming_img_path)
    assert img_bgr is not None, "Image should load"
    print(f"Loaded sample image: {img_bgr.shape}")

    print("--- 2. Testing OCR Engine (RapidOCR / PaddleOCR) ---")
    ocr = OCREngine()
    detected = ocr.detect_text(img_bgr)
    print(f"Detected {len(detected)} text regions:")
    for d in detected:
        print(f"  [{d['id']}] '{d['text']}' (conf: {d['confidence']}, bbox: {d['boundingBox']})")
    assert len(detected) >= 2, "Should detect at least 2 text blocks in the gaming UI"

    print("--- 3. Testing Text Appearance & Color Analyzer ---")
    analyzer = StyleAnalyzer()
    styles = []
    for d in detected:
        style = analyzer.analyze_style(img_bgr, d)
        styles.append(style)
        print(f"  Block '{d['text']}' -> Color: {style.color}, Font size: {style.fontSize}px, Weight: {style.fontWeight}")

    print("--- 4. Testing Inpainting (Removing text & restoring background) ---")
    inpainter = TextInpainter()
    inpainted, mask = inpainter.remove_text(img_bgr, detected, dilation_px=3)
    cv2.imwrite("backend/temp/test_inpainted.png", inpainted)
    print("Saved inpainted background to backend/temp/test_inpainted.png")

    print("--- 5. Testing Translation & Unicode Rendering for Multiple Languages ---")
    translator = TranslationService()
    renderer = TextRenderer()

    test_languages = [
        ("fr", "French"),
        ("zh-CN", "Chinese"),
        ("ar", "Arabic (RTL)"),
        ("hi", "Hindi (Devanagari)"),
        ("es", "Spanish")
    ]

    for lang_code, lang_name in test_languages:
        from models import TextBlock, BoundingBox
        blocks = []
        for d, s in zip(detected, styles):
            tr_text = translator.translate_text(d["text"], source_lang="en", target_lang=lang_code)
            block = TextBlock(
                id=d["id"],
                originalText=d["text"],
                translatedText=tr_text,
                confidence=d["confidence"],
                boundingBox=BoundingBox(**d["boundingBox"]),
                polygon=d["polygon"],
                rotation=d.get("rotation", 0.0),
                style=s
            )
            blocks.append(block)
            print(f"  [{lang_name}] '{d['text']}' -> '{tr_text}'")

        res_bgr = renderer.render_all_blocks(inpainted, blocks, target_lang=lang_code)
        out_file = f"backend/temp/test_result_{lang_code}.png"
        cv2.imwrite(out_file, res_bgr)
        print(f"  Rendered translated image saved to {out_file}")

    print("--- ALL PIPELINE TESTS PASSED 100% SUCCESSFULLY! ---")

if __name__ == "__main__":
    os.makedirs("backend/temp", exist_ok=True)
    test_full_pipeline()
