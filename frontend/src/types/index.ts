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
  letterSpacing?: number;
  isMultiline: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  gradientColors?: string[];
  glowColor?: string;
  glowRadius?: number;
}

export interface TextBlock {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage?: string;
  script?: string;
  confidence: number;
  boundingBox: BoundingBox;
  polygon: number[][];
  rotation: number;
  type?: string;
  hierarchy?: number;
  classification?: 'TRANSLATABLE' | 'PROTECTED' | 'AMBIGUOUS';
  style: StyleInfo;
  isEdited?: boolean;
  skipTranslation?: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  script?: string;
  direction?: 'ltr' | 'rtl';
  isRtl?: boolean;
  fontFamily?: string;
  locale?: string;
  recommendedFonts?: string[];
}

export interface FontOption {
  id: string;
  name: string;
  category: string;
  isUnicode: boolean;
  scripts?: string[];
}

export interface QACheckItem {
  name: string;
  passed: boolean;
  score: number;
  message: string;
}

export interface QAResult {
  overallPassed: boolean;
  overallScore: number;
  checks: QACheckItem[];
  boundaryFittingScore: number;
  scriptIntegrityScore: number;
  backgroundPreservationScore: number;
  typographyMatch?: number;
  correctionAttempts?: number;
  notes: string[];
}

export interface LocalizedVariant {
  targetLanguage: string;
  languageName: string;
  nativeName: string;
  script: string;
  direction?: 'ltr' | 'rtl';
  isRtl?: boolean;
  translatedImageBase64: string;
  textBlocks: TextBlock[];
  qaResult?: QAResult;
}

export interface AnalyzeImageResponse {
  success: boolean;
  sourceLanguage: string;
  detectedScript: string;
  languageConfidence: number;
  direction: string;
  imageWidth: number;
  imageHeight: number;
  textBlocks: TextBlock[];
  processingTimeMs: number;
}

export interface ProcessImageResponse {
  success: boolean;
  sourceLanguage: string;
  detectedScript?: string;
  targetLanguage: string;
  imageWidth: number;
  imageHeight: number;
  textBlocks: TextBlock[];
  translatedImageBase64: string;
  inpaintedImageBase64: string;
  originalImageBase64: string;
  processingTimeMs: number;
  qaResult?: QAResult;
}

export interface MultiProcessResponse {
  success: boolean;
  sourceLanguage: string;
  detectedScript?: string;
  targetLanguages: string[];
  imageWidth: number;
  imageHeight: number;
  originalImageBase64: string;
  inpaintedImageBase64: string;
  variants: LocalizedVariant[];
  processingTimeMs: number;
}

export interface RerenderRequest {
  imageBase64: string;
  inpaintedBase64?: string;
  targetLanguage: string;
  textBlocks: TextBlock[];
  imageWidth: number;
  imageHeight: number;
}

export interface RerenderResponse {
  success: boolean;
  renderedImageBase64: string;
  textBlocks: TextBlock[];
  qaResult?: QAResult;
}

export interface SingleTranslateResponse {
  originalText: string;
  translatedText: string;
  detectedSourceLanguage: string;
  confidence: number;
  isGlossaryOverride: boolean;
}

export interface SampleImageItem {
  filename: string;
  title: string;
  base64: string;
}

export interface ProjectHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  sourceLanguage: string;
  targetLanguages: string[];
  thumbnailBase64: string;
  imageWidth: number;
  imageHeight: number;
  originalImageBase64: string;
  inpaintedImageBase64: string;
  variants: LocalizedVariant[];
}

export interface GlossaryTerm {
  id: string;
  sourceText: string;
  translations: Record<string, string>;
  category?: string;
  notes?: string;
}

export interface SettingsConfig {
  aiProvider: 'mock' | 'openai' | 'gemini' | 'anthropic' | 'self-hosted';
  visionProvider?: string;
  translationProvider?: string;
  inpaintMethod: 'telea' | 'ns';
  storageProvider: 'local' | 'gcs' | 's3';
  selfHostedEndpoint?: string;
  apiKeyConfigured?: boolean;
  openaiApiKey?: string;
  geminiApiKey?: string;
  anthropicApiKey?: string;
}
