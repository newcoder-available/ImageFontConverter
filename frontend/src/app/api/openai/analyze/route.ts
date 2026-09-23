import { NextRequest, NextResponse } from 'next/server';
import { TextDetectionService } from '@/server/services/textDetectionService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageWidth, imageHeight } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const service = new TextDetectionService();
    const result = await service.detectText(imageBase64, imageWidth || 800, imageHeight || 600);

    return NextResponse.json({
      success: true,
      sourceLanguage: result.sourceLanguage,
      detectedScript: result.detectedScript,
      direction: result.direction,
      confidence: result.confidence,
      textBlocks: result.textBlocks,
    });
  } catch (error: any) {
    console.error('API Analyze error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
