'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import { ParsedTable } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_SIZE = 15;

type SortDir = 'asc' | 'desc';

interface Props {
  table: ParsedTable;
  data?: Record<string, any>[];
}

export default function DataTable({ table, data }: Props) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const baseRows = data ?? table.data;
  const cols = table.columns.slice(0, 10);

  const searchedRows = useMemo(() => {
    if (!search.trim()) return baseRows;
    const q = search.toLowerCase();
    return baseRows.filter((row) =>
      cols.some((col) => {
        const val = row[col.originalName];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [baseRows, search, cols]);

  const sortedRows = useMemo(() => {
    if (!sortCol) return searchedRows;
    return [...searchedRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const an = Number(av), bn = Number(bv);
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searchedRows, sortCol, sortDir]);

  function handleSort(colName: string) {
    if (sortCol === colName) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colName);
      setSortDir('asc');
    }
    setPage(0);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(0);
  }

  function exportCSV() {
    const header = cols.map((c) => c.originalName).join(',');
    const csvRows = sortedRows.map((row) =>
      cols.map((c) => {
        const val = row[c.originalName];
        if (val == null) return '';
        const s = String(val);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',')
    );
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!cols.length) return null;

  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);
  const pageRows = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isFiltered = data !== undefined;
  const from = sortedRows.length > 0 ? page * PAGE_SIZE + 1 : 0;
  const to = Math.min((page + 1) * PAGE_SIZE, sortedRows.length);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-700">{t('recentData')}</h3>
        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('searchTable')}
              className="h-8 pl-7 pr-3 text-xs border border-surface-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-44"
            />
          </div>
          <button onClick={exportCSV} className="btn-ghost text-xs py-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCSV')}</span>
          </button>
          <span className="text-xs text-slate-400">
            {t('showingRows')} {from}–{to} {t('of')} {sortedRows.length.toLocaleString()}
            {isFiltered && sortedRows.length !== table.rowCount && (
              <span className="text-primary-500 font-medium ml-1">
                ({t('filtered')}: {table.rowCount.toLocaleString()} {t('rows')})
              </span>
            )}
          </span>
        </div>
      </div>

      {sortedRows.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">{t('noFilterResults')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                {cols.map((col) => (
                  <th
                    key={col.originalName}
                    onClick={() => handleSort(col.originalName)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:bg-surface-100 select-none group"
                  >
                    <span className="flex items-center gap-1">
                      {col.originalName}
                      {sortCol === col.originalName ? (
                        sortDir === 'asc'
                          ? <ChevronUp className="w-3 h-3 text-primary-500" />
                          : <ChevronDown className="w-3 h-3 text-primary-500" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {pageRows.map((row, i) => (
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
      )}

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-surface-200 flex items-center justify-between">
          <button
            className="btn-ghost text-xs py-1.5"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" /> {t('prev')}
          </button>
          <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
          <button
            className="btn-ghost text-xs py-1.5"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            {t('next')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
