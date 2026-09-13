export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StyleInfo {
  fontSize: number;
  color: string;
  fontWeight: string;
  fontFamily: string;
  fontCategory?: string;
  alignment: 'left' | 'center' | 'right';
  rotation: number;
  lineHeight: number;
  isMultiline: boolean;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface TextBlock {
  id: string;
  originalText: string;
  translatedText: string;
  confidence: number;
  boundingBox: BoundingBox;
  polygon: number[][];
  rotation: number;
  style: StyleInfo;
  isEdited?: boolean;
  skipTranslation?: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  isRtl?: boolean;
}

export interface FontOption {
  id: string;
  name: string;
  category: string;
  isUnicode: boolean;
}

export interface ProcessImageResponse {
  success: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  imageWidth: number;
  imageHeight: number;
  textBlocks: TextBlock[];
  translatedImageBase64: string;
  inpaintedImageBase64: string;
  originalImageBase64: string;
  processingTimeMs: number;
}

export interface SampleImageItem {
  filename: string;
  title: string;
  base64: string;
}
