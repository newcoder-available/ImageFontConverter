'use client';

import React, { useState, useMemo } from 'react';
import { Globe, Search, Check, X, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { SupportedLanguage } from '@/types';

interface LanguageSelectorProps {
  languages: SupportedLanguage[];
  selectedLanguages: string[];
  onChangeSelected: (codes: string[]) => void;
  disabled?: boolean;
}

const PRESET_GROUPS = [
  {
    name: 'Top Global',
    codes: ['ja', 'zh-CN', 'es', 'de', 'fr'],
  },
  {
    name: 'Asian (CJK)',
    codes: ['ja', 'zh-CN', 'zh-TW', 'ko', 'th', 'vi'],
  },
  {
    name: 'Indic Languages',
    codes: ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'],
  },
  {
    name: 'European',
    codes: ['de', 'fr', 'es', 'it', 'pt', 'nl', 'ru'],
  },
  {
    name: 'RTL Scripts',
    codes: ['ar', 'he'],
  },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguages,
  onChangeSelected,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const q = searchQuery.toLowerCase();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.script && l.script.toLowerCase().includes(q))
    );
  }, [languages, searchQuery]);

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      // Don't allow removing the last one
      if (selectedLanguages.length > 1) {
        onChangeSelected(selectedLanguages.filter((c) => c !== code));
      }
    } else {
      onChangeSelected([...selectedLanguages, code]);
    }
  };

  const applyPreset = (presetCodes: string[]) => {
    // Merge or set preset
    const validCodes = presetCodes.filter((c) => languages.some((l) => l.code === c));
    if (validCodes.length > 0) {
      onChangeSelected(validCodes);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Header & Preset Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Target Languages ({selectedLanguages.length} selected)
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Quick Presets:</span>
          {PRESET_GROUPS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.codes)}
              disabled={disabled}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Language Pills Bar */}
      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center gap-2 min-h-[44px]">
        {selectedLanguages.map((code) => {
          const lang = languages.find((l) => l.code === code);
          const name = lang?.name || code.toUpperCase();
          const native = lang?.nativeName;
          const isRtl = lang?.isRtl;

          return (
            <div
              key={code}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-950 to-indigo-950 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shadow-sm"
            >
              <span>{name}</span>
              {native && <span className="text-cyan-400/80 text-[10px]">({native})</span>}
              {isRtl && (
                <span className="px-1 py-0.2 bg-purple-900/60 text-purple-300 text-[9px] rounded font-mono">
                  RTL
                </span>
              )}
              {selectedLanguages.length > 1 && !disabled && (
                <button
                  type="button"
                  onClick={() => toggleLanguage(code)}
                  className="p-0.5 hover:bg-cyan-900/50 rounded-full transition-all text-cyan-300 hover:text-white ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all ml-auto flex items-center space-x-1"
        >
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>{isOpen ? 'Close Catalog' : '+ Add More Languages'}</span>
        </button>
      </div>

      {/* Expandable Multilingual Catalog Modal/Dropdown */}
      {isOpen && (
        <div className="glass-panel p-4 rounded-xl border border-slate-700/80 shadow-2xl space-y-3 bg-slate-900/95 animate-in fade-in zoom-in-95 duration-150">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by language, native name, script (e.g. Japanese, Kanji, Devanagari, Arabic)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Languages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLanguage(lang.code)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">{lang.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                    <span className="truncate">{lang.nativeName}</span>
                    {lang.isRtl && (
                      <span className="text-[9px] text-purple-400 font-mono ml-1">RTL</span>
                    )}
                  </div>
                  {lang.script && (
                    <span className="text-[9px] text-slate-500 truncate mt-1">
                      {lang.script}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
