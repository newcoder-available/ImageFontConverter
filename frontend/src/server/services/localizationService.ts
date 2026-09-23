import { OpenAIImageEditingProvider, ImageEditResult } from '../providers/openai';
import { TextBlock } from '@/types';

export class LocalizationService {
  private imageEditingProvider: OpenAIImageEditingProvider;

  constructor(imageEditingProvider?: OpenAIImageEditingProvider) {
    this.imageEditingProvider = imageEditingProvider || new OpenAIImageEditingProvider();
  }

  public async localizeImage(
    originalImageBase64: string,
    maskBase64: string,
    textBlocks: TextBlock[],
    targetLanguage: string,
    promptInstructions?: string
  ): Promise<ImageEditResult> {
    return this.imageEditingProvider.editImageWithMask({
      originalImageBase64,
      maskBase64,
      textBlocks,
      targetLanguage,
      promptInstructions,
      useDeterministicCompositing: false,
    });
  }
}
