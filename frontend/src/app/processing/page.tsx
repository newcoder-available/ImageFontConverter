'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Globe, 
  Eye, 
  FileText, 
  Sliders, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MultiProcessResponse } from '@/types';

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

interface PipelineStage {
  id: string;
  name: string;
  desc: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export default function ProcessingPage() {
  const router = useRouter();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [targetLangs, setTargetLangs] = useState<string[]>(['ja', 'hi', 'de', 'es', 'fr']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'upload', name: 'Image Upload & Validation', desc: 'Decoding image buffer & canvas dimensions', status: 'completed' },
    { id: 'vision', name: 'Vision Analysis & OCR', desc: 'Locating text bounding boxes & polygon contours', status: 'in_progress' },
    { id: 'lang_detect', name: 'Language & Script Detection', desc: 'Auto-identifying source language & direction', status: 'pending' },
    { id: 'classification', name: 'Text Classification', desc: 'Protecting brands, numbers & logos; tagging UI text', status: 'pending' },
    { id: 'context', name: 'Context Understanding', desc: 'Analyzing gaming/UI context & glossary overrides', status: 'pending' },
    { id: 'translation', name: 'Contextual Translation', desc: 'Translating strings into target script vocabularies', status: 'pending' },
    { id: 'typography', name: 'Typography & Style Extraction', desc: 'Extracting 3D shadow, stroke, colors & alignment', status: 'pending' },
    { id: 'inpainting', name: 'Mask Inpainting', desc: 'Reconstructing background texture under text masks', status: 'pending' },
    { id: 'reconstruction', name: 'Text Fitting & Reconstruction', desc: 'Rendering native typography with exact effects', status: 'pending' },
    { id: 'qa', name: 'AI Quality Assurance', desc: 'Validating character correctness & artwork preservation', status: 'pending' },
    { id: 'finalizing', name: 'Finalizing Multi-Language Outputs', desc: 'Generating high-res variants & summary report', status: 'pending' },
  ]);

  const [langProgress, setLangProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    // Read session storage
    const storedImg = sessionStorage.getItem('current_image_base64');
    const storedLangs = sessionStorage.getItem('current_target_langs');

    if (!storedImg) {
      // If nothing in session, load default demo
      fetch(`${API_BASE}/api/samples`)
        .then((r) => r.json())
        .then((samples) => {
          if (samples['gaming_ui.png']) {
            setImageBase64(samples['gaming_ui.png'].base64);
            startProcessing(samples['gaming_ui.png'].base64, ['ja', 'hi', 'de', 'es', 'fr']);
          } else {
            router.push('/');
          }
        })
        .catch(() => router.push('/'));
      return;
    }

    const parsedLangs = storedLangs ? JSON.parse(storedLangs) : ['ja', 'hi', 'de', 'es', 'fr'];
    setImageBase64(storedImg);
    setTargetLangs(parsedLangs);
    startProcessing(storedImg, parsedLangs);
  }, []);

  const updateStage = (stageId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed') => {
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, status } : s))
    );
  };

  const startProcessing = async (b64: string, langs: string[]) => {
    // Initialize per-language progress
    const initProg: Record<string, number> = {};
    langs.forEach((l) => (initProg[l] = 10));
    setLangProgress(initProg);

    // Progressive stage animations aligned with real backend calls
    setTimeout(() => {
      updateStage('vision', 'completed');
      updateStage('lang_detect', 'in_progress');
      setLangProgress((prev) => {
        const next = { ...prev };
        langs.forEach((l) => (next[l] = Math.min(100, (next[l] || 0) + 15)));
        return next;
      });
    }, 400);

    setTimeout(() => {
      updateStage('lang_detect', 'completed');
      updateStage('classification', 'completed');
      updateStage('context', 'in_progress');
      setLangProgress((prev) => {
        const next = { ...prev };
        langs.forEach((l) => (next[l] = Math.min(100, (next[l] || 0) + 20)));
        return next;
      });
    }, 800);

    setTimeout(() => {
      updateStage('context', 'completed');
      updateStage('translation', 'in_progress');
      updateStage('typography', 'in_progress');
      setLangProgress((prev) => {
        const next = { ...prev };
        langs.forEach((l, idx) => (next[l] = Math.min(100, (next[l] || 0) + 20 + idx * 5)));
        return next;
      });
    }, 1200);

    setTimeout(() => {
      updateStage('translation', 'completed');
      updateStage('typography', 'completed');
      updateStage('inpainting', 'in_progress');
      updateStage('reconstruction', 'in_progress');
    }, 1600);

    try {
      const formData = new FormData();
      formData.append('imageBase64', b64);
      formData.append('sourceLanguage', 'auto');
      formData.append('targetLanguages', JSON.stringify(langs));

      const res = await fetch(`${API_BASE}/api/process-multi`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.statusText}`);
      }

      const result: MultiProcessResponse = await res.json();

      updateStage('inpainting', 'completed');
      updateStage('reconstruction', 'completed');
      updateStage('qa', 'completed');
      updateStage('finalizing', 'completed');

      // 100% all languages
      const finalProg: Record<string, number> = {};
      langs.forEach((l) => (finalProg[l] = 100));
      setLangProgress(finalProg);

      // Store results in session and local storage
      sessionStorage.setItem('localization_results', JSON.stringify(result));
      
      // Save to project history
      try {
        const historyItem = {
          id: `proj_${Date.now()}`,
          timestamp: Date.now(),
          title: `Project ${result.sourceLanguage} → ${result.targetLanguages.join(', ')}`,
          sourceLanguage: result.sourceLanguage,
          targetLanguages: result.targetLanguages,
          thumbnailBase64: result.variants[0]?.translatedImageBase64 || result.originalImageBase64,
          imageWidth: result.imageWidth,
          imageHeight: result.imageHeight,
          originalImageBase64: result.originalImageBase64,
          inpaintedImageBase64: result.inpaintedImageBase64,
          variants: result.variants,
        };
        const existingHistory = JSON.parse(localStorage.getItem('localizeai_history') || '[]');
        const updatedHistory = [historyItem, ...existingHistory].slice(0, 15);
        localStorage.setItem('localizeai_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn('History save error', e);
      }

      setTimeout(() => {
        router.push('/results');
      }, 700);
    } catch (err: any) {
      console.error('Processing error:', err);
      setErrorMsg(err.message || 'An error occurred during localization pipeline execution.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar apiBase={API_BASE} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col items-center justify-center">
        {/* Top Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Orchestrator Active</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Localizing In-Image Text...
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Analyzing typography, isolating text regions, generating translations & verifying quality.
          </p>
        </div>

        {errorMsg ? (
          <div className="w-full p-6 rounded-2xl bg-red-950/40 border border-red-800 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h2 className="text-sm font-bold text-red-200">Pipeline Error</h2>
            <p className="text-xs text-red-400">{errorMsg}</p>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Return to Editor
            </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Pipeline Stage Checklist (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/90 shadow-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Orchestration Pipeline</span>
                <span className="text-cyan-400 font-mono text-[11px]">Modular Agents</span>
              </h3>

              <div className="space-y-2">
                {stages.map((stage) => {
                  return (
                    <div
                      key={stage.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        stage.status === 'completed'
                          ? 'bg-slate-950/70 border-emerald-500/30 text-emerald-300'
                          : stage.status === 'in_progress'
                          ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : stage.status === 'in_progress' ? (
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold">{stage.name}</div>
                          <div className="text-[10px] text-slate-400">{stage.desc}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold uppercase">
                        {stage.status === 'completed'
                          ? 'Done'
                          : stage.status === 'in_progress'
                          ? 'Active'
                          : 'Queued'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Language Progress Bars (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/90 shadow-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Language Progress</span>
                  <span className="text-indigo-400 font-mono text-[11px]">{targetLangs.length} targets</span>
                </h3>

                <div className="space-y-3.5">
                  {targetLangs.map((code) => {
                    const prog = langProgress[code] || 15;
                    const langNames: Record<string, string> = {
                      ja: 'Japanese (日本語)',
                      hi: 'Hindi (हिन्दी)',
                      de: 'German (Deutsch)',
                      fr: 'French (Français)',
                      es: 'Spanish (Español)',
                      ar: 'Arabic (العربية RTL)',
                      'zh-CN': 'Chinese (简体)',
                      ko: 'Korean (한국어)',
                      ru: 'Russian (Русский)',
                      it: 'Italian (Italiano)',
                    };
                    return (
                      <div key={code} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-200">{langNames[code] || code.toUpperCase()}</span>
                          <span className="text-cyan-400 font-mono">{prog}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Source Preview Card */}
              {imageBase64 && (
                <div className="p-4 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Source Image Under Analysis
                  </span>
                  <img
                    src={imageBase64}
                    alt="Source preview"
                    className="w-full h-40 object-cover rounded-xl border border-slate-800"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
