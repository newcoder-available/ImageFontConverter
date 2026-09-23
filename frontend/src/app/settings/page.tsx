'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  Key, 
  Save, 
  Server, 
  Sliders, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Sparkles,
  HardDrive,
  Eye,
  EyeOff
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SettingsConfig } from '@/types';

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

export default function SettingsPage() {
  const [config, setConfig] = useState<SettingsConfig>({
    aiProvider: 'mock',
    inpaintMethod: 'telea',
    storageProvider: 'local',
    selfHostedEndpoint: 'http://localhost:11434',
    apiKeyConfigured: false,
    openaiApiKey: '',
    geminiApiKey: '',
    anthropicApiKey: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showKeys, setShowKeys] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.warn('Could not fetch settings', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar apiBase={API_BASE} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              Modular Architecture
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            AI Providers & Engine Settings
          </h1>
          <p className="text-xs text-slate-400">
            Configure cloud AI providers, local self-hosted models, inpainting methods, and storage adapters.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* AI Provider Selector */}
          <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Active AI & Translation Provider
            </h2>
            <p className="text-xs text-slate-400">
              Select which AI provider orchestrates translation, language detection, and quality validation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                {
                  id: 'mock',
                  title: 'Mock Mode (Zero-Config / Local)',
                  desc: 'High-speed offline OCR, inpainting, and built-in linguistic dictionaries. Ideal for offline testing and rapid development.',
                  badge: 'Recommended for Dev',
                },
                {
                  id: 'openai',
                  title: 'OpenAI GPT-4o',
                  desc: 'Cloud LLM translation with high contextual adaptation for marketing copy & complex idioms.',
                  badge: 'Cloud AI',
                },
                {
                  id: 'gemini',
                  title: 'Google Gemini 1.5 Flash',
                  desc: 'High-throughput multilingual multimodal AI with deep script and idiom comprehension.',
                  badge: 'Cloud AI',
                },
                {
                  id: 'self-hosted',
                  title: 'Self-Hosted / Local LLM (Ollama / vLLM)',
                  desc: 'Connect to your private on-premise LLM server without sending data to third parties.',
                  badge: 'Private / On-Prem',
                },
              ].map((p) => {
                const isSelected = config.aiProvider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setConfig({ ...config, aiProvider: p.id as any })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white">{p.title}</h3>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Credentials / Endpoints based on selection */}
          {config.aiProvider === 'openai' && (
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 animate-in fade-in">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                OpenAI API Credentials
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={config.openaiApiKey || ''}
                  onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </section>
          )}

          {config.aiProvider === 'gemini' && (
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 animate-in fade-in">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                Google Gemini API Key
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gemini API Key
                </label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={config.geminiApiKey || ''}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </section>
          )}

          {config.aiProvider === 'self-hosted' && (
            <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 animate-in fade-in">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Local LLM Endpoint
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Server URL (Ollama / LocalAI / vLLM)
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={config.selfHostedEndpoint || ''}
                  onChange={(e) => setConfig({ ...config, selfHostedEndpoint: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </section>
          )}

          {/* Inpainting Engine & Storage Configuration */}
          <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Engine Inpainting & Storage Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Background Inpainting Algorithm
                </label>
                <select
                  value={config.inpaintMethod}
                  onChange={(e) => setConfig({ ...config, inpaintMethod: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="telea">Fast Marching Method (Telea - Pixel Exact)</option>
                  <option value="ns">Navier-Stokes (Fluid Dynamics Smoothing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Storage Adapter
                </label>
                <select
                  value={config.storageProvider}
                  onChange={(e) => setConfig({ ...config, storageProvider: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="local">Local Ephemeral Storage</option>
                  <option value="gcs">Google Cloud Storage (GCS Bucket)</option>
                  <option value="s3">Amazon S3 Object Storage</option>
                </select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
