'use client';

import React, { useState } from 'react';
import { Download, X, CheckCircle, FileImage, Sparkles, FileArchive } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LocalizedVariant } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  variants?: LocalizedVariant[];
  originalImage?: string;
  targetLanguage?: string;
  imageWidth?: number;
  imageHeight?: number;
  apiBase?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  variants = [],
  originalImage,
  targetLanguage = 'ja',
  imageWidth = 800,
  imageHeight = 600,
  apiBase = '',
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [fileName, setFileName] = useState<string>(`localized_${targetLanguage}`);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadSingle = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    const targetUrl = imageUrl || (variants.length > 0 ? variants[0].translatedImageBase64 : '');
    if (!targetUrl) return;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `${fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handleDownloadAllZip = async () => {
    if (variants.length === 0 || !apiBase) return;
    setIsExportingZip(true);
    try {
      const payload = {
        filenamePrefix: fileName,
        variants: variants.map((v) => ({
          language: v.targetLanguage,
          imageBase64: v.translatedImageBase64,
        })),
      };
      const res = await fetch(`${apiBase}/api/export-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}_all_languages.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onClose();
      }
    } catch (e) {
      console.error('Export ZIP error', e);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Localized Images</h3>
              <p className="text-xs text-slate-400">High-resolution artwork download</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              File Name Prefix
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Image Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('png')}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  format === 'png'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>PNG (Lossless)</span>
              </button>
              <button
                onClick={() => setFormat('jpeg')}
                className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  format === 'jpeg'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>JPEG (Compressed)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleDownloadSingle}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Active Version ({format.toUpperCase()})</span>
          </button>

          {variants.length > 1 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isExportingZip}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <FileArchive className="w-4 h-4 text-cyan-400" />
              <span>{isExportingZip ? 'Generating ZIP...' : `Download All ${variants.length} Languages (.ZIP)`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
