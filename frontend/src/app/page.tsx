'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Info,
  ShieldCheck,
  Lock,
  Search,
  ChevronRight,
  Play,
  Languages
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ImageDropzone } from '@/components/ImageDropzone';
import { SampleImagesGallery } from '@/components/SampleImagesGallery';
import { ImageComparisonSlider } from '@/components/ImageComparisonSlider';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SupportedLanguage, SampleImageItem, ProcessImageResponse } from '@/types';

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

export default function LandingPage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [samples, setSamples] = useState<Record<string, SampleImageItem>>({});
  const [activeDemo, setActiveDemo] = useState<string>('gaming_ui.png');
  const [searchLang, setSearchLang] = useState<string>('');
  const [selectedTargetLangs, setSelectedTargetLangs] = useState<string[]>(['ja', 'hi', 'de', 'es', 'fr', 'ar']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const langRes = await fetch(`${API_BASE}/api/languages`);
        if (langRes.ok) {
          const lData = await langRes.json();
          setLanguages(lData);
        }
        const sampleRes = await fetch(`${API_BASE}/api/samples`);
        if (sampleRes.ok) {
          const sData = await sampleRes.json();
          setSamples(sData);
        }
      } catch (e) {
        console.warn('API not reachable yet', e);
      }
    };
    fetchData();
  }, []);

  const handleImageUploaded = (file: File, base64?: string) => {
    if (!base64) return;
    try {
      sessionStorage.setItem('current_image_base64', base64);
      sessionStorage.setItem('current_target_langs', JSON.stringify(selectedTargetLangs));
      router.push('/processing');
    } catch (e) {
      router.push('/editor');
    }
  };

  const handleSampleSelected = (sampleKey: string, base64?: string) => {
    if (!base64) return;
    try {
      sessionStorage.setItem('current_image_base64', base64);
      sessionStorage.setItem('current_target_langs', JSON.stringify(selectedTargetLangs));
      router.push('/processing');
    } catch (e) {
      router.push('/editor');
    }
  };

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.code.toLowerCase().includes(searchLang.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Navbar apiBase={API_BASE} languages={languages} />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glowing backdrop elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-indigo-600/20 to-fuchsia-600/15 blur-[120px] pointer-events-none rounded-full" />

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-sm shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Gen Multilingual Image Localization Engine</span>
        </div>

        {/* Main Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight sm:leading-none">
          Translate any image.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400">
            Preserve every detail.
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl leading-relaxed">
          AI-powered multilingual image localization that automatically detects, translates, and
          recreates in-image text with pixel-perfect typography preservation while keeping the
          original artwork 100% immutable.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/editor"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upload Image & Localize</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <button
            onClick={() => {
              if (samples['gaming_ui.png']) {
                handleSampleSelected('gaming_ui.png', samples['gaming_ui.png'].base64);
              } else {
                router.push('/editor?sample=gaming');
              }
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center space-x-2 transition-all"
          >
            <Play className="w-4 h-4 text-cyan-400" />
            <span>Try Live Gaming Demo (BOOSTER)</span>
          </button>
        </div>

        {/* Core Principles Pill Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-slate-400 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <span className="text-cyan-400 font-bold px-2 py-1 bg-cyan-950/60 rounded-lg">DETECT</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-indigo-400 font-bold px-2 py-1 bg-indigo-950/60 rounded-lg">UNDERSTAND</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-purple-400 font-bold px-2 py-1 bg-purple-950/60 rounded-lg">TRANSLATE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-fuchsia-400 font-bold px-2 py-1 bg-fuchsia-950/60 rounded-lg">RECREATE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-emerald-400 font-bold px-2 py-1 bg-emerald-950/60 rounded-lg">AI QA VERIFY</span>
        </div>
      </section>

      {/* Instant Dropzone & Demo Upload Area */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full pb-16">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-3/5">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Drag & Drop Your Image
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Supports PNG, JPG, JPEG, WEBP. AI will auto-detect source language & all text regions.
              </p>
              <ImageDropzone onImageSelected={handleImageUploaded} isProcessing={false} />
            </div>

            <div className="w-full md:w-2/5 flex flex-col space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Target Languages</span>
                  <span className="text-cyan-400 font-mono text-[11px]">{selectedTargetLangs.length} selected</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
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
                  ].map((lang) => {
                    const isSel = selectedTargetLangs.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          if (isSel) {
                            if (selectedTargetLangs.length > 1) {
                              setSelectedTargetLangs(selectedTargetLangs.filter((c) => c !== lang.code));
                            }
                          } else {
                            setSelectedTargetLangs([...selectedTargetLangs, lang.code]);
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                          isSel
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {lang.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sample Previews */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Or Try Sample Graphics
                </h4>
                <SampleImagesGallery samples={samples} onSelectSample={handleSampleSelected} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            How LOCALIZE AI Works
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A modular 5-stage vision and reconstruction pipeline engineered for precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Vision & OCR',
              desc: 'Deep OCR locates bounding boxes, polygon contours, and text orientation.',
              icon: Eye,
              color: 'text-cyan-400',
            },
            {
              step: '02',
              title: 'Auto Language',
              desc: 'Identifies source language, Unicode script, and direction automatically.',
              icon: Globe,
              color: 'text-indigo-400',
            },
            {
              step: '03',
              title: 'Classification',
              desc: 'Protects brand logos, URLs, model codes, and numbers while localizing UI text.',
              icon: ShieldCheck,
              color: 'text-purple-400',
            },
            {
              step: '04',
              title: 'Reconstruction',
              desc: 'Inpaints text pixels and renders native fonts with exact 3D shadow & stroke.',
              icon: Sliders,
              color: 'text-fuchsia-400',
            },
            {
              step: '05',
              title: 'AI QA Verification',
              desc: 'Runs automated visual & script QA, triggering correction loops up to 3 times.',
              icon: CheckCircle2,
              color: 'text-emerald-400',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-500">{item.step}</span>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Engineered for Pixel Integrity
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Never regenerate artwork or hallucinate new layouts. The source image is authoritative.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Immutable Artwork Guarantee</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modifications are strictly constrained within calculated text bounding masks. Background textures, characters, products, and lighting stay 100% untouched.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">28+ Native Scripts & RTL</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full typographic support for Japanese Kana/Kanji, Devanagari, Arabic/Hebrew Bi-directional shaping, Cyrillic, Thai, Tamil, Telugu, and more with zero tofu glyphs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Provider & Local AI Agnostic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modular provider architecture allowing instant zero-dependency Mock execution, OpenAI, Google Gemini, Anthropic, or self-hosted local LLMs without UI code changes.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Languages Directory */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" /> Supported Languages & Scripts ({languages.length || 28})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Global linguistic coverage with automatic font mapping and bidirectional layout.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter languages..."
              value={searchLang}
              onChange={(e) => setSearchLang(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {(filteredLanguages.length > 0 ? filteredLanguages : [
            { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語', script: 'CJK' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
            { code: 'zh-CN', name: 'Chinese Simp.', nativeName: '简体中文', script: 'Han' },
            { code: 'zh-TW', name: 'Chinese Trad.', nativeName: '繁體中文', script: 'Han' },
            { code: 'ko', name: 'Korean', nativeName: '한국어', script: 'Hangul' },
            { code: 'de', name: 'German', nativeName: 'Deutsch', script: 'Latin' },
            { code: 'fr', name: 'French', nativeName: 'Français', script: 'Latin' },
            { code: 'es', name: 'Spanish', nativeName: 'Español', script: 'Latin' },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية', script: 'Arabic RTL' },
            { code: 'he', name: 'Hebrew', nativeName: 'עברית', script: 'Hebrew RTL' },
            { code: 'ru', name: 'Russian', nativeName: 'Русский', script: 'Cyrillic' },
            { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', script: 'Cyrillic' },
            { code: 'it', name: 'Italian', nativeName: 'Italiano', script: 'Latin' },
            { code: 'pt', name: 'Portuguese', nativeName: 'Português', script: 'Latin' },
            { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', script: 'Latin' },
            { code: 'th', name: 'Thai', nativeName: 'ไทย', script: 'Thai' },
            { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', script: 'Latin' },
            { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', script: 'Latin' },
            { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', script: 'Latin' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
            { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
          ]).map((l) => (
            <div
              key={l.code}
              className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">{l.code}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {l.script || 'Universal'}
                </span>
              </div>
              <span className="text-xs font-bold text-white truncate">{l.name}</span>
              <span className="text-[11px] text-slate-400 truncate">{l.nativeName}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-900">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Enterprise-Grade Privacy & Security</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Your Artwork & Brand IP Stays Protected</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All AI API keys and models are orchestrated strictly server-side. No customer graphics or localized images are used for model training. Temporary processing buffers are ephemeral.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/settings"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 text-center transition-all"
            >
              Configure AI Providers
            </Link>
            <Link
              href="/editor"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold text-center transition-all shadow-md shadow-cyan-500/20"
            >
              Start Localizing Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">LOCALIZE AI</span>
            <span>—</span>
            <span>Translate any image. Preserve every detail.</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-400">
            <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            <Link href="/editor" className="hover:text-white transition-colors">Editor</Link>
            <Link href="/history" className="hover:text-white transition-colors">History</Link>
            <Link href="/settings" className="hover:text-white transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
