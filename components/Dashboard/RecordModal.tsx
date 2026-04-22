'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Hash, Tag, ToggleLeft, AlignLeft, Copy, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { ParsedTable, ParsedColumn, ColumnType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { clsx } from 'clsx';

const TYPE_ICONS: Record<ColumnType, React.ComponentType<{ className?: string }>> = {
  date: Calendar, number: Hash, category: Tag, boolean: ToggleLeft, text: AlignLeft,
};

const TYPE_COLORS: Record<ColumnType, string> = {
  date:     'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-blue-200 dark:ring-blue-700',
  number:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-700',
  category: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-violet-200 dark:ring-violet-700',
  boolean:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-700',
  text:     'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-600',
};

const STATUS_POSITIVE = ['resolved', 'opgelost', 'closed', 'gesloten', 'done', 'klaar', 'true', '1', 'yes', 'ja', 'completed', 'voltooid', 'success', 'succes'];
const STATUS_NEGATIVE = ['open', 'failed', 'mislukt', 'error', 'fout', 'false', '0', 'no', 'nee', 'pending', 'wachten', 'escalated', 'geëscaleerd'];

function getStatusColor(val: string): string | undefined {
  const v = val.toLowerCase();
  if (STATUS_POSITIVE.some(k => v.includes(k))) return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-700';
  if (STATUS_NEGATIVE.some(k => v.includes(k))) return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700';
  return undefined;
}

function FieldValue({ col, value }: { col: ParsedColumn; value: any }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const raw = value == null || value === '' ? null : String(value);

  function copy() {
    if (!raw) return;
    navigator.clipboard.writeText(raw).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (raw === null) {
    return <span className="text-xs text-slate-300 dark:text-slate-600 italic">{t('recordEmpty')}</span>;
  }

  // Status/boolean badge
  if (col.inferredType === 'boolean' || col.inferredType === 'category') {
    const statusColor = getStatusColor(raw);
    return (
      <div className="flex items-center gap-2">
        <span className={clsx(
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
          statusColor ?? 'bg-surface-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
        )}>
          {raw}
        </span>
        <button onClick={copy} className="text-slate-300 dark:text-slate-600 hover:text-primary-500 transition-colors" title={t('recordCopy')}>
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  // Long text
  if (col.inferredType === 'text' && raw.length > 120) {
    return (
      <div className="space-y-1">
        <p className={clsx('text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words', !expanded && 'line-clamp-3')}>
          {raw}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            {expanded ? t('recordShowLess') : t('recordShowMore')}
          </button>
          <button onClick={copy} className="text-slate-300 dark:text-slate-600 hover:text-primary-500 transition-colors" title={t('recordCopy')}>
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Number with formatting
  if (col.inferredType === 'number') {
    const n = Number(raw);
    const formatted = !isNaN(n) ? n.toLocaleString() : raw;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{formatted}</span>
        <button onClick={copy} className="text-slate-300 dark:text-slate-600 hover:text-primary-500 transition-colors" title={t('recordCopy')}>
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  // Default
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm text-slate-700 dark:text-slate-200 break-words min-w-0">{raw}</span>
      <button onClick={copy} className="text-slate-300 dark:text-slate-600 hover:text-primary-500 transition-colors flex-shrink-0" title={t('recordCopy')}>
        {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function FieldRow({ col, value }: { col: ParsedColumn; value: any }) {
  const Icon = TYPE_ICONS[col.inferredType] ?? AlignLeft;
  const colorClass = TYPE_COLORS[col.inferredType];

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-surface-100 dark:border-slate-700/60 last:border-0">
      <div className={clsx('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 mt-0.5', colorClass)}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-0.5 truncate" title={col.originalName}>
          {col.originalName}
        </p>
        <FieldValue col={col} value={value} />
      </div>
    </div>
  );
}

interface Group { labelKey: 'recordGroupDates' | 'recordGroupCategories' | 'recordGroupNumbers' | 'recordGroupText'; cols: ParsedColumn[]; }

function buildGroups(columns: ParsedColumn[]): Group[] {
  const groups: Group[] = [
    { labelKey: 'recordGroupDates',      cols: columns.filter(c => c.inferredType === 'date') },
    { labelKey: 'recordGroupCategories', cols: columns.filter(c => c.inferredType === 'category' || c.inferredType === 'boolean') },
    { labelKey: 'recordGroupNumbers',    cols: columns.filter(c => c.inferredType === 'number') },
    { labelKey: 'recordGroupText',       cols: columns.filter(c => c.inferredType === 'text') },
  ];
  return groups.filter(g => g.cols.length > 0);
}

interface Props {
  table: ParsedTable;
  rows: Record<string, any>[];
  initialIndex: number;
  onClose: () => void;
}

export default function RecordModal({ table, rows, initialIndex, onClose }: Props) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(initialIndex);

  const row = rows[index];
  const groups = buildGroups(table.columns);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(rows.length - 1, i + 1)), [rows.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">{t('recordModalTitle')}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {table.name} · {t('recordRow')} {index + 1} / {rows.length.toLocaleString()}
            </p>
          </div>

          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              disabled={index === 0}
              title={t('recordPrev')}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-surface-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              disabled={index === rows.length - 1}
              title={t('recordNext')}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-surface-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-surface-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {groups.length > 1 ? (
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.labelKey}>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                    {t(group.labelKey)}
                  </p>
                  <div className="bg-surface-50 dark:bg-slate-700/40 rounded-xl px-3 divide-y divide-surface-100 dark:divide-slate-700/60">
                    {group.cols.map((col) => (
                      <FieldRow key={col.originalName} col={col} value={row[col.originalName]} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single group — no section headers
            <div className="bg-surface-50 dark:bg-slate-700/40 rounded-xl px-3 divide-y divide-surface-100 dark:divide-slate-700/60">
              {table.columns.map((col) => (
                <FieldRow key={col.originalName} col={col} value={row[col.originalName]} />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-surface-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-300 dark:text-slate-600">← → {t('recordPrev').split(' ')[0]} / {t('recordNext').split(' ')[0]}</p>
          <button onClick={onClose} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Esc
          </button>
        </div>
      </div>
    </div>
  );
}
