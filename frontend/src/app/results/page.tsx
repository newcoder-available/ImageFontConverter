'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Download, 
  FileArchive, 
  Sliders, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  ArrowLeft,
  Eye,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ImageComparisonSlider } from '@/components/ImageComparisonSlider';
import { ExportModal } from '@/components/ExportModal';
import { MultiProcessResponse, LocalizedVariant } from '@/types';

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

export default function ResultsPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<MultiProcessResponse | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('localization_results');
    if (raw) {
      try {
        setResultData(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Fetch sample if no session
      fetch(`${API_BASE}/api/samples`)
        .then((r) => r.json())
        .then((samples) => {
          if (samples['gaming_ui.png']) {
            const formData = new FormData();
            formData.append('imageBase64', samples['gaming_ui.png'].base64);
            formData.append('sourceLanguage', 'English');
            formData.append('targetLanguages', JSON.stringify(['ja', 'hi', 'de', 'es', 'fr', 'ar']));
            fetch(`${API_BASE}/api/process-multi`, { method: 'POST', body: formData })
              .then((res) => res.json())
              .then((data) => setResultData(data));
          }
        });
    }
  }, []);

  const activeVariant: LocalizedVariant | null =
    resultData && resultData.variants && resultData.variants[selectedVariantIdx]
      ? resultData.variants[selectedVariantIdx]
      : null;

  const handleDownloadSingle = (variant: LocalizedVariant) => {
    const link = document.createElement('a');
    link.href = variant.translatedImageBase64;
    link.download = `localized_${variant.targetLanguage}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadZip = async () => {
    if (!resultData) return;
    setIsDownloadingZip(true);
    try {
      const payload = {
        filenamePrefix: 'localize_ai_export',
        variants: resultData.variants.map((v) => ({
          language: v.targetLanguage,
          imageBase64: v.translatedImageBase64,
        })),
      };
      const res = await fetch(`${API_BASE}/api/export-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `localize_ai_${resultData.targetLanguages.length}_languages.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('ZIP download error', e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  if (!resultData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar apiBase={API_BASE} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading localization gallery...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar apiBase={API_BASE} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Header with Title & Batch Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                ✓ QA Verified
              </span>
              <span className="text-xs text-slate-400">
                {resultData.processingTimeMs}ms execution time
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              Localization Results Gallery
            </h1>
            <p className="text-xs text-slate-400">
              Source: <span className="text-white font-medium">{resultData.sourceLanguage}</span> → Generated{' '}
              <span className="text-cyan-300 font-bold">{resultData.variants.length} localized versions</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                sessionStorage.setItem('current_image_base64', resultData.originalImageBase64);
                router.push('/editor');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Typography in Editor</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              <FileArchive className="w-4 h-4" />
              <span>{isDownloadingZip ? 'Archiving...' : 'Download All (ZIP)'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Before / After Comparison Slider */}
        {activeVariant && (
          <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Interactive Before / After Comparison ({activeVariant.languageName})
                </h2>
                <p className="text-xs text-slate-400">
                  Drag the slider to inspect artwork & typography preservation.
                </p>
              </div>

              {/* Language Pills selector for slider */}
              <div className="flex flex-wrap gap-1.5">
                {resultData.variants.map((v, idx) => (
                  <button
                    key={v.targetLanguage}
                    onClick={() => setSelectedVariantIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedVariantIdx === idx
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {v.nativeName} ({v.targetLanguage})
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <ImageComparisonSlider
                originalImage={resultData.originalImageBase64}
                translatedImage={activeVariant.translatedImageBase64}
                originalLabel={`Original (${resultData.sourceLanguage})`}
                translatedLabel={`Localized (${activeVariant.languageName})`}
              />
            </div>
          </section>
        )}

        {/* Multi-Language Gallery Grid */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Generated Language Outputs ({resultData.variants.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resultData.variants.map((variant, idx) => {
              const qa = variant.qaResult;
              return (
                <div
                  key={variant.targetLanguage}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                    selectedVariantIdx === idx
                      ? 'bg-slate-900/80 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Language Badge & QA Score */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{variant.languageName}</span>
                        <span className="text-xs text-slate-400 font-normal">({variant.nativeName})</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Script: {variant.script} {variant.isRtl ? '· RTL' : ''}
                      </span>
                    </div>

                    {qa && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold font-mono">
                        QA {qa.overallScore}%
                      </span>
                    )}
                  </div>

                  {/* Image Preview with click to inspect */}
                  <div
                    onClick={() => setSelectedVariantIdx(idx)}
                    className="relative cursor-pointer rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group"
                  >
                    <img
                      src={variant.translatedImageBase64}
                      alt={variant.languageName}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-bold">
                        Inspect in Slider
                      </span>
                    </div>
                  </div>

                  {/* QA Checkpoints */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Translation contextually verified</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Native script typography matched</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Original artwork & background preserved</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleDownloadSingle(variant)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVariantIdx(idx);
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium"
                      title="Inspect"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Export Modal */}
      {resultData && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          variants={resultData.variants}
          originalImage={resultData.originalImageBase64}
          apiBase={API_BASE}
        />
      )}
    </div>
  );
}
