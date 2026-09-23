'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Layers, 
  Plus, 
  Upload, 
  Globe, 
  Trash2, 
  Play, 
  FileArchive, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Clock,
  Download
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SupportedLanguage, ProjectHistoryItem } from '@/types';

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

export default function ProjectsPage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [batchFiles, setBatchFiles] = useState<{ id: string; name: string; base64: string; size: string }[]>([]);
  const [selectedTargetLangs, setSelectedTargetLangs] = useState<string[]>(['ja', 'hi', 'de', 'es', 'fr']);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<ProjectHistoryItem[]>([]);

  useEffect(() => {
    const fetchLangs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/languages`);
        if (res.ok) {
          const data = await res.json();
          setLanguages(data);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    fetchLangs();

    try {
      const saved = localStorage.getItem('localizeai_history');
      if (saved) {
        setHistoryItems(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        setBatchFiles((prev) => [
          ...prev,
          {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            base64: b64,
            size: `${(file.size / 1024).toFixed(1)} KB`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBatchFile = (id: string) => {
    setBatchFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRunBatch = async () => {
    if (batchFiles.length === 0) return;
    setIsBatchProcessing(true);

    try {
      // Store batch in sessionStorage and redirect to processing
      if (batchFiles.length === 1) {
        sessionStorage.setItem('current_image_base64', batchFiles[0].base64);
        sessionStorage.setItem('current_target_langs', JSON.stringify(selectedTargetLangs));
        router.push('/processing');
      } else {
        // Multi-image batch
        const payload = {
          images: batchFiles.map((f) => ({ filename: f.name, base64: f.base64 })),
          sourceLanguage: 'auto',
          targetLanguages: selectedTargetLangs,
        };
        const res = await fetch(`${API_BASE}/api/batch-process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          // Store batch result in history or session and open results
          sessionStorage.setItem('batch_results', JSON.stringify(data));
          router.push('/results');
        }
      }
    } catch (e) {
      console.error('Batch error', e);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar apiBase={API_BASE} languages={languages} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-cyan-400" />
              Localization Projects & Batch Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload single or multiple images to localize into several target languages simultaneously.
            </p>
          </div>

          <Link
            href="/editor"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Editor Session</span>
          </Link>
        </div>

        {/* Batch Queue Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Dropzone */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Upload Images for Localization ({batchFiles.length})
              </h2>
              {batchFiles.length > 0 && (
                <button
                  onClick={() => setBatchFiles([])}
                  className="text-xs text-red-400 hover:underline"
                >
                  Clear Queue
                </button>
              )}
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 group">
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-3 rounded-xl bg-slate-900 group-hover:scale-110 transition-transform mb-2">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-slate-200">
                Click or Drag multiple images to batch localize
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                PNG, JPG, WEBP up to 25MB each
              </span>
            </label>

            {/* Uploaded items grid */}
            {batchFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {batchFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex flex-col"
                  >
                    <img
                      src={file.base64}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <span className="text-[11px] font-medium text-slate-300 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-500">{file.size}</span>
                    <button
                      onClick={() => removeBatchFile(file.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-950/80 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target Languages & Batch Action Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Target Languages ({selectedTargetLangs.length})
              </h2>

              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                {[
                  { code: 'ja', name: 'Japanese (日本語)' },
                  { code: 'hi', name: 'Hindi (हिन्दी)' },
                  { code: 'de', name: 'German (Deutsch)' },
                  { code: 'fr', name: 'French (Français)' },
                  { code: 'es', name: 'Spanish (Español)' },
                  { code: 'ar', name: 'Arabic (العربية RTL)' },
                  { code: 'zh-CN', name: 'Chinese (简体)' },
                  { code: 'ko', name: 'Korean (한국어)' },
                  { code: 'ru', name: 'Russian (Русский)' },
                  { code: 'it', name: 'Italian (Italiano)' },
                  { code: 'pt', name: 'Portuguese (Português)' },
                  { code: 'th', name: 'Thai (ไทย)' },
                ].map((l) => {
                  const isSel = selectedTargetLangs.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        if (isSel) {
                          if (selectedTargetLangs.length > 1) {
                            setSelectedTargetLangs(selectedTargetLangs.filter((c) => c !== l.code));
                          }
                        } else {
                          setSelectedTargetLangs([...selectedTargetLangs, l.code]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSel
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total Images:</span>
                  <span className="font-mono text-white">{batchFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Languages:</span>
                  <span className="font-mono text-white">{selectedTargetLangs.length}</span>
                </div>
                <div className="flex justify-between font-bold text-cyan-300 pt-1 border-t border-slate-800">
                  <span>Total Output Variants:</span>
                  <span className="font-mono">{batchFiles.length * selectedTargetLangs.length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunBatch}
              disabled={batchFiles.length === 0 || isBatchProcessing}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
                batchFiles.length === 0 || isBatchProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
              }`}
            >
              {isBatchProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Multilingual Localization</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Previous Saved Projects */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Localized Projects ({historyItems.length})
            </h2>
            <Link href="/history" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <span>View all in History</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {historyItems.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center text-xs text-slate-500">
              No saved projects yet. Start by uploading an image above!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {historyItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <img
                    src={item.thumbnailBase64 || item.originalImageBase64}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                    <p className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.targetLanguages.map((tl) => (
                        <span
                          key={tl}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] uppercase font-mono"
                        >
                          {tl}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('current_image_base64', item.originalImageBase64);
                      sessionStorage.setItem('current_target_langs', JSON.stringify(item.targetLanguages));
                      router.push('/results');
                    }}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Results</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
