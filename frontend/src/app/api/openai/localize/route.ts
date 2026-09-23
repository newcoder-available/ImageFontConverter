import { NextRequest, NextResponse } from 'next/server';
import { LocalizationOrchestrator } from '@/server/orchestrator/localizationOrchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalImageBase64, sourceLanguage, targetLanguages, imageWidth, imageHeight, glossary } = body;

    if (!originalImageBase64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const orchestrator = new LocalizationOrchestrator();
    const result = await orchestrator.runPipeline({
      originalImageBase64,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguages: targetLanguages || ['ja', 'hi', 'de', 'es', 'fr'],
      imageWidth,
      imageHeight,
      glossary,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Localize error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
