'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  History, 
  Trash2, 
  Download, 
  ArrowRight, 
  Eye, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Clock,
  CheckCircle2,
  FileArchive
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ProjectHistoryItem } from '@/types';

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '';
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE = getApiBase();

export default function HistoryPage() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<ProjectHistoryItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('localizeai_history');
      if (saved) {
        setHistoryItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleDeleteItem = (id: string) => {
    const updated = historyItems.filter((h) => h.id !== id);
    setHistoryItems(updated);
    localStorage.setItem('localizeai_history', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setHistoryItems([]);
    localStorage.removeItem('localizeai_history');
  };

  const handleOpenInEditor = (item: ProjectHistoryItem) => {
    sessionStorage.setItem('current_image_base64', item.originalImageBase64);
    sessionStorage.setItem('current_target_langs', JSON.stringify(item.targetLanguages));
    router.push('/editor');
  };

  const handleOpenResults = (item: ProjectHistoryItem) => {
    sessionStorage.setItem(
      'localization_results',
      JSON.stringify({
        success: true,
        sourceLanguage: item.sourceLanguage,
        targetLanguages: item.targetLanguages,
        imageWidth: item.imageWidth,
        imageHeight: item.imageHeight,
        originalImageBase64: item.originalImageBase64,
        inpaintedImageBase64: item.inpaintedImageBase64,
        variants: item.variants,
        processingTimeMs: 120,
      })
    );
    router.push('/results');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar apiBase={API_BASE} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <History className="w-6 h-6 text-indigo-400" />
              Previous Localization Projects ({historyItems.length})
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Access your past localized images, review QA results, and re-export variants.
            </p>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800 text-xs text-red-300 font-semibold transition-colors"
            >
              Clear All History
            </button>
          )}
        </div>

        {/* Projects Grid */}
        {historyItems.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">No Project History Found</h2>
            <p className="text-xs text-slate-400">
              When you localize images, they are automatically preserved here for future edits and downloads.
            </p>
            <Link
              href="/editor"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create First Localization</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={item.thumbnailBase64 || item.originalImageBase64}
                    alt={item.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/90 text-cyan-300 text-[10px] font-mono border border-slate-800">
                    {item.variants.length} Localized Versions
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.targetLanguages.map((tl) => (
                      <span
                        key={tl}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono uppercase"
                      >
                        {tl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenResults(item)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Gallery</span>
                  </button>

                  <button
                    onClick={() => handleOpenInEditor(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Open in Editor"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
