'use client';

import React from 'react';
import { Gamepad2, ShoppingBag, Sparkles } from 'lucide-react';
import { SampleImageItem } from '@/types';

interface SampleImagesGalleryProps {
  samples: Record<string, SampleImageItem>;
  onSelectSample: (sample: SampleImageItem) => void;
  disabled?: boolean;
}

export const SampleImagesGallery: React.FC<SampleImagesGalleryProps> = ({
  samples,
  onSelectSample,
  disabled
}) => {
  const sampleList = Object.values(samples);
  if (sampleList.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Or try with instant demo presets
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sampleList.map((sample) => {
          const isGaming = sample.filename.includes('gaming');
          return (
            <div
              key={sample.filename}
              onClick={() => !disabled && onSelectSample(sample)}
              className={`flex items-center space-x-4 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 hover:border-indigo-500/50 transition-all cursor-pointer group ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-700/60 flex-shrink-0 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sample.base64}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  {isGaming ? (
                    <Gamepad2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                  <h4 className="text-sm font-semibold text-white truncate">
                    {sample.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {isGaming
                    ? 'START GAME · SELECT BET · WINNER'
                    : 'SUMMER MEGA SALE · 50% DISCOUNT · SHOP NOW'}
                </p>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                Try
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
