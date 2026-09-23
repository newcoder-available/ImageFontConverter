'use client';

import React from 'react';
import { 
  Download, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  FileArchive, 
  Eye, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { LocalizedVariant } from '@/types';

interface MultiLanguageResultsGalleryProps {
  variants: LocalizedVariant[];
  activeVariantIndex: number;
  onSelectVariant: (index: number) => void;
  onDownloadSingle: (variant: LocalizedVariant, format: 'png' | 'jpg') => void;
  onDownloadAllZip: () => void;
  isDownloadingZip?: boolean;
}

export const MultiLanguageResultsGallery: React.FC<MultiLanguageResultsGalleryProps> = ({
  variants,
  activeVariantIndex,
  onSelectVariant,
  onDownloadSingle,
  onDownloadAllZip,
  isDownloadingZip = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Localized Versions Gallery ({variants.length} Languages)
            </h3>
            <p className="text-xs text-slate-400">
              Select any version to inspect in the interactive Before/After comparison slider
            </p>
          </div>
        </div>

        {/* Global Download All ZIP */}
        <button
          onClick={onDownloadAllZip}
          disabled={isDownloadingZip || variants.length === 0}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <FileArchive className="w-4 h-4" />
          <span>{isDownloadingZip ? 'Archiving ZIP...' : 'Download All as ZIP'}</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {variants.map((variant, idx) => {
          const isActive = idx === activeVariantIndex;
          const qa = variant.qaResult;
          const qaPassed = qa?.overallPassed ?? true;
          const qaScore = qa?.overallScore ?? 98;

          return (
            <div
              key={variant.targetLanguage}
              onClick={() => onSelectVariant(idx)}
              className={`group relative rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-2 ring-cyan-500/50'
                  : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Image Preview */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={variant.translatedImageBase64}
                  alt={variant.languageName}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* Active Indicator Badge */}
                {isActive && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-extrabold flex items-center space-x-1 shadow-md">
                    <Eye className="w-3 h-3" />
                    <span>Active View</span>
                  </div>
                )}

                {/* QA Score Badge */}
                <div
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 backdrop-blur-md border ${
                    qaPassed
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>QA {qaScore}%</span>
                </div>
              </div>

              {/* Language Details & Download Footer */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-1">
                      <span>{variant.languageName}</span>
                      {variant.isRtl && (
                        <span className="text-[9px] px-1 bg-purple-900/60 text-purple-300 rounded font-mono">
                          RTL
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-cyan-400/80">{variant.nativeName}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {variant.script}
                  </span>
                </div>

                {/* Download Actions */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSingle(variant, 'png');
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold border border-slate-700 flex items-center justify-center space-x-1 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    <span>PNG</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSingle(variant, 'jpg');
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700/60 flex items-center justify-center space-x-1 transition-all"
                  >
                    <span>JPG</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
