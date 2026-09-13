'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Globe, 
  ArrowRight, 
  Sliders, 
  Download, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  Eye, 
  FileText,
  Zap,
  Info
} from 'lucide-react';
import { Header } from '@/components/Header';
import { ImageDropzone } from '@/components/ImageDropzone';
import { SampleImagesGallery } from '@/components/SampleImagesGallery';
import { ImageComparisonSlider } from '@/components/ImageComparisonSlider';
import { TextBlockEditor } from '@/components/TextBlockEditor';
import { ExportModal } from '@/components/ExportModal';
import { 
  TextBlock, 
  SupportedLanguage, 
  FontOption, 
  ProcessImageResponse, 
  SampleImageItem 
} from '@/types';

// Dynamic API Base URL supporting Vercel same-origin rewrites, env vars, and local dev
const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''; // Use relative /api/* when deployed on Vercel
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE = getApiBase();

export default function Home() {
  // Backend & Metadata State
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [samples, setSamples] = useState<Record<string, SampleImageItem>>({});

  // Translation Config State
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('fr');

  // Active Image & Processing State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result State
  const [resultData, setResultData] = useState<ProcessImageResponse | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isRerendering, setIsRerendering] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Initial Fetch: Health, Languages, Fonts, Samples
  useEffect(() => {
    const checkHealthAndLoadData = async () => {
      try {
        const healthRes = await fetch(`${API_BASE}/api/health`);
        if (healthRes.ok) {
          setBackendHealthy(true);
        }

        const [langRes, fontRes, sampleRes] = await Promise.all([
          fetch(`${API_BASE}/api/languages`),
          fetch(`${API_BASE}/api/fonts`),
          fetch(`${API_BASE}/api/samples`),
        ]);

        if (langRes.ok) setLanguages(await langRes.json());
        if (fontRes.ok) setFonts(await fontRes.json());
        if (sampleRes.ok) setSamples(await sampleRes.json());
      } catch (err) {
        console.warn('Backend connection error:', err);
        setBackendHealthy(false);
      }
    };

    checkHealthAndLoadData();
  }, []);

  // Handle Image File Selected
  const handleImageSelected = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    await executeProcessing(file, null, targetLang);
  };

  // Handle Demo Sample Selected
  const handleSampleSelected = async (sample: SampleImageItem) => {
    setSelectedFile(null);
    setCurrentBase64(sample.base64);
    setErrorMessage(null);
    await executeProcessing(null, sample.base64, targetLang);
  };

  // Main Processing API Call
  const executeProcessing = async (
    file: File | null,
    base64Data: string | null,
    langTarget: string
  ) => {
    setIsProcessing(true);
    setProcessStep('Analyzing image & detecting text regions (OCR)...');
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (base64Data) {
        formData.append('imageBase64', base64Data);
      }
      formData.append('sourceLanguage', sourceLang);
      formData.append('targetLanguage', langTarget);

      setProcessStep('Extracting font colors, translating & inpainting background...');
      const response = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to process image');
      }

      setProcessStep('Rendering Unicode fonts & fitting bounding boxes...');
      const data: ProcessImageResponse = await response.json();
      setResultData(data);
      if (data.textBlocks.length > 0) {
        setSelectedBlockId(data.textBlocks[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while processing the image.');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // Switch Target Language On-the-Fly
  const handleTargetLanguageChange = async (newLang: string) => {
    setTargetLang(newLang);
    if (resultData) {
      if (selectedFile) {
        await executeProcessing(selectedFile, null, newLang);
      } else if (currentBase64 || resultData.originalImageBase64) {
        await executeProcessing(null, currentBase64 || resultData.originalImageBase64, newLang);
      }
    }
  };

  // Handle Text Block Update in Inspector
  const handleUpdateBlock = (updatedBlock: TextBlock) => {
    if (!resultData) return;
    const newBlocks = resultData.textBlocks.map((b) =>
      b.id === updatedBlock.id ? updatedBlock : b
    );
    setResultData({
      ...resultData,
      textBlocks: newBlocks,
    });
  };

  // Re-render Edited Blocks (Instant live preview)
  const handleApplyRerender = async () => {
    if (!resultData) return;
    setIsRerendering(true);

    try {
      const payload = {
        imageBase64: resultData.originalImageBase64,
        inpaintedBase64: resultData.inpaintedImageBase64,
        targetLanguage: targetLang,
        textBlocks: resultData.textBlocks,
        imageWidth: resultData.imageWidth,
        imageHeight: resultData.imageHeight,
      };

      const res = await fetch(`${API_BASE}/api/rerender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Re-render failed');
      const data = await res.json();

      setResultData({
        ...resultData,
        translatedImageBase64: data.renderedImageBase64,
        textBlocks: data.textBlocks,
      });
    } catch (err: any) {
      console.error('Re-render error:', err);
    } finally {
      setIsRerendering(false);
    }
  };

  const handleReset = () => {
    setResultData(null);
    setSelectedFile(null);
    setCurrentBase64(null);
    setErrorMessage(null);
    setSelectedBlockId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        backendHealthy={backendHealthy}
        isProcessing={isProcessing}
        onReset={resultData ? handleReset : undefined}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Language Selection & Controls Bar */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Source Language */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source:
              </span>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200">
                Auto Detect (OCR)
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />

            {/* Target Language Dropdown */}
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Language:
              </span>
              <select
                value={targetLang}
                onChange={(e) => handleTargetLanguageChange(e.target.value)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all cursor-pointer shadow-sm"
              >
                {languages.length > 0 ? (
                  languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeName}) {lang.isRtl ? '· RTL' : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="fr">French (Français)</option>
                    <option value="zh-CN">Chinese Simplified (简体中文)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="ja">Japanese (日本語)</option>
                    <option value="ko">Korean (한국어)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="ar">Arabic (العربية · RTL)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {resultData && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {resultData.textBlocks.length} text regions · {resultData.processingTimeMs}ms
                </span>
              </div>

              <button
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Result</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Progress State */}
        {isProcessing && (
          <div className="glass-panel rounded-2xl p-10 text-center space-y-4 border border-cyan-500/30 glow-cyan animate-pulse">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Processing Non-Destructive In-Image Translation
              </h3>
              <p className="text-sm text-cyan-300 font-mono">{processStep}</p>
            </div>
            <div className="max-w-md mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 w-2/3 animate-[pulse_1s_infinite]" />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2 py-1 bg-rose-900 rounded hover:bg-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload State (When no image is processed) */}
        {!resultData && !isProcessing && (
          <div className="space-y-6">
            <ImageDropzone onImageSelected={handleImageSelected} disabled={isProcessing} />
            <SampleImagesGallery
              samples={samples}
              onSelectSample={handleSampleSelected}
              disabled={isProcessing}
            />

            {/* Feature Highlights Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Pixel-Perfect Preservation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never regenerates the whole image. Seamlessly inlays translated text on restored original backgrounds.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Dynamic Unicode Font Fitting</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculates optimal font size, word wrapping, alignment, and dominant foreground colors automatically.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Interactive Manual Inspector</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fine-tune translated words, colors, weights, and sizes on any detected text block with instant live re-render.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Workspace (When translation is complete) */}
        {resultData && !isProcessing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Image Comparison Slider & Overlays */}
            <div className="lg:col-span-2 space-y-4">
              <ImageComparisonSlider
                originalImage={resultData.originalImageBase64}
                translatedImage={resultData.translatedImageBase64}
                inpaintedImage={resultData.inpaintedImageBase64}
                textBlocks={resultData.textBlocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                imageWidth={resultData.imageWidth}
                imageHeight={resultData.imageHeight}
              />

              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Click on any text box overlay or divider to inspect & compare</span>
                </span>
                <span className="font-mono">
                  Dimensions: {resultData.imageWidth} × {resultData.imageHeight} px
                </span>
              </div>
            </div>

            {/* Right Column: Text Block Inspector Sidebar */}
            <div className="lg:col-span-1 h-[680px]">
              <TextBlockEditor
                blocks={resultData.textBlocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlock={handleUpdateBlock}
                onApplyRerender={handleApplyRerender}
                isRerendering={isRerendering}
                fonts={fonts}
              />
            </div>
          </div>
        )}
      </main>

      {/* Export & Download Modal */}
      {resultData && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          imageUrl={resultData.translatedImageBase64}
          targetLanguage={targetLang}
          imageWidth={resultData.imageWidth}
          imageHeight={resultData.imageHeight}
        />
      )}
    </div>
  );
}
