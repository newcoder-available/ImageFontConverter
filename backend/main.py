import os
import time
import base64
import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    ProcessImageResponse,
    RerenderRequest,
    RerenderResponse,
    SingleTranslateRequest,
    SingleTranslateResponse,
    TextBlock,
    BoundingBox,
    StyleInfo,
    SupportedLanguage,
    FontOption
)
from ocr_engine import OCREngine
from style_analyzer import StyleAnalyzer
from inpainter import TextInpainter
from translator import TranslationService, SUPPORTED_LANGUAGES
from text_renderer import TextRenderer, AVAILABLE_FONTS
from sample_generator import generate_all_samples, SAMPLE_DIR

app = FastAPI(
    title="Image Font Converter API",
    description="Intelligent Non-Destructive In-Image Text Translation and Font Replacement Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CV and ML engines
ocr_engine = OCREngine()
style_analyzer = StyleAnalyzer()
inpainter = TextInpainter(inpaint_radius=4, method="telea")
translator = TranslationService()
text_renderer = TextRenderer()

def np_to_base64(img_bgr: np.ndarray, format: str = "PNG") -> str:
    """Encodes OpenCV BGR numpy array to base64 data URI string."""
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    buffer = io.BytesIO()
    pil_img.save(buffer, format=format)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime_type = "image/png" if format.upper() == "PNG" else "image/jpeg"
    return f"data:{mime_type};base64,{encoded}"

def base64_to_np(data_uri: str) -> np.ndarray:
    """Decodes base64 data URI to OpenCV BGR numpy array."""
    if "," in data_uri:
        data_uri = data_uri.split(",", 1)[1]
    raw_data = base64.b64decode(data_uri)
    np_arr = np.frombuffer(raw_data, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image from base64")
    return img_bgr

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Image Font Converter API", "version": "1.0.0"}

@app.get("/api/languages", response_model=List[SupportedLanguage])
def get_languages():
    return translator.get_supported_languages()

@app.get("/api/fonts", response_model=List[FontOption])
def get_fonts():
    return AVAILABLE_FONTS

@app.get("/api/samples")
def get_sample_images():
    """Returns pre-generated sample images as base64."""
    generate_all_samples()
    samples = {}
    for filename in os.listdir(SAMPLE_DIR):
        if filename.endswith(".png") or filename.endswith(".jpg"):
            path = os.path.join(SAMPLE_DIR, filename)
            img = cv2.imread(path)
            if img is not None:
                samples[filename] = {
                    "filename": filename,
                    "title": filename.replace(".png", "").replace("_", " ").title(),
                    "base64": np_to_base64(img)
                }
    return samples

@app.post("/api/translate-text", response_model=SingleTranslateResponse)
def translate_single_text(req: SingleTranslateRequest):
    translated = translator.translate_text(req.text, source_lang=req.sourceLanguage, target_lang=req.targetLanguage)
    return SingleTranslateResponse(
        originalText=req.text,
        translatedText=translated,
        detectedSourceLanguage=req.sourceLanguage
    )

@app.post("/api/process", response_model=ProcessImageResponse)
async def process_image(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None),
    sourceLanguage: str = Form("auto"),
    targetLanguage: str = Form("fr")
):
    """
    Main Computer Vision & Translation Pipeline:
    1. Decode uploaded image
    2. Run RapidOCR (PaddleOCR ONNX)
    3. Analyze Text Style & Extract Foreground Color
    4. Translate text to target language
    5. Inpaint background (OpenCV Telea / NS)
    6. Fit and Render translated text onto inpainted background
    """
    start_time = time.time()

    # Load image
    if file:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif imageBase64:
        img_bgr = base64_to_np(imageBase64)
    else:
        raise HTTPException(status_code=400, detail="No image file or imageBase64 provided")

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image")

    img_h, img_w = img_bgr.shape[:2]

    # Step 1: Run OCR text detection
    raw_ocr_items = ocr_engine.detect_text(img_bgr)
    
    # Step 2: Extract text appearance & foreground colors
    text_blocks: List[TextBlock] = []
    for item in raw_ocr_items:
        style = style_analyzer.analyze_style(img_bgr, item)
        orig_text = item["text"]
        
        # Step 3: Translate
        translated_text = translator.translate_text(orig_text, source_lang=sourceLanguage, target_lang=targetLanguage)

        text_block = TextBlock(
            id=item["id"],
            originalText=orig_text,
            translatedText=translated_text,
            confidence=item["confidence"],
            boundingBox=BoundingBox(**item["boundingBox"]),
            polygon=item["polygon"],
            rotation=item.get("rotation", 0.0),
            style=style,
            isEdited=False,
            skipTranslation=False
        )
        text_blocks.append(text_block)

    # Step 4: Background Inpainting (Remove original text)
    inpainted_bgr, _ = inpainter.remove_text(img_bgr, raw_ocr_items, dilation_px=3)

    # Step 5: Render translated text with Unicode font engine
    translated_bgr = text_renderer.render_all_blocks(inpainted_bgr, text_blocks, target_lang=targetLanguage)

    # Convert to base64 data URIs
    original_b64 = np_to_base64(img_bgr)
    inpainted_b64 = np_to_base64(inpainted_bgr)
    translated_b64 = np_to_base64(translated_bgr)

    elapsed_ms = (time.time() - start_time) * 1000

    return ProcessImageResponse(
        success=True,
        sourceLanguage=sourceLanguage,
        targetLanguage=targetLanguage,
        imageWidth=img_w,
        imageHeight=img_h,
        textBlocks=text_blocks,
        translatedImageBase64=translated_b64,
        inpaintedImageBase64=inpainted_b64,
        originalImageBase64=original_b64,
        processingTimeMs=round(elapsed_ms, 2)
    )

@app.post("/api/rerender", response_model=RerenderResponse)
def rerender_image(req: RerenderRequest):
    """
    Re-renders translated text onto the inpainted background.
    Fast execution when user edits text, colors, font size, or alignment in manual editor.
    """
    # Use inpainted base64 if provided, otherwise reconstruct from original
    base_bgr = base64_to_np(req.inpaintedBase64 or req.imageBase64)
    rendered_bgr = text_renderer.render_all_blocks(base_bgr, req.textBlocks, target_lang=req.targetLanguage)
    rendered_b64 = np_to_base64(rendered_bgr)

    return RerenderResponse(
        success=True,
        renderedImageBase64=rendered_b64,
        textBlocks=req.textBlocks
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
