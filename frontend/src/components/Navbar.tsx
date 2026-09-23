'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Globe, 
  Sparkles, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  History, 
  Settings, 
  BookOpen, 
  RefreshCw,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { GlossaryModal } from './GlossaryModal';
import { SupportedLanguage } from '@/types';

interface NavbarProps {
  apiBase?: string;
  languages?: SupportedLanguage[];
  onQuickDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiBase = '',
  languages = [],
  onQuickDemo,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const base = apiBase || (window.location.hostname !== 'localhost' ? '' : 'http://127.0.0.1:8000');
        const res = await fetch(`${base}/api/health`);
        if (res.ok) {
          setBackendHealthy(true);
        } else {
          setBackendHealthy(false);
        }
      } catch (e) {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [apiBase]);

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Globe },
    { name: 'Projects', href: '/projects', icon: Layers },
    { name: 'Editor', href: '/editor', icon: Sliders },
    { name: 'Processing', href: '/processing', icon: Zap },
    { name: 'Results', href: '/results', icon: CheckCircle2 },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <header className="w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-indigo-200">
                  LOCALIZE AI
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Translate any image. Preserve every detail.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Glossary Button */}
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
              title="Multilingual Glossary Overrides"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Glossary</span>
            </button>

            {/* Quick Demo CTA */}
            {onQuickDemo ? (
              <button
                onClick={onQuickDemo}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Demo</span>
              </button>
            ) : (
              <Link
                href="/editor?sample=gaming"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Demo</span>
              </Link>
            )}

            {/* Backend Status Indicator */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px]"
              title={backendHealthy ? 'LOCALIZE AI Core Active' : 'Connecting to Core Engine'}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  backendHealthy
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-slate-400 hidden xl:inline font-medium">
                {backendHealthy ? 'Engine Active' : 'Connecting...'}
              </span>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-slate-950/95 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsGlossaryOpen(true);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Glossary</span>
            </button>
          </div>
        )}
      </header>

      {/* Glossary Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        apiBase={apiBase || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://127.0.0.1:8000')}
        languages={languages}
      />
    </>
  );
};
