import { NextRequest, NextResponse } from 'next/server';
import { OpenAITranslationProvider } from '@/server/providers/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, sourceLanguage, targetLanguage, visualContext, textType, glossary } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    const provider = new OpenAITranslationProvider();
    const result = await provider.translateText({
      text,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage: targetLanguage || 'ja',
      visualContext,
      textType,
      glossary,
    });

    return NextResponse.json({
      success: true,
      originalText: result.sourceText,
      translatedText: result.translatedText,
      confidence: result.confidence,
      isGlossaryOverride: result.isGlossaryOverride,
    });
  } catch (error: any) {
    console.error('API Translate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
