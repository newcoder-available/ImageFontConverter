import { OpenAIVisionProvider, OpenAIVisionResult } from '../providers/openai';
import { TextBlock } from '@/types';

export class TextDetectionService {
  private visionProvider: OpenAIVisionProvider;

  constructor(visionProvider?: OpenAIVisionProvider) {
    this.visionProvider = visionProvider || new OpenAIVisionProvider();
  }

  public async detectText(
    imageBase64: string,
    imageWidth = 800,
    imageHeight = 600
  ): Promise<OpenAIVisionResult> {
    const result = await this.visionProvider.detectTextAndLayout(imageBase64, imageWidth, imageHeight);
    
    // Post-process & validate bounding boxes
    const validatedBlocks = result.textBlocks.map((block) => {
      const box = block.boundingBox;
      const validX = Math.max(0, Math.min(box.x, imageWidth - 1));
      const validY = Math.max(0, Math.min(box.y, imageHeight - 1));
      const validW = Math.max(1, Math.min(box.width, imageWidth - validX));
      const validH = Math.max(1, Math.min(box.height, imageHeight - validY));

      return {
        ...block,
        boundingBox: {
          x: validX,
          y: validY,
          width: validW,
          height: validH,
        },
      };
    });

    return {
      ...result,
      textBlocks: validatedBlocks,
    };
  }
}
