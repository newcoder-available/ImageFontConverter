'use client';

import React from 'react';
import { Gamepad2, ShoppingBag, Sparkles } from 'lucide-react';
import { SampleImageItem } from '@/types';

interface SampleImagesGalleryProps {
  samples: Record<string, SampleImageItem>;
  onSelectSample: (sampleKeyOrItem: any, base64?: string) => void;
  disabled?: boolean;
}

export const SampleImagesGallery: React.FC<SampleImagesGalleryProps> = ({
  samples,
  onSelectSample,
  disabled = false,
}) => {
  const sampleList = Object.values(samples);
  if (sampleList.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sampleList.map((sample) => {
          const isGaming = sample.filename.includes('gaming');
          return (
            <div
              key={sample.filename}
              onClick={() => {
                if (!disabled) {
                  onSelectSample(sample.filename, sample.base64);
                }
              }}
              className={`flex items-center space-x-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-700/60 flex-shrink-0 bg-slate-950">
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
                  <h4 className="text-xs font-semibold text-white truncate">
                    {sample.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {isGaming ? 'Gaming HUD · BOOSTER' : 'Promotional Banner'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
