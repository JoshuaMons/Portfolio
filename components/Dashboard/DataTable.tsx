'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ParsedTable } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { clsx } from 'clsx';

const PAGE_SIZE = 15;

export default function DataTable({ table }: { table: ParsedTable }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  if (!table || !table.columns.length) return null;

  const cols = table.columns.slice(0, 10);
  const totalPages = Math.ceil(table.data.length / PAGE_SIZE);
  const rows = table.data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{t('recentData')}</h3>
        <span className="text-xs text-slate-400">
          {t('showingRows')} {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, table.data.length)} {t('of')} {table.rowCount.toLocaleString()} {t('rows')}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              {cols.map((col) => (
                <th
                  key={col.originalName}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {col.originalName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-50 transition-colors">
                {cols.map((col) => {
                  const val = row[col.originalName];
                  const display = val === null || val === undefined ? '—' : String(val);
                  return (
                    <td
                      key={col.originalName}
                      className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                      title={display}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-surface-200 flex items-center justify-between">
          <button
            className="btn-ghost text-xs py-1.5"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-xs text-slate-500">
            {page + 1} / {totalPages}
          </span>
          <button
            className="btn-ghost text-xs py-1.5"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
