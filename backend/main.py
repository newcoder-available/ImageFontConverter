import os
import time
import base64
import io
import json
import zipfile
import cv2
import numpy as np
from PIL import Image
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

from models import (
    ProcessImageResponse,
    MultiProcessResponse,
    AnalyzeImageResponse,
    LocalizedVariant,
    RerenderRequest,
    RerenderResponse,
    SingleTranslateRequest,
    SingleTranslateResponse,
    TextBlock,
    BoundingBox,
    StyleInfo,
    SupportedLanguage,
    FontOption,
    GlossaryTerm,
    SettingsConfig,
    ZipExportRequest,
    BatchProcessRequest,
    QAResult
)
from translator import TranslationService, SUPPORTED_LANGUAGES
from text_renderer import TextRenderer, AVAILABLE_FONTS
from sample_generator import generate_all_samples, SAMPLE_DIR
from agents.orchestrator import LocalizationOrchestrator

app = FastAPI(
    title="LocalizeAI — Multilingual Image Localization Engine",
    description="Production In-Image Text Localization, Typography Preservation, and AI Quality Assurance",
    version="2.5.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Central Orchestrator
orchestrator = LocalizationOrchestrator()
text_renderer = TextRenderer()
translator = TranslationService()

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
    return {
        "status": "ok",
        "service": "LOCALIZE AI Engine",
        "version": "2.5.0",
        "tagline": "Translate any image. Preserve every detail.",
        "languagesCount": len(SUPPORTED_LANGUAGES),
        "aiProvider": orchestrator.settings.aiProvider
    }

@app.get("/api/languages", response_model=List[SupportedLanguage])
def get_languages():
    return translator.get_supported_languages()

@app.get("/api/fonts", response_model=List[FontOption])
def get_fonts():
    return [
        FontOption(
            id=f["id"],
            name=f["name"],
            category=f["category"],
            isUnicode=f.get("isUnicode", True),
            scripts=["Universal", "Latin", "CJK", "Devanagari", "Arabic", "Cyrillic", "Gurmukhi", "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati", "Bengali", "Thai", "Hebrew"]
        ) for f in AVAILABLE_FONTS
    ]

@app.get("/api/samples")
def get_sample_images():
    """Returns pre-generated sample images as base64."""
    generate_all_samples()
    samples = {}
    if os.path.exists(SAMPLE_DIR):
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

@app.post("/api/analyze", response_model=AnalyzeImageResponse)
async def analyze_image_endpoint(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None)
):
    """
    Vision & OCR Analysis Stage:
    Detects text regions, auto-identifies source language & script,
    classifies text (TRANSLATABLE / PROTECTED / AMBIGUOUS), and analyzes typography.
    """
    if file:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif imageBase64:
        img_bgr = base64_to_np(imageBase64)
    else:
        raise HTTPException(status_code=400, detail="No image provided")

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    analysis, _, _ = orchestrator.analyze_image(img_bgr)
    return analysis

@app.post("/api/translate-text", response_model=SingleTranslateResponse)
def translate_single_text(req: SingleTranslateRequest):
    glossary_dict = orchestrator.glossary_mgr.get_glossary_dict()
    res = orchestrator.translation_provider.translate(
        text=req.text,
        source_lang=req.sourceLanguage,
        target_lang=req.targetLanguage,
        context=req.context,
        text_type=req.textType,
        glossary=glossary_dict
    )
    return SingleTranslateResponse(
        originalText=req.text,
        translatedText=res.get("targetText", req.text),
        detectedSourceLanguage=req.sourceLanguage,
        confidence=res.get("confidence", 0.98),
        isGlossaryOverride=res.get("isGlossaryOverride", False)
    )

@app.post("/api/process", response_model=ProcessImageResponse)
async def process_image(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None),
    sourceLanguage: str = Form("auto"),
    targetLanguage: str = Form("ja")
):
    """
    Full End-to-End In-Image Text Localization for a single target language.
    """
    start_time = time.time()
    if file:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif imageBase64:
        img_bgr = base64_to_np(imageBase64)
    else:
        raise HTTPException(status_code=400, detail="No image provided")

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    img_h, img_w = img_bgr.shape[:2]

    # Pipeline
    analysis, _, inpainted_bgr = orchestrator.analyze_image(img_bgr)
    src_lang = analysis.sourceLanguage if sourceLanguage == "auto" else sourceLanguage
    
    variant = orchestrator.localize_for_language(
        img_bgr=img_bgr,
        inpainted_bgr=inpainted_bgr,
        text_blocks=analysis.textBlocks,
        source_lang=src_lang,
        target_lang=targetLanguage
    )

    elapsed_ms = (time.time() - start_time) * 1000

    return ProcessImageResponse(
        success=True,
        sourceLanguage=src_lang,
        detectedScript=analysis.detectedScript,
        targetLanguage=targetLanguage,
        imageWidth=img_w,
        imageHeight=img_h,
        textBlocks=variant.textBlocks,
        translatedImageBase64=variant.translatedImageBase64,
        inpaintedImageBase64=np_to_base64(inpainted_bgr),
        originalImageBase64=np_to_base64(img_bgr),
        processingTimeMs=round(elapsed_ms, 2),
        qaResult=variant.qaResult
    )

@app.post("/api/process-multi", response_model=MultiProcessResponse)
async def process_multi_languages(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None),
    sourceLanguage: str = Form("auto"),
    targetLanguages: str = Form("ja,hi,de,es,fr")
):
    """
    Multi-Language Batch In-Image Localization.
    Runs Vision & Inpainting once, then translates, renders, and validates QA
    for each requested target language concurrently.
    """
    start_time = time.time()

    # Parse target languages
    if targetLanguages.startswith("["):
        try:
            target_langs = json.loads(targetLanguages)
        except Exception:
            target_langs = [l.strip() for l in targetLanguages.replace("[", "").replace("]", "").replace('"', '').split(",") if l.strip()]
    else:
        target_langs = [l.strip() for l in targetLanguages.split(",") if l.strip()]

    if not target_langs:
        target_langs = ["ja"]

    if file:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif imageBase64:
        img_bgr = base64_to_np(imageBase64)
    else:
        raise HTTPException(status_code=400, detail="No image provided")

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    img_h, img_w = img_bgr.shape[:2]

    # Analyze & Inpaint once
    analysis, _, inpainted_bgr = orchestrator.analyze_image(img_bgr)
    src_lang = analysis.sourceLanguage if sourceLanguage == "auto" else sourceLanguage

    # Generate variants for each target language
    variants: List[LocalizedVariant] = []
    for lang_code in target_langs:
        v = orchestrator.localize_for_language(
            img_bgr=img_bgr,
            inpainted_bgr=inpainted_bgr,
            text_blocks=analysis.textBlocks,
            source_lang=src_lang,
            target_lang=lang_code
        )
        variants.append(v)

    elapsed_ms = (time.time() - start_time) * 1000

    return MultiProcessResponse(
        success=True,
        sourceLanguage=src_lang,
        detectedScript=analysis.detectedScript,
        targetLanguages=target_langs,
        imageWidth=img_w,
        imageHeight=img_h,
        originalImageBase64=np_to_base64(img_bgr),
        inpaintedImageBase64=np_to_base64(inpainted_bgr),
        variants=variants,
        processingTimeMs=round(elapsed_ms, 2)
    )

@app.post("/api/batch-process")
async def batch_process_images(req: BatchProcessRequest):
    """
    Batch Localization across multiple images and multiple languages.
    """
    results = []
    for img_obj in req.images:
        fname = img_obj.get("filename", "image.png")
        b64 = img_obj.get("base64", "")
        if not b64:
            continue
        try:
            img_bgr = base64_to_np(b64)
            img_h, img_w = img_bgr.shape[:2]
            analysis, _, inpainted_bgr = orchestrator.analyze_image(img_bgr)
            src_lang = analysis.sourceLanguage if req.sourceLanguage == "auto" else req.sourceLanguage
            
            variants = []
            for lang_code in req.targetLanguages:
                v = orchestrator.localize_for_language(
                    img_bgr=img_bgr,
                    inpainted_bgr=inpainted_bgr,
                    text_blocks=analysis.textBlocks,
                    source_lang=src_lang,
                    target_lang=lang_code
                )
                variants.append(v)
            
            results.append({
                "filename": fname,
                "success": True,
                "sourceLanguage": src_lang,
                "variants": [v.model_dump() for v in variants]
            })
        except Exception as e:
            results.append({
                "filename": fname,
                "success": False,
                "error": str(e)
            })

    return {"success": True, "totalProcessed": len(results), "results": results}

@app.post("/api/rerender", response_model=RerenderResponse)
def rerender_image(req: RerenderRequest):
    """
    Fast live re-rendering of edited typography / translations with automated QA check.
    """
    base_bgr = base64_to_np(req.inpaintedBase64 or req.imageBase64)
    rendered_bgr = text_renderer.render_all_blocks(base_bgr, req.textBlocks, target_lang=req.targetLanguage)
    rendered_b64 = np_to_base64(rendered_bgr)

    orig_bgr = base64_to_np(req.imageBase64)
    qa_res = orchestrator.qa_provider.validate(
        original_img=orig_bgr,
        localized_img=rendered_bgr,
        text_blocks=req.textBlocks,
        target_lang=req.targetLanguage
    )

    return RerenderResponse(
        success=True,
        renderedImageBase64=rendered_b64,
        textBlocks=req.textBlocks,
        qaResult=qa_res
    )

# Glossary Endpoints
@app.get("/api/glossary", response_model=List[GlossaryTerm])
def get_glossary_terms():
    return orchestrator.glossary_mgr.get_all_terms()

@app.post("/api/glossary", response_model=GlossaryTerm)
def create_or_update_glossary_term(term: GlossaryTerm):
    return orchestrator.glossary_mgr.add_or_update_term(term)

@app.delete("/api/glossary/{term_id}")
def delete_glossary_term(term_id: str):
    success = orchestrator.glossary_mgr.delete_term(term_id)
    if not success:
        raise HTTPException(status_code=404, detail="Term not found")
    return {"success": True, "deletedId": term_id}

# Settings Endpoints
@app.get("/api/settings", response_model=SettingsConfig)
def get_settings():
    safe_settings = orchestrator.settings.model_copy()
    # Mask API keys for security
    if safe_settings.openaiApiKey:
        safe_settings.openaiApiKey = "sk-..." + safe_settings.openaiApiKey[-4:] if len(safe_settings.openaiApiKey) > 4 else "configured"
        safe_settings.apiKeyConfigured = True
    if safe_settings.geminiApiKey:
        safe_settings.geminiApiKey = "..." + safe_settings.geminiApiKey[-4:] if len(safe_settings.geminiApiKey) > 4 else "configured"
        safe_settings.apiKeyConfigured = True
    if safe_settings.anthropicApiKey:
        safe_settings.anthropicApiKey = "..." + safe_settings.anthropicApiKey[-4:] if len(safe_settings.anthropicApiKey) > 4 else "configured"
        safe_settings.apiKeyConfigured = True
    return safe_settings

@app.post("/api/settings", response_model=SettingsConfig)
def update_settings(cfg: SettingsConfig):
    orchestrator.update_settings(cfg)
    return get_settings()

@app.post("/api/export-zip")
def export_zip(req: ZipExportRequest):
    """
    Packages all localized images into a clean ZIP archive for download.
    """
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for item in req.variants:
            lang = item.get("language", "localized")
            b64_str = item.get("imageBase64", "")
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            try:
                raw_bytes = base64.b64decode(b64_str)
                zf.writestr(f"{req.filenamePrefix}_{lang}.png", raw_bytes)
            except Exception:
                pass

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={req.filenamePrefix}_all_languages.zip"}
    )

# Mount Next.js static build if present
from fastapi.staticfiles import StaticFiles
frontend_out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "out")
if not os.path.exists(frontend_out_dir):
    frontend_out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

if os.path.exists(frontend_out_dir):
    app.mount("/", StaticFiles(directory=frontend_out_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
