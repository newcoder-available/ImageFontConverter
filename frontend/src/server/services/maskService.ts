import { TextBlock } from '@/types';

export interface MaskConfig {
  paddingPx?: number;
  includeShadow?: boolean;
}

export class MaskService {
  /**
   * Generates a base64 PNG mask where masked text regions are white (255, 255, 255)
   * and immutable background areas are black (0, 0, 0) or transparent.
   */
  public generateMaskBase64(
    blocks: TextBlock[],
    width: number,
    height: number,
    config: MaskConfig = { paddingPx: 8, includeShadow: true }
  ): string {
    const padding = config.paddingPx || 8;

    // Generate SVG path mask representation
    const rectsSvg = blocks
      .map((b) => {
        const box = b.boundingBox;
        const shadowX = config.includeShadow ? Math.max(0, b.style.shadowOffsetX || 0) : 0;
        const shadowY = config.includeShadow ? Math.max(0, b.style.shadowOffsetY || 0) : 0;
        const strokeW = b.style.strokeWidth || 0;

        const x = Math.max(0, box.x - padding - strokeW);
        const y = Math.max(0, box.y - padding - strokeW);
        const w = Math.min(width - x, box.width + padding * 2 + strokeW * 2 + shadowX);
        const h = Math.min(height - y, box.height + padding * 2 + strokeW * 2 + shadowY);

        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" rx="4" />`;
      })
      .join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="black" />
      ${rectsSvg}
    </svg>`;

    const b64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${b64}`;
  }
}
