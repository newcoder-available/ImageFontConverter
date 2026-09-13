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
  textBlocks: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  imageWidth: number;
  imageHeight: number;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalImage,
  translatedImage,
  inpaintedImage,
  textBlocks,
  selectedBlockId,
  onSelectBlock,
  imageWidth,
  imageHeight
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'inpainted'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        updateSliderPosition(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col w-full bg-slate-950/70 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-sm gap-2">
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'slider'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          {inpaintedImage && (
            <button
              onClick={() => setViewMode('inpainted')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'inpainted'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Clean Background</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Overlays toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showOverlays
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOverlays ? 'Text Boxes On' : 'Text Boxes Off'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium text-slate-300 px-1.5 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3.0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Canvas Area */}
      <div className="relative w-full overflow-auto p-4 flex items-center justify-center min-h-[420px] max-h-[680px] bg-slate-950">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 ease-out max-w-full"
        >
          {viewMode === 'slider' && (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="relative select-none overflow-hidden rounded-xl border border-slate-800 shadow-2xl cursor-ew-resize inline-block"
              style={{ maxWidth: '100%' }}
            >
              {/* Base layer: Translated Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={translatedImage}
                alt="Translated"
                className="block max-w-full max-h-[580px] object-contain pointer-events-none"
              />

              {/* Top layer: Original Image clipped by slider position */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage}
                  alt="Original"
                  className="block max-w-full max-h-[580px] object-contain"
                />
              </div>

              {/* Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                  <SplitSquareVertical className="w-4 h-4 text-cyan-300" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-200 pointer-events-none">
                Original Image
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-indigo-950/80 backdrop-blur-md border border-indigo-500/50 text-[11px] font-semibold text-indigo-200 pointer-events-none">
                Translated Image
              </div>

              {/* SVG Polygon Clickable Overlays */}
              {showOverlays && (
                <svg
                  viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                >
                  {textBlocks.map((block) => {
                    const isSelected = selectedBlockId === block.id;
                    const pointsStr = block.polygon.map((pt) => `${pt[0]},${pt[1]}`).join(' ');

                    return (
                      <g key={block.id} className="cursor-pointer" onClick={() => onSelectBlock(block.id)}>
                        <polygon
                          points={pointsStr}
                          className={`transition-all duration-200 ${
                            isSelected
                              ? 'fill-cyan-500/30 stroke-cyan-400 stroke-2'
                              : 'fill-indigo-500/10 hover:fill-indigo-500/25 stroke-indigo-400/70 hover:stroke-indigo-300 stroke-[1.5]'
                          }`}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          )}

          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
              {/* Left: Original */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-300">
                  Original
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage}
                  alt="Original"
                  className="block max-w-full max-h-[520px] object-contain mx-auto"
                />
              </div>

              {/* Right: Translated */}
              <div className="relative rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-900 shadow-xl shadow-indigo-500/5">
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-indigo-950/80 backdrop-blur-md border border-indigo-500/50 text-xs font-semibold text-indigo-200">
                  Translated
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={translatedImage}
                  alt="Translated"
                  className="block max-w-full max-h-[520px] object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {viewMode === 'inpainted' && inpaintedImage && (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 select-none inline-block">
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-purple-950/80 backdrop-blur-md border border-purple-500/50 text-xs font-semibold text-purple-200">
                Clean Restored Background (Text Removed)
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inpaintedImage}
                alt="Clean Background"
                className="block max-w-full max-h-[580px] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
