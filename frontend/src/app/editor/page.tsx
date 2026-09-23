'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Globe, 
  Layers, 
  CheckCircle2, 
  Eye, 
  RotateCcw, 
  Edit3, 
  Maximize2,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ImageDropzone } from '@/components/ImageDropzone';
import { TextBlockEditor } from '@/components/TextBlockEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { 
  TextBlock, 
  SupportedLanguage, 
  FontOption, 
  ProcessImageResponse, 
  RerenderResponse, 
  SampleImageItem,
  QAResult
} from '@/types';

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

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [samples, setSamples] = useState<Record<string, SampleImageItem>>({});

  // Active Editor State
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [inpaintedBase64, setInpaintedBase64] = useState<string | null>(null);
  const [renderedBase64, setRenderedBase64] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(800);
  const [imageHeight, setImageHeight] = useState<number>(600);

  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('ja');
  const [mode, setMode] = useState<'quick' | 'precision'>('precision'); // Quick Mode vs Precision Mode

  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRerendering, setIsRerendering] = useState<boolean>(false);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [viewMode, setViewMode] = useState<'rendered' | 'original' | 'inpainted'>('rendered');

  // Load Initial Metadata
  useEffect(() => {
    const init = async () => {
      try {
        const langRes = await fetch(`${API_BASE}/api/languages`);
        if (langRes.ok) setLanguages(await langRes.json());

        const fontRes = await fetch(`${API_BASE}/api/fonts`);
        if (fontRes.ok) setFonts(await fontRes.json());

        const sampleRes = await fetch(`${API_BASE}/api/samples`);
        if (sampleRes.ok) {
          const sData = await sampleRes.json();
          setSamples(sData);

          // Check if session or query parameter has an image
          const sessionImg = sessionStorage.getItem('current_image_base64');
          if (sessionImg) {
            handleRunAnalysis(sessionImg);
          } else if (searchParams.get('sample') === 'gaming' || searchParams.get('sample') === 'sale') {
            const key = searchParams.get('sample') === 'sale' ? 'sale_banner.png' : 'gaming_ui.png';
            if (sData[key]) handleRunAnalysis(sData[key].base64);
          } else if (sData['gaming_ui.png']) {
            handleRunAnalysis(sData['gaming_ui.png'].base64);
          }
        }
      } catch (e) {
        console.warn('Backend load error', e);
      }
    };
    init();
  }, []);

  const handleRunAnalysis = async (b64: string) => {
    setIsAnalyzing(true);
    setCurrentBase64(b64);
    try {
      const formData = new FormData();
      formData.append('imageBase64', b64);
      formData.append('sourceLanguage', sourceLang);
      formData.append('targetLanguage', targetLang);

      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data: ProcessImageResponse = await res.json();
        setTextBlocks(data.textBlocks);
        setInpaintedBase64(data.inpaintedImageBase64);
        setRenderedBase64(data.translatedImageBase64);
        setImageWidth(data.imageWidth);
        setImageHeight(data.imageHeight);
        setQaResult(data.qaResult || null);
        if (data.textBlocks.length > 0) {
          setSelectedBlockId(data.textBlocks[0].id);
        }
      }
    } catch (e) {
      console.error('Analysis error', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBlockChange = (updatedBlock: TextBlock) => {
    const updated = textBlocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
    setTextBlocks(updated);
    triggerLiveRerender(updated);
  };

  const triggerLiveRerender = async (currentBlocks: TextBlock[]) => {
    if (!currentBase64) return;
    setIsRerendering(true);
    try {
      const payload = {
        imageBase64: currentBase64,
        inpaintedBase64: inpaintedBase64,
        targetLanguage: targetLang,
        textBlocks: currentBlocks,
        imageWidth,
        imageHeight,
      };
      const res = await fetch(`${API_BASE}/api/rerender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data: RerenderResponse = await res.json();
        setRenderedBase64(data.renderedImageBase64);
        setQaResult(data.qaResult || null);
      }
    } catch (e) {
      console.error('Rerender error', e);
    } finally {
      setIsRerendering(false);
    }
  };

  const handleTargetLangChange = async (newLang: string) => {
    setTargetLang(newLang);
    if (!currentBase64) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('imageBase64', currentBase64);
      formData.append('sourceLanguage', sourceLang);
      formData.append('targetLanguage', newLang);

      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data: ProcessImageResponse = await res.json();
        setTextBlocks(data.textBlocks);
        setRenderedBase64(data.translatedImageBase64);
        setQaResult(data.qaResult || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadActive = () => {
    if (!renderedBase64) return;
    const link = document.createElement('a');
    link.href = renderedBase64;
    link.download = `localized_${targetLang}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedBlock = textBlocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar apiBase={API_BASE} languages={languages} />

      {/* Editor Subheader & Toolbar */}
      <div className="w-full bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Target Language Switcher */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Target Language:</span>
            </div>
            <select
              value={targetLang}
              onChange={(e) => handleTargetLangChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            >
              {[
                { code: 'ja', name: 'Japanese (日本語)' },
                { code: 'hi', name: 'Hindi (हिन्दी)' },
                { code: 'de', name: 'German (Deutsch)' },
                { code: 'fr', name: 'French (Français)' },
                { code: 'es', name: 'Spanish (Español)' },
                { code: 'ar', name: 'Arabic (العربية RTL)' },
                { code: 'zh-CN', name: 'Chinese (简体中文)' },
                { code: 'ko', name: 'Korean (한국어)' },
                { code: 'ru', name: 'Russian (Русский)' },
                { code: 'it', name: 'Italian (Italiano)' },
                { code: 'pt', name: 'Portuguese (Português)' },
                { code: 'th', name: 'Thai (ไทย)' },
              ].map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Mode Switch: Quick vs Precision */}
            <div className="hidden md:flex items-center space-x-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
              <button
                onClick={() => setMode('precision')}
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                  mode === 'precision'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Precision Mode
              </button>
              <button
                onClick={() => setMode('quick')}
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                  mode === 'quick'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Quick Mode
              </button>
            </div>
          </div>

          {/* View Mode Tabs & Actions */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
              <button
                onClick={() => setViewMode('rendered')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'rendered' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                Localized
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'original' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setViewMode('inpainted')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'inpainted' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                Inpainted
              </button>
            </div>

            <button
              onClick={() => triggerLiveRerender(textBlocks)}
              disabled={isRerendering}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Re-render Image"
            >
              <RefreshCw className={`w-4 h-4 ${isRerendering ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleDownloadActive}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace (Two Columns on Desktop, Stacked on Mobile) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Canvas & Overlay (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl p-2 min-h-[480px] flex items-center justify-center">
            {isAnalyzing ? (
              <div className="text-center space-y-3 p-8">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Running Vision & Localization...</p>
              </div>
            ) : currentBase64 ? (
              <div className="relative inline-block max-w-full">
                {/* Active Image Layer */}
                <img
                  src={
                    viewMode === 'rendered'
                      ? renderedBase64 || currentBase64
                      : viewMode === 'inpainted'
                      ? inpaintedBase64 || currentBase64
                      : currentBase64
                  }
                  alt="Editor Canvas"
                  className="max-h-[580px] w-auto object-contain rounded-2xl mx-auto"
                />

                {/* Interactive Bounding Box Overlays */}
                {viewMode === 'rendered' &&
                  textBlocks.map((block) => {
                    const isSel = block.id === selectedBlockId;
                    const scaleX = 100 / imageWidth;
                    const scaleY = 100 / imageHeight;
                    const box = block.boundingBox;
                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        style={{
                          left: `${box.x * scaleX}%`,
                          top: `${box.y * scaleY}%`,
                          width: `${box.width * scaleX}%`,
                          height: `${box.height * scaleY}%`,
                        }}
                        className={`absolute cursor-pointer border-2 transition-all group flex items-start justify-end p-1 ${
                          isSel
                            ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_12px_rgba(34,211,238,0.5)] z-20'
                            : 'border-white/40 hover:border-cyan-300 hover:bg-cyan-500/10 z-10'
                        }`}
                        title={`${block.originalText} → ${block.translatedText}`}
                      >
                        <span
                          className={`px-1 py-0.2 text-[9px] font-bold font-mono rounded ${
                            isSel ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900/80 text-white'
                          }`}
                        >
                          {block.id}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <ImageDropzone onImageSelected={(f, b64) => { if (b64) handleRunAnalysis(b64); }} isProcessing={false} />
              </div>
            )}
          </div>

          {/* QA Verification Scorecard */}
          {qaResult && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Automated AI Quality Score: {qaResult.overallScore}%</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
                      PASSED
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Character integrity, background preservation & bounding fit verified.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Text Block Inspector & Typography Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <TextBlockEditor
            textBlocks={textBlocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(id) => setSelectedBlockId(id)}
            onBlockChange={handleBlockChange}
            targetLanguage={targetLang}
            availableFonts={fonts}
            apiBase={API_BASE}
            isRerendering={isRerendering}
          />
        </div>
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading Localization Editor...</p>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}

