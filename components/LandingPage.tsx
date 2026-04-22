'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Database, FileSpreadsheet, Globe, LayoutDashboard, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LandingPage() {
  const router = useRouter();
  const { loadFile, isLoading, error } = useDatabase();
  const { lang, setLang, t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      await loadFile(file);
      router.push('/dashboard');
    },
    [loadFile, router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-5 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">{t('welcomeTitle')}</span>
        </div>

        {/* Lang switch */}
        <div className="flex items-center gap-1 bg-white border border-surface-200 rounded-lg p-1 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {(['en', 'nl'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-colors',
                lang === l ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-6">
              <Database className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              {t('welcomeSubtitle')}
            </h1>
            <p className="text-slate-500 text-base leading-relaxed">
              {t('welcomeDescription')}
            </p>
          </div>

          {/* Drop zone */}
          <label
            className={clsx(
              'relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl cursor-pointer transition-all duration-200',
              'border-2 border-dashed',
              isDragging
                ? 'border-primary-500 bg-primary-50 scale-[1.01]'
                : 'border-surface-300 bg-white hover:border-primary-400 hover:bg-primary-50/40',
              isLoading && 'pointer-events-none opacity-75'
            )}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              type="file"
              accept=".db,.sqlite,.sqlite3,.csv"
              className="sr-only"
              onChange={onInputChange}
              disabled={isLoading}
            />

            {isLoading ? (
              <>
                <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-primary-700 font-medium">{t('uploading')}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 text-lg">{t('dropzoneTitle')}</p>
                  <p className="text-slate-500 text-sm mt-1">{t('dropzoneOr')}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>.db .sqlite .sqlite3</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>.csv</span>
                  </div>
                </div>
              </>
            )}
          </label>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{t('uploadError')}</p>
            </div>
          )}

          {/* Feature hints */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: '📊', en: 'Auto charts', nl: 'Auto grafieken' },
              { icon: '🤖', en: 'Chatbot insights', nl: 'Chatbot inzichten' },
              { icon: '🌐', en: 'EN & NL support', nl: 'EN & NL ondersteuning' },
            ].map((f) => (
              <div key={f.en} className="card px-3 py-3 text-center">
                <div className="text-xl mb-1">{f.icon}</div>
                <p className="text-xs text-slate-600 font-medium">
                  {lang === 'nl' ? f.nl : f.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
