'use client';

import React from 'react';
import { Sparkles, Layers, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  backendHealthy: boolean;
  isProcessing: boolean;
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ backendHealthy, isProcessing, onReset }) => {
  return (
    <header className="w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Image Font Converter
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                AI Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent in-image text translation & font preservation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <div className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">
              {backendHealthy ? 'CV Engine Active' : 'Connecting Engine...'}
            </span>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>New Image</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
