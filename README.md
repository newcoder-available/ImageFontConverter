# 🎨 Image Font Converter

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-000000.svg?style=flat&logo=next.js)](https://nextjs.org)
[![OpenCV](https://img.shields.io/badge/CV-OpenCV-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?style=flat&logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)

**Image Font Converter** is a production-ready, full-stack AI & Computer Vision web application designed to automatically detect, translate, and replace text inside images **without altering the original image graphics, backgrounds, logos, buttons, gradients, icons, artwork, dimensions, or visual elements**.

---

## 🌟 Key Highlights

* **Non-Destructive In-Image Translation**: Modifies only the pixels corresponding to detected text regions. Never regenerates the entire image.
* **Polygon-Level OCR Detection**: Uses **RapidOCR / PaddleOCR ONNX** for precise polygon bounding coordinates, confidence metrics, and rotation angles.
* **Background Inpainting & Restoration**: Employs localized **OpenCV Telea & Navier-Stokes Inpainting** with configurable mask dilation to restore underlying background textures seamlessly.
* **Accurate Dominant Text Color Extraction**: Uses Otsu thresholding and contour masking to sample pure foreground character strokes, avoiding background color contamination.
* **Multilingual Unicode Font Renderer**: Features dynamic **Binary Search Box Fitting (`fit_text_to_box`)** to fit translated text into original bounding boxes without stretching.
* **Arabic & RTL Support**: Native Right-to-Left text shaping and bidirectional layout using `arabic-reshaper` and `python-bidi`.
* **Interactive Web Studio**:
  * **Split Before/After Comparison Slider** and **Side-by-Side View** with 50%–400% zoom controls.
  * **Interactive SVG Polygon Overlays** with clickable text region selection.
  * **Real-Time Text Block Inspector**: Fine-tune translated text, font family, font size slider, weight, color picker, alignment, and rotation angle with live re-render.
  * **High-Resolution Export**: One-click download for PNG or JPEG.

---

## 🏗️ Architecture & Pipeline

```
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│  Upload Image   │ ──► │  RapidOCR (PaddleOCR) │ ──► │ Polygon Bounding Boxes │
└─────────────────┘     └───────────────────────┘     └───────────┬────────────┘
                                                                  │
       ┌──────────────────────────────────────────────────────────┴────────────────────────────────────┐
       ▼                                                          ▼                                    ▼
┌───────────────────────────┐                        ┌────────────────────────┐           ┌────────────────────────┐
│  Style & Color Analysis   │                        │ Background Inpainting  │           │   Translation Engine   │
│ (Otsu Stroke Thresholding)│                        │  (OpenCV Telea / NS)   │           │ (15+ Target Languages) │
└──────────────┬────────────┘                        └───────────┬────────────┘           └───────────┬────────────┘
               │                                                  │                                   │
               └──────────────────────────┬───────────────────────┴───────────────────────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │ Multilingual Unicode Renderer   │
                         │   (Binary Search Box Fitting)   │
                         └────────────────┬────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Next.js Interactive Studio    │
                         │ (Split Slider + Live Inspector) │
                         └─────────────────────────────────┘
```

---

## 🌐 Supported Languages

* 🇫🇷 French (`fr`)
* 🇪🇸 Spanish (`es`)
* 🇩🇪 German (`de`)
* 🇮🇹 Italian (`it`)
* 🇵🇹 Portuguese (`pt`)
* 🇳🇱 Dutch (`nl`)
* 🇨🇳 Chinese Simplified (`zh-CN`)
* 🇹🇼 Chinese Traditional (`zh-TW`)
* 🇯🇵 Japanese (`ja`)
* 🇰🇷 Korean (`ko`)
* 🇮🇳 Hindi (`hi`)
* 🇸🇦 Arabic RTL (`ar`)
* 🇷🇺 Russian (`ru`)
* 🇵🇱 Polish (`pl`)
* 🇬🇧 English (`en`)

---

## 📂 Project Structure

```
ImageFontConverter/
├── backend/
│   ├── fonts/               # Bundled Unicode fonts (Noto Sans, CJK, Devanagari, Arabic)
│   ├── samples/             # Built-in demo sample images (Gaming UI, Sale Banner)
│   ├── tests/               # Automated pipeline integration tests
│   ├── main.py              # FastAPI server & route handlers
│   ├── models.py            # Pydantic data models & request/response schemas
│   ├── ocr_engine.py        # RapidOCR / PaddleOCR text detection
│   ├── inpainter.py         # OpenCV Telea/NS background restoration
│   ├── style_analyzer.py    # Dominant text color and appearance extractor
│   ├── translator.py        # Modular translation service with caching & fallbacks
│   ├── text_renderer.py     # Unicode font fitting, BiDi shaping & rendering
│   ├── sample_generator.py  # Demo sample image generator
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css  # Modern dark glassmorphism styling
│   │   │   ├── layout.tsx   # Root layout
│   │   │   └── page.tsx     # Main application workspace
│   │   ├── components/
│   │   │   ├── Header.tsx                 # Navigation & engine health badge
│   │   │   ├── ImageDropzone.tsx          # Drag & drop upload with validation
│   │   │   ├── SampleImagesGallery.tsx    # 1-click demo presets
│   │   │   ├── ImageComparisonSlider.tsx  # Split slider & zoom viewer
│   │   │   ├── TextBlockEditor.tsx        # Live text inspector sidebar
│   │   │   └── ExportModal.tsx            # High-res download modal
│   │   └── types/
│   │       └── index.ts     # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── requirements.txt         # Root Python requirements
├── .gitignore               # Clean git exclusions
└── README.md                # Project documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+ & npm**

---

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
# Windows:
python -m venv .venv
.\.venv\Scripts\activate

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be available at `http://127.0.0.1:8000`.
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup (Next.js)

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install Node packages
npm install

# Start the development server
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Testing

To run the automated end-to-end computer vision and translation pipeline tests:

```bash
cd backend
python tests/test_pipeline.py
```

This verifies:
1. Sample image generation (Gaming UI with `WINNER`, `START GAME`, `SELECT BET`).
2. OCR polygon bounding box detection.
3. Text appearance and `#FFD700` Gold / `#FFFFFF` White color extraction.
4. OpenCV inpainting of background textures.
5. Multilingual translation and rendering into French, Chinese, Arabic (RTL), Hindi, and Spanish.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/languages` | List all supported target languages |
| `GET` | `/api/fonts` | List available Unicode font options |
| `GET` | `/api/samples` | Retrieve preloaded demo images |
| `POST` | `/api/process` | Full pipeline: upload image, OCR, inpaint, translate & render |
| `POST` | `/api/rerender` | Fast live re-rendering on manual user text/style adjustments |
| `POST` | `/api/translate-text`| Single string translation utility |

---

## 📄 License

This project is licensed under the MIT License.
