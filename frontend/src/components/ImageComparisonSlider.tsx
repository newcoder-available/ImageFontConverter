'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, 
  SplitSquareVertical, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import { TextBlock } from '@/types';

interface ImageComparisonSliderProps {
  originalImage: string;
  translatedImage: string;
  inpaintedImage?: string;
  originalLabel?: string;
  translatedLabel?: string;
  textBlocks?: TextBlock[];
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string | null) => void;
  imageWidth?: number;
  imageHeight?: number;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalImage,
  translatedImage,
  inpaintedImage,
  originalLabel = 'Original Artwork',
  translatedLabel = 'Localized Artwork',
  textBlocks = [],
  selectedBlockId = null,
  onSelectBlock,
  imageWidth = 800,
  imageHeight = 600,
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'inpainted'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const offset = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offset / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-2">
      {/* Viewer Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full flex-1 min-h-[340px] bg-slate-950 rounded-xl overflow-hidden select-none touch-none flex items-center justify-center border border-slate-800"
      >
        {/* Background / Original Image */}
        <img
          src={originalImage}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Foreground / Localized Image (Clipped via Slider) */}
        <div
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <img
            src={translatedImage}
            alt="Localized"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* Vertical Divider Bar */}
        <div
          style={{ left: `${sliderPos}%` }}
          onPointerDown={handlePointerDown}
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize z-30 shadow-[0_0_10px_rgba(34,211,238,0.8)] flex items-center justify-center -translate-x-1/2"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-xl flex items-center justify-center text-cyan-300">
            <SplitSquareVertical className="w-4 h-4 rotate-90" />
          </div>
        </div>

        {/* Labels Overlay */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300 z-20 pointer-events-none">
          {originalLabel}
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30 text-[11px] font-bold text-cyan-300 z-20 pointer-events-none">
          {translatedLabel}
        </div>
      </div>

      {/* Slider Hint */}
      <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-medium">
        <span>← {originalLabel}</span>
        <span>Drag center handle to compare preservation</span>
        <span>{translatedLabel} →</span>
      </div>
    </div>
  );
};
