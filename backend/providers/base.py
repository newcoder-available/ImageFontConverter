from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
from models import TextBlock, StyleInfo, QAResult, TextClassificationType

class BaseVisionProvider(ABC):
    """Abstract interface for image vision & text localization."""
    @abstractmethod
    def detect_regions(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        pass

class BaseLanguageDetectionProvider(ABC):
    """Abstract interface for automatic language detection."""
    @abstractmethod
    def detect_language(self, text: str) -> Dict[str, Any]:
        pass

class BaseTranslationProvider(ABC):
    """Abstract interface for contextual translation with glossary support."""
    @abstractmethod
    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[str] = None,
        text_type: Optional[str] = None,
        glossary: Optional[Dict[str, Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        pass

class BaseTypographyProvider(ABC):
    """Abstract interface for analyzing font styles, 3D effects, and colors."""
    @abstractmethod
    def analyze_typography(self, img_bgr: np.ndarray, region_data: Dict[str, Any]) -> StyleInfo:
        pass

class BaseImageEditingProvider(ABC):
    """Abstract interface for text mask inpainting and rendering."""
    @abstractmethod
    def inpaint_text_regions(self, img_bgr: np.ndarray, regions: List[Dict[str, Any]]) -> np.ndarray:
        pass

    @abstractmethod
    def render_text(self, background_bgr: np.ndarray, text_blocks: List[TextBlock], target_lang: str) -> np.ndarray:
        pass

class BaseQAProvider(ABC):
    """Abstract interface for visual and linguistic quality assurance."""
    @abstractmethod
    def validate(
        self,
        original_img: np.ndarray,
        localized_img: np.ndarray,
        text_blocks: List[TextBlock],
        target_lang: str
    ) -> QAResult:
        pass
