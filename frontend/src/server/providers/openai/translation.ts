import OpenAI from 'openai';
import { getOpenAIConfig } from '../../config';

export interface TranslationInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  visualContext?: string;
  textType?: string;
  glossary?: Record<string, Record<string, string>>;
}

export interface TranslationOutput {
  sourceText: string;
  translatedText: string;
  confidence: number;
  isGlossaryOverride: boolean;
}

export class OpenAITranslationProvider {
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const config = getOpenAIConfig();
    const key = apiKey || config.apiKey;
    if (key) {
      this.client = new OpenAI({ apiKey: key });
    }
    this.model = model || config.translationModel;
  }

  public async translateText(input: TranslationInput): Promise<TranslationOutput> {
    const cleanText = input.text.trim();
    const upperText = cleanText.toUpperCase();

    // 1. Check user-defined glossary override
    if (input.glossary && input.glossary[upperText]) {
      const targetMap = input.glossary[upperText];
      if (targetMap[input.targetLanguage]) {
        return {
          sourceText: cleanText,
          translatedText: targetMap[input.targetLanguage],
          confidence: 1.0,
          isGlossaryOverride: true,
        };
      }
    }

    // 2. Fallback if no OpenAI client configured
    if (!this.client) {
      return this.getMockTranslation(cleanText, input.targetLanguage);
    }

    // 3. OpenAI Prompt
    try {
      const prompt = `You are a professional image text localization translation agent.
Translate the following in-image UI text from ${input.sourceLanguage} to ${input.targetLanguage}.
Context: ${input.visualContext || 'gaming UI, e-commerce, or advertising graphic'}.
Text Type: ${input.textType || 'headline'}.

CRITICAL RULES:
1. Translate contextually and naturally for the target script.
2. Maintain visual brevity and length appropriate for the original graphical layout.
3. Preserve all-caps casing if original is all-caps.
4. Return ONLY a strict JSON object with:
{
  "sourceText": "original string",
  "translatedText": "translated string",
  "confidence": number between 0.0 and 1.0
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an image localization translation specialist.' },
          { role: 'user', content: `${prompt}\n\nText to translate:\n"${cleanText}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getMockTranslation(cleanText, input.targetLanguage);
      }

      const parsed = JSON.parse(content);
      return {
        sourceText: cleanText,
        translatedText: parsed.translatedText || cleanText,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.98,
        isGlossaryOverride: false,
      };
    } catch (e) {
      console.warn('OpenAI translation failed, falling back to dictionary', e);
      return this.getMockTranslation(cleanText, input.targetLanguage);
    }
  }

  private getMockTranslation(text: string, targetLanguage: string): TranslationOutput {
    const DICT: Record<string, Record<string, string>> = {
      BOOSTER: {
        ja: 'ブースター',
        hi: 'बूस्टर',
        'zh-CN': '助推器',
        ko: '부스터',
        de: 'BOOSTER',
        fr: 'BOOSTER',
        es: 'PROPULSOR',
        ar: 'معزز',
        he: 'מאיץ',
        ru: 'УСКОРИТЕЛЬ',
      },
      WINNER: {
        ja: '勝者',
        hi: 'विजेता',
        'zh-CN': '获胜者',
        ko: '승리자',
        de: 'GEWINNER',
        fr: 'GAGNANT',
        es: 'GANADOR',
        ar: 'الفائز',
        he: 'מנצח',
        ru: 'ПОБЕДИТЕЛЬ',
      },
      'START GAME': {
        ja: 'ゲーム開始',
        hi: 'खेल शुरू करें',
        'zh-CN': '开始游戏',
        ko: '게임 시작',
        de: 'SPIEL STARTEN',
        fr: 'COMMENCER LA PARTIE',
        es: 'INICIAR JUEGO',
        ar: 'ابدأ اللعبة',
      },
    };

    const upper = text.toUpperCase();
    if (DICT[upper] && DICT[upper][targetLanguage]) {
      return {
        sourceText: text,
        translatedText: DICT[upper][targetLanguage],
        confidence: 0.99,
        isGlossaryOverride: false,
      };
    }

    return {
      sourceText: text,
      translatedText: text,
      confidence: 0.9,
      isGlossaryOverride: false,
    };
  }
}
