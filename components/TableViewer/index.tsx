'use client';

import { useState } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ParsedTable, ParsedColumn } from '@/types';
import { clsx } from 'clsx';
import { Table2, ChevronRight } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  date: 'bg-blue-50 text-blue-700',
  number: 'bg-emerald-50 text-emerald-700',
  category: 'bg-violet-50 text-violet-700',
  boolean: 'bg-amber-50 text-amber-700',
  text: 'bg-slate-100 text-slate-600',
};

function ColumnRow({ col }: { col: ParsedColumn }) {
  const { t } = useLanguage();
  return (
    <tr className="hover:bg-surface-50 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-800 text-sm">{col.originalName}</td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {col.sqlType || 'TEXT'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', TYPE_COLORS[col.inferredType])}>
          {t(`type${col.inferredType.charAt(0).toUpperCase() + col.inferredType.slice(1)}` as any)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{col.uniqueCount.toLocaleString()}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{col.nullable ? t('yes') : t('no')}</td>
      <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px]">
        <div className="flex flex-wrap gap-1">
          {col.sampleValues.slice(0, 3).map((v, i) => (
            <span key={i} className="bg-surface-100 px-1.5 py-0.5 rounded text-slate-600 truncate max-w-[80px]" title={v}>
              {v}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}

function TableDetail({ table }: { table: ParsedTable }) {
  const { t } = useLanguage();
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{table.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {table.rowCount.toLocaleString()} {t('rows')} · {table.columns.length} {t('totalColumns')}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              {[
                t('columnName'),
                t('sqlType'),
                t('inferredType'),
                t('uniqueValues'),
                t('nullable'),
                t('sampleValues'),
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {table.columns.map((col) => (
              <ColumnRow key={col.originalName} col={col} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TableViewer() {
  const { database } = useDatabase();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string>(database?.tables[0]?.name ?? '');

  if (!database) return null;

  const { tables } = database;
  const activeTable = tables.find((t) => t.name === selected) ?? tables[0];

  return (
    <div className="flex gap-5">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('tablesOverview')}</p>
          </div>
          <ul>
            {tables.map((table) => (
              <li key={table.name}>
                <button
                  onClick={() => setSelected(table.name)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left',
                    selected === table.name
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-700 hover:bg-surface-50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Table2 className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    <span className="truncate">{table.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                    {table.rowCount.toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 min-w-0">
        {activeTable ? (
          <TableDetail table={activeTable} />
        ) : (
          <div className="card p-10 text-center text-slate-400 text-sm">{t('selectTable')}</div>
        )}
      </div>
    </div>
  );
}
