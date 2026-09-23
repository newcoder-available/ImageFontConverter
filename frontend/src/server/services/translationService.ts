import { OpenAITranslationProvider, TranslationOutput } from '../providers/openai';
import { TextBlock } from '@/types';

export class ServerTranslationService {
  private translationProvider: OpenAITranslationProvider;

  constructor(translationProvider?: OpenAITranslationProvider) {
    this.translationProvider = translationProvider || new OpenAITranslationProvider();
  }

  public async translateBlocks(
    blocks: TextBlock[],
    sourceLanguage: string,
    targetLanguage: string,
    visualContext = 'gaming graphic, marketing banner, or UI layout',
    glossary?: Record<string, Record<string, string>>
  ): Promise<TextBlock[]> {
    const translatedBlocks: TextBlock[] = [];

    for (const block of blocks) {
      if (block.skipTranslation || block.classification === 'PROTECTED') {
        translatedBlocks.push({
          ...block,
          translatedText: block.originalText,
        });
        continue;
      }

      const res: TranslationOutput = await this.translationProvider.translateText({
        text: block.originalText,
        sourceLanguage,
        targetLanguage,
        visualContext,
        textType: block.type,
        glossary,
      });

      translatedBlocks.push({
        ...block,
        translatedText: res.translatedText,
        confidence: res.confidence,
      });
    }

    return translatedBlocks;
  }
}
