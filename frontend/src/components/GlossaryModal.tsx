'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save, X, Globe, Sparkles, Check } from 'lucide-react';
import { GlossaryTerm, SupportedLanguage } from '@/types';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  languages: SupportedLanguage[];
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  isOpen,
  onClose,
  apiBase,
  languages,
}) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sourceText, setSourceText] = useState<string>('');
  const [category, setCategory] = useState<string>('Brand/UI');
  const [notes, setNotes] = useState<string>('');
  const [translations, setTranslations] = useState<Record<string, string>>({
    ja: '',
    hi: '',
    de: '',
    fr: '',
    es: '',
    'zh-CN': '',
    ar: '',
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen]);

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/glossary`);
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (e) {
      console.warn('Could not load glossary from server', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) return;

    const newTerm: GlossaryTerm = {
      id: `term_${Date.now()}`,
      sourceText: sourceText.trim().toUpperCase(),
      translations: Object.fromEntries(
        Object.entries(translations).filter(([_, v]) => v.trim().length > 0)
      ),
      category,
      notes,
    };

    try {
      const res = await fetch(`${apiBase}/api/glossary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTerm),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
        setSourceText('');
        setNotes('');
        fetchTerms();
      }
    } catch (e) {
      console.error('Error saving glossary term', e);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/glossary/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTerms((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error('Error deleting term', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Multilingual Glossary & Brand Rules
              </h2>
              <p className="text-xs text-slate-400">
                Custom terms will automatically override generic AI translations across all localization runs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Term Form */}
          <form onSubmit={handleSaveTerm} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Term Override
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Source Text (e.g. BOOSTER)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOOSTER"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Brand/UI">Brand / UI Action</option>
                  <option value="Gaming Powerup">Gaming Powerup</option>
                  <option value="E-commerce Offer">E-commerce Offer</option>
                  <option value="Legal/Protected">Legal / Protected Mark</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional context"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Target Language Translations */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-2">
                Target Language Translations
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  { code: 'ja', label: 'Japanese (日本語)', placeholder: 'ブースター' },
                  { code: 'hi', label: 'Hindi (हिन्दी)', placeholder: 'बूस्टर' },
                  { code: 'de', label: 'German (Deutsch)', placeholder: 'BOOSTER' },
                  { code: 'fr', label: 'French (Français)', placeholder: 'BOOSTER' },
                  { code: 'es', label: 'Spanish (Español)', placeholder: 'PROPULSOR' },
                  { code: 'zh-CN', label: 'Chinese (简体)', placeholder: '助推器' },
                  { code: 'ar', label: 'Arabic (العربية)', placeholder: 'معزز' },
                ].map((item) => (
                  <div key={item.code} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="block text-[10px] font-medium text-slate-400 mb-1">
                      {item.label}
                    </span>
                    <input
                      type="text"
                      placeholder={item.placeholder}
                      value={translations[item.code] || ''}
                      onChange={(e) =>
                        setTranslations({ ...translations, [item.code]: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Glossary Term</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Existing Glossary List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Active Glossary Terms ({terms.length})
            </h3>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading glossary...</div>
            ) : terms.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No custom terms added yet. Add terms above to override AI translation.
              </div>
            ) : (
              <div className="space-y-2">
                {terms.map((term) => (
                  <div
                    key={term.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold font-mono text-cyan-300">
                          {term.sourceText}
                        </span>
                        {term.category && (
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                            {term.category}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                        {Object.entries(term.translations).map(([lang, val]) => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]"
                          >
                            <span className="text-slate-500 uppercase font-mono mr-1">{lang}:</span>
                            <span className="text-white font-medium">{val}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTerm(term.id)}
                      className="self-end sm:self-center p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete term"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
