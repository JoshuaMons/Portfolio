'use client';

import { useMemo } from 'react';
import { ParsedTable } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  table: ParsedTable;
  data: Record<string, any>[];
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

export default function StatsPanel({ table, data }: Props) {
  const { t } = useLanguage();

  const numericCols = table.columns.filter((c) => c.inferredType === 'number');

  const stats = useMemo(() => {
    return numericCols.map((col) => {
      const vals = data
        .map((row) => row[col.originalName])
        .filter((v) => v != null && v !== '' && !isNaN(Number(v)));

      const nullCount = data.length - vals.length;
      const nullPct = data.length > 0 ? Math.round((nullCount / data.length) * 100) : 0;

      if (vals.length === 0) {
        return { col: col.originalName, min: '—', max: '—', mean: '—', median: '—', nullCount, nullPct };
      }

      const nums = vals.map(Number).sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const mid = Math.floor(nums.length / 2);
      const median = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];

      return {
        col: col.originalName,
        min: fmt(nums[0]),
        max: fmt(nums[nums.length - 1]),
        mean: fmt(mean),
        median: fmt(median),
        nullCount,
        nullPct,
      };
    });
  }, [numericCols, data]);

  if (numericCols.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-slate-700">{t('statsTitle')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('columnLabel')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('statMin')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('statMax')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('statMean')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('statMedian')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('statNulls')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {stats.map((s) => (
              <tr key={s.col} className="hover:bg-surface-50">
                <td className="px-4 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">{s.col}</td>
                <td className="px-4 py-2.5 text-xs text-right tabular-nums text-slate-700">{s.min}</td>
                <td className="px-4 py-2.5 text-xs text-right tabular-nums text-slate-700">{s.max}</td>
                <td className="px-4 py-2.5 text-xs text-right tabular-nums text-slate-700">{s.mean}</td>
                <td className="px-4 py-2.5 text-xs text-right tabular-nums text-slate-700">{s.median}</td>
                <td className="px-4 py-2.5 text-xs text-right tabular-nums">
                  <span className={s.nullPct > 20 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                    {s.nullCount.toLocaleString()} ({s.nullPct}%)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
