from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class TextClassificationType(str, Enum):
    TRANSLATABLE = "TRANSLATABLE"
    PROTECTED = "PROTECTED"
    AMBIGUOUS = "AMBIGUOUS"

class TextRegionType(str, Enum):
    HEADLINE = "headline"
    TITLE = "title"
    SUBTITLE = "subtitle"
    BODY = "body"
    BUTTON = "button"
    BADGE = "badge"
    LABEL = "label"
    CAPTION = "caption"
    LOGO = "logo"
    UNKNOWN = "unknown"

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class StyleInfo(BaseModel):
    fontSize: int = Field(default=24, description="Calculated or user font size in px")
    color: str = Field(default="#FFFFFF", description="Dominant text face color in HEX (#RRGGBB)")
    fontWeight: str = Field(default="bold", description="normal | bold | light")
    fontFamily: str = Field(default="Noto Sans", description="Font family name")
    fontCategory: str = Field(default="Sans Serif", description="Sans Serif | Serif | Display | Monospace | Cartoon")
    alignment: str = Field(default="center", description="left | center | right")
    rotation: float = Field(default=0.0, description="Rotation angle in degrees")
    lineHeight: float = Field(default=1.15, description="Line height multiplier")
    letterSpacing: float = Field(default=0.0, description="Tracking / kerning offset in px")
    isMultiline: bool = Field(default=False, description="Whether text spans multiple lines")
    strokeColor: Optional[str] = Field(default=None, description="Outline/stroke color if detected")
    strokeWidth: int = Field(default=0, description="Outline/stroke thickness in px")
    shadowColor: Optional[str] = Field(default=None, description="3D extrusion or drop shadow color")
    shadowOffsetX: int = Field(default=0, description="3D shadow horizontal offset in px")
    shadowOffsetY: int = Field(default=0, description="3D shadow vertical offset in px")
    gradientColors: Optional[List[str]] = Field(default=None, description="Gradient color stops if detected")
    glowColor: Optional[str] = Field(default=None, description="Neon glow color")
    glowRadius: int = Field(default=0, description="Glow blur radius in px")

class TextBlock(BaseModel):
    id: str
    originalText: str
    translatedText: str
    sourceLanguage: str = "English"
    script: str = "Latin"
    confidence: float = 1.0
    boundingBox: BoundingBox
    polygon: List[List[int]] = Field(default_factory=list, description="List of [x, y] polygon vertices")
    rotation: float = 0.0
    type: str = "headline"
    hierarchy: int = 1
    classification: str = "TRANSLATABLE" # TRANSLATABLE | PROTECTED | AMBIGUOUS
    style: StyleInfo
    isEdited: bool = False
    skipTranslation: bool = False

class QACheckItem(BaseModel):
    name: str
    passed: bool
    score: float = 1.0  # 0.0 to 1.0
    message: str

class QAResult(BaseModel):
    overallPassed: bool
    overallScore: float  # 0 to 100
    checks: List[QACheckItem] = Field(default_factory=list)
    boundaryFittingScore: float = 100.0
    scriptIntegrityScore: float = 100.0
    backgroundPreservationScore: float = 100.0
    typographyMatch: float = 0.95
    correctionAttempts: int = 0
    notes: List[str] = Field(default_factory=list)

class LocalizedVariant(BaseModel):
    targetLanguage: str
    languageName: str
    nativeName: str
    script: str
    direction: str = "ltr"
    isRtl: bool = False
    translatedImageBase64: str
    textBlocks: List[TextBlock]
    qaResult: Optional[QAResult] = None

class ProcessImageResponse(BaseModel):
    success: bool
    sourceLanguage: str
    detectedScript: str = "Latin"
    targetLanguage: str
    imageWidth: int
    imageHeight: int
    textBlocks: List[TextBlock]
    translatedImageBase64: str
    inpaintedImageBase64: str
    originalImageBase64: str
    processingTimeMs: float
    qaResult: Optional[QAResult] = None

class MultiProcessResponse(BaseModel):
    success: bool
    sourceLanguage: str
    detectedScript: str = "Latin"
    targetLanguages: List[str]
    imageWidth: int
    imageHeight: int
    originalImageBase64: str
    inpaintedImageBase64: str
    variants: List[LocalizedVariant]
    processingTimeMs: float

class AnalyzeImageResponse(BaseModel):
    success: bool
    sourceLanguage: str
    detectedScript: str
    languageConfidence: float
    direction: str = "ltr"
    imageWidth: int
    imageHeight: int
    textBlocks: List[TextBlock]
    processingTimeMs: float

class RerenderRequest(BaseModel):
    imageBase64: str
    inpaintedBase64: Optional[str] = None
    targetLanguage: str
    textBlocks: List[TextBlock]
    imageWidth: int
    imageHeight: int

class RerenderResponse(BaseModel):
    success: bool
    renderedImageBase64: str
    textBlocks: List[TextBlock]
    qaResult: Optional[QAResult] = None

class SingleTranslateRequest(BaseModel):
    text: str
    sourceLanguage: str = "auto"
    targetLanguage: str
    context: Optional[str] = "gaming/marketing"
    textType: Optional[str] = "headline"

class SingleTranslateResponse(BaseModel):
    originalText: str
    translatedText: str
    detectedSourceLanguage: str
    confidence: float = 0.99
    isGlossaryOverride: bool = False

class SupportedLanguage(BaseModel):
    code: str
    name: str
    nativeName: str
    script: str = "Latin"
    direction: str = "ltr"  # ltr | rtl
    isRtl: bool = False
    fontFamily: str = "Noto Sans"
    locale: str = "en_US"
    recommendedFonts: List[str] = Field(default_factory=list)

class FontOption(BaseModel):
    id: str
    name: str
    category: str
    isUnicode: bool = True
    scripts: List[str] = Field(default_factory=list)

class GlossaryTerm(BaseModel):
    id: str
    sourceText: str
    translations: Dict[str, str]  # e.g. {"ja": "ブースター", "hi": "बूस्टर"}
    category: Optional[str] = "Brand/UI"
    notes: Optional[str] = None

class SettingsConfig(BaseModel):
    aiProvider: str = "mock"  # mock | openai | gemini | anthropic | self-hosted
    visionProvider: str = "mock"
    translationProvider: str = "mock"
    inpaintMethod: str = "telea"  # telea | ns
    storageProvider: str = "local"  # local | gcs | s3
    selfHostedEndpoint: Optional[str] = "http://localhost:11434"
    apiKeyConfigured: bool = False
    openaiApiKey: Optional[str] = None
    geminiApiKey: Optional[str] = None
    anthropicApiKey: Optional[str] = None

class ZipExportRequest(BaseModel):
    filenamePrefix: str = "localized_images"
    variants: List[Dict[str, str]]  # List of {"language": "ja", "imageBase64": "..."}

class BatchProcessRequest(BaseModel):
    images: List[Dict[str, str]]  # [{"filename": "img1.png", "base64": "..."}]
    sourceLanguage: str = "auto"
    targetLanguages: List[str] = ["ja", "hi", "de", "es", "fr"]
