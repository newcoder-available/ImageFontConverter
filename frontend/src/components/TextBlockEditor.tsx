'use client';

import React from 'react';
import { 
  Type, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  RotateCw, 
  Sliders, 
  Check, 
  RefreshCw,
  EyeOff,
  Sparkles,
  Layers
} from 'lucide-react';
import { TextBlock, FontOption } from '@/types';

interface TextBlockEditorProps {
  blocks: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (updatedBlock: TextBlock) => void;
  onApplyRerender: () => void;
  isRerendering: boolean;
  fonts: FontOption[];
}

const COLOR_SWATCHES = [
  '#FFFFFF',
  '#000000',
  '#FFD700',
  '#FF3B30',
  '#34C759',
  '#007AFF',
  '#5856D6',
  '#FF9500',
  '#06B6D4',
  '#F43F5E',
];

export const TextBlockEditor: React.FC<TextBlockEditorProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onApplyRerender,
  isRerendering,
  fonts,
}) => {
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || (blocks.length > 0 ? blocks[0] : null);

  if (!selectedBlock) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400">
        <Layers className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
        <p className="text-sm font-medium">No text blocks detected</p>
      </div>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateBlock({
      ...selectedBlock,
      translatedText: e.target.value,
      isEdited: true,
    });
  };

  const handleColorChange = (color: string) => {
    onUpdateBlock({
      ...selectedBlock,
      style: {
        ...selectedBlock.style,
        color,
      },
      isEdited: true,
    });
  };

  const handleFontSizeChange = (fontSize: number) => {
    onUpdateBlock({
      ...selectedBlock,
      style: {
        ...selectedBlock.style,
        fontSize,
      },
      isEdited: true,
    });
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    onUpdateBlock({
      ...selectedBlock,
      style: {
        ...selectedBlock.style,
        alignment,
      },
      isEdited: true,
    });
  };

  const handleFontWeightChange = (fontWeight: string) => {
    onUpdateBlock({
      ...selectedBlock,
      style: {
        ...selectedBlock.style,
        fontWeight,
      },
      isEdited: true,
    });
  };

  const handleRotationChange = (rotation: number) => {
    onUpdateBlock({
      ...selectedBlock,
      rotation,
      style: {
        ...selectedBlock.style,
        rotation,
      },
      isEdited: true,
    });
  };

  const handleToggleSkip = () => {
    onUpdateBlock({
      ...selectedBlock,
      skipTranslation: !selectedBlock.skipTranslation,
      isEdited: true,
    });
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Text Block Inspector
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {blocks.length} {blocks.length === 1 ? 'Region' : 'Regions'}
        </span>
      </div>

      {/* Block Selector Tabs */}
      <div className="px-4 py-2.5 border-b border-white/5 bg-slate-950/60 overflow-x-auto flex items-center space-x-1.5 scrollbar-thin">
        {blocks.map((block, idx) => {
          const isSelected = selectedBlock.id === block.id;
          return (
            <button
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>#{idx + 1}</span>
              <span className="truncate max-w-[100px]">{block.originalText}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1">
        {/* Original Text Reference */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Original OCR Text</span>
            <span className="text-emerald-400 font-mono">
              {Math.round(selectedBlock.confidence * 100)}% Conf
            </span>
          </div>
          <p className="text-sm font-mono text-slate-200 font-semibold break-words">
            {selectedBlock.originalText}
          </p>
        </div>

        {/* Translated Text Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Translated Text</span>
            {selectedBlock.isEdited && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Custom Modified
              </span>
            )}
          </label>
          <textarea
            rows={2}
            value={selectedBlock.translatedText}
            onChange={handleTextChange}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
            placeholder="Enter translated text..."
          />
        </div>

        {/* Font Family Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Font Family & Script
          </label>
          <select
            value={selectedBlock.style.fontFamily}
            onChange={(e) =>
              onUpdateBlock({
                ...selectedBlock,
                style: { ...selectedBlock.style, fontFamily: e.target.value },
                isEdited: true,
              })
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
          >
            {fonts.map((f) => (
              <option key={f.id} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size & Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Font Size</span>
              <span className="font-mono text-cyan-400 font-bold">{selectedBlock.style.fontSize}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={selectedBlock.style.fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Font Weight
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
              {['light', 'normal', 'bold'].map((weight) => (
                <button
                  key={weight}
                  onClick={() => handleFontWeightChange(weight)}
                  className={`py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    selectedBlock.style.fontWeight === weight
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Picker & Palette */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
            <span>Text Color</span>
            <span className="font-mono text-xs text-slate-400">{selectedBlock.style.color}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-shrink-0">
              <input
                type="color"
                value={selectedBlock.style.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-9 h-9 rounded-xl border border-slate-700 cursor-pointer bg-transparent p-0 overflow-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 flex-1">
              {COLOR_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleColorChange(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 ${
                    selectedBlock.style.color.toUpperCase() === hex
                      ? 'border-cyan-400 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'border-white/20'
                  }`}
                  title={hex}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Alignment & Rotation */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Alignment
            </label>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              {(['left', 'center', 'right'] as const).map((align) => {
                const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                return (
                  <button
                    key={align}
                    onClick={() => handleAlignmentChange(align)}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg transition-all ${
                      selectedBlock.style.alignment === align
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Rotation</span>
              <span className="font-mono text-cyan-400">{Math.round(selectedBlock.rotation)}°</span>
            </div>
            <input
              type="range"
              min={-90}
              max={90}
              value={Math.round(selectedBlock.rotation)}
              onChange={(e) => handleRotationChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center space-x-2">
          <button
            onClick={handleToggleSkip}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-center space-x-1.5 ${
              selectedBlock.skipTranslation
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>{selectedBlock.skipTranslation ? 'Skipped' : 'Skip Translation'}</span>
          </button>

          <button
            onClick={onApplyRerender}
            disabled={isRerendering}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRerendering ? 'animate-spin' : ''}`} />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
