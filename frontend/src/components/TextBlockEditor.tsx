'use client';

import React, { useState } from 'react';
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
  Layers,
  Shield,
  Trash2,
  Edit3
} from 'lucide-react';
import { TextBlock, FontOption } from '@/types';

interface TextBlockEditorProps {
  blocks?: TextBlock[];
  textBlocks?: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock?: (updatedBlock: TextBlock) => void;
  onBlockChange?: (updatedBlock: TextBlock) => void;
  onApplyRerender?: () => void;
  isRerendering?: boolean;
  fonts?: FontOption[];
  availableFonts?: FontOption[];
  targetLanguage?: string;
  apiBase?: string;
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
  textBlocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onBlockChange,
  onApplyRerender,
  isRerendering = false,
  fonts = [],
  availableFonts = [],
  targetLanguage = 'ja',
  apiBase = '',
}) => {
  const allBlocks = textBlocks || blocks || [];
  const fontList = availableFonts.length > 0 ? availableFonts : fonts;
  const updateFn = onBlockChange || onUpdateBlock || (() => {});

  const selectedBlock =
    allBlocks.find((b) => b.id === selectedBlockId) ||
    (allBlocks.length > 0 ? allBlocks[0] : null);

  const [activeTab, setActiveTab] = useState<'text' | 'typography' | 'effects'>('text');

  if (!selectedBlock) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-2">
        <Layers className="w-8 h-8 mx-auto text-slate-600" />
        <h4 className="text-xs font-bold text-slate-300">No Text Blocks Detected</h4>
        <p className="text-[11px] text-slate-500">
          Upload an image to inspect and edit localized text regions.
        </p>
      </div>
    );
  }

  const handleStyleChange = (field: string, value: any) => {
    const updated: TextBlock = {
      ...selectedBlock,
      style: {
        ...selectedBlock.style,
        [field]: value,
      },
      isEdited: true,
    };
    updateFn(updated);
  };

  const handleTextChange = (newTranslatedText: string) => {
    const updated: TextBlock = {
      ...selectedBlock,
      translatedText: newTranslatedText,
      isEdited: true,
    };
    updateFn(updated);
  };

  const handleRegenerateTranslation = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/translate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedBlock.originalText,
          sourceLanguage: selectedBlock.sourceLanguage || 'auto',
          targetLanguage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        handleTextChange(data.translatedText);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-2xl space-y-6">
      {/* Block Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Detected Regions ({allBlocks.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">ID: {selectedBlock.id}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {allBlocks.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBlock(b.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                b.id === selectedBlock.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {b.originalText.substring(0, 10)}
              {b.originalText.length > 10 ? '...' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Sub-Tabs: Text | Typography | 3D Effects */}
      <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'text' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          Translation
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'typography' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          Typography
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'effects' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          3D & Effects
        </button>
      </div>

      {/* Tab 1: Translation Review & Direct Edit */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Original Text ({selectedBlock.sourceLanguage || 'English'})
            </label>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
              {selectedBlock.originalText}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Localized Text ({targetLanguage.toUpperCase()})
              </label>
              <button
                onClick={handleRegenerateTranslation}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={selectedBlock.translatedText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => {
                const updated: TextBlock = {
                  ...selectedBlock,
                  skipTranslation: !selectedBlock.skipTranslation,
                };
                updateFn(updated);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                selectedBlock.skipTranslation
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{selectedBlock.skipTranslation ? 'Protected (Skipping Translation)' : 'Protect Text Region'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Typography & Sizing */}
      {activeTab === 'typography' && (
        <div className="space-y-4">
          {/* Font Family */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Font Family
            </label>
            <select
              value={selectedBlock.style.fontFamily}
              onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Noto Sans">Noto Sans (Universal Multilingual)</option>
              <option value="Noto Sans JP">Noto Sans JP (Japanese Kanji/Kana)</option>
              <option value="Noto Sans Devanagari">Noto Sans Devanagari (Hindi)</option>
              <option value="Noto Sans Arabic">Noto Sans Arabic (Arabic RTL)</option>
              <option value="Noto Sans Hebrew">Noto Sans Hebrew (Hebrew RTL)</option>
              <option value="Roboto">Roboto (Latin Modern)</option>
              <option value="Impact">Impact (Bold Gaming Display)</option>
              <option value="Montserrat">Montserrat (Geometric Modern)</option>
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-cyan-400">{selectedBlock.style.fontSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                value={selectedBlock.style.fontSize}
                onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Weight
              </label>
              <select
                value={selectedBlock.style.fontWeight}
                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="normal">Normal (400)</option>
                <option value="bold">Bold (700)</option>
                <option value="light">Light (300)</option>
              </select>
            </div>
          </div>

          {/* Color & Alignment */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-300">
              Text Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedBlock.style.color}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
              />
              <input
                type="text"
                value={selectedBlock.style.color}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-24 px-2 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              <div className="flex gap-1">
                {COLOR_SWATCHES.slice(0, 5).map((swatch) => (
                  <button
                    key={swatch}
                    onClick={() => handleStyleChange('color', swatch)}
                    style={{ backgroundColor: swatch }}
                    className="w-5 h-5 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Alignment
            </label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => handleStyleChange('alignment', align)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                    selectedBlock.style.alignment === align
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                  {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                  {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                  <span className="capitalize">{align}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 3D Shadows, Stroke, Glow */}
      {activeTab === 'effects' && (
        <div className="space-y-4">
          {/* Stroke / Outline */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Stroke Outline</span>
              <span className="text-[11px] font-mono text-cyan-400">
                {selectedBlock.style.strokeWidth || 0}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={selectedBlock.style.strokeWidth || 0}
              onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="color"
                value={selectedBlock.style.strokeColor || '#000000'}
                onChange={(e) => handleStyleChange('strokeColor', e.target.value)}
                className="w-6 h-6 rounded border border-slate-700 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Stroke Color</span>
            </div>
          </div>

          {/* 3D Extrusion Shadow */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">3D Shadow Offset</span>
              <span className="text-[11px] font-mono text-cyan-400">
                {selectedBlock.style.shadowOffsetX || 0}px, {selectedBlock.style.shadowOffsetY || 0}px
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500">X Offset</span>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  value={selectedBlock.style.shadowOffsetX || 0}
                  onChange={(e) => handleStyleChange('shadowOffsetX', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Y Offset</span>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  value={selectedBlock.style.shadowOffsetY || 0}
                  onChange={(e) => handleStyleChange('shadowOffsetY', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="color"
                value={selectedBlock.style.shadowColor || '#000000'}
                onChange={(e) => handleStyleChange('shadowColor', e.target.value)}
                className="w-6 h-6 rounded border border-slate-700 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Shadow / Extrusion Color</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
