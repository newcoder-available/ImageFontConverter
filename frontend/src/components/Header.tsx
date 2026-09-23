'use client';

import React from 'react';
import { Sparkles, Globe, History, RefreshCw, ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  backendHealthy: boolean;
  isProcessing: boolean;
  onReset?: () => void;
  onToggleHistory?: () => void;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealthy,
  isProcessing,
  onReset,
  onToggleHistory,
  historyCount = 0,
}) => {
  return (
    <header className="w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-indigo-200">
                LocalizeAI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                Multilingual Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multilingual Image Localization · Artwork Preservation Engine
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center space-x-3">
          {/* History Drawer Trigger */}
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              title="View saved localization projects"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 rounded-full text-[10px] font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* Engine Health Status */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                backendHealthy
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {backendHealthy ? 'LocalizeAI Core Active' : 'Connecting Engine...'}
            </span>
          </div>

          {/* Reset / New Session */}
          {onReset && (
            <button
              onClick={onReset}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm"
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
