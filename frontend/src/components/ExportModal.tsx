'use client';

import React, { useState } from 'react';
import { Download, X, CheckCircle, FileImage, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  targetLanguage: string;
  imageWidth: number;
  imageHeight: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  targetLanguage,
  imageWidth,
  imageHeight,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [fileName, setFileName] = useState<string>(`translated_image_${targetLanguage}`);

  if (!isOpen) return null;

  const handleDownload = () => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${fileName || 'translated_image'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Translated Image</h3>
              <p className="text-xs text-slate-400">High-resolution pixel-preserved output</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Preview Thumbnail */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Export Preview" className="max-h-40 object-contain" />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-700">
              {imageWidth} × {imageHeight} px
            </div>
          </div>

          {/* Filename Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-medium"
            />
          </div>

          {/* Format Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all ${
                  format === 'png'
                    ? 'border-cyan-400 bg-cyan-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <FileImage className="w-5 h-5 text-cyan-400" />
                <div className="text-left">
                  <div className="text-xs font-bold">PNG Image</div>
                  <div className="text-[10px] text-slate-400">Lossless · Crisp typography</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all ${
                  format === 'jpeg'
                    ? 'border-cyan-400 bg-cyan-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <FileImage className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <div className="text-xs font-bold">JPEG Image</div>
                  <div className="text-[10px] text-slate-400">Standard · Smaller size</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
