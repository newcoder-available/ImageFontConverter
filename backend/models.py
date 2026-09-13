from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class StyleInfo(BaseModel):
    fontSize: int = Field(default=24, description="Calculated or user font size in px")
    color: str = Field(default="#FFFFFF", description="Dominant text color in HEX (#RRGGBB)")
    fontWeight: str = Field(default="bold", description="normal | bold | light")
    fontFamily: str = Field(default="Noto Sans", description="Font family name")
    fontCategory: str = Field(default="Sans Serif", description="Sans Serif | Serif | Display | Monospace")
    alignment: str = Field(default="center", description="left | center | right")
    rotation: float = Field(default=0.0, description="Rotation angle in degrees")
    lineHeight: float = Field(default=1.2, description="Line height multiplier")
    isMultiline: bool = Field(default=False, description="Whether text spans multiple lines")
    strokeColor: Optional[str] = Field(default=None, description="Outline/stroke color if detected")
    strokeWidth: int = Field(default=0, description="Outline/stroke thickness in px")

class TextBlock(BaseModel):
    id: str
    originalText: str
    translatedText: str
    confidence: float = 1.0
    boundingBox: BoundingBox
    polygon: List[List[int]] = Field(default_factory=list, description="List of [x, y] polygon vertices")
    rotation: float = 0.0
    style: StyleInfo
    isEdited: bool = False
    skipTranslation: bool = False

class ProcessImageResponse(BaseModel):
    success: bool
    sourceLanguage: str
    targetLanguage: str
    imageWidth: int
    imageHeight: int
    textBlocks: List[TextBlock]
    translatedImageBase64: str
    inpaintedImageBase64: str
    originalImageBase64: str
    processingTimeMs: float

class RerenderRequest(BaseModel):
    imageBase64: str  # Base64 of the original or inpainted image
    inpaintedBase64: Optional[str] = None
    targetLanguage: str
    textBlocks: List[TextBlock]
    imageWidth: int
    imageHeight: int

class RerenderResponse(BaseModel):
    success: bool
    renderedImageBase64: str
    textBlocks: List[TextBlock]

class SingleTranslateRequest(BaseModel):
    text: str
    sourceLanguage: str = "auto"
    targetLanguage: str

class SingleTranslateResponse(BaseModel):
    originalText: str
    translatedText: str
    detectedSourceLanguage: str

class SupportedLanguage(BaseModel):
    code: str
    name: str
    nativeName: str
    isRtl: bool = False

class FontOption(BaseModel):
    id: str
    name: str
    category: str
    isUnicode: bool = True
