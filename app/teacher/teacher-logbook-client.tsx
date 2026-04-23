'use client';

import * as React from 'react';
import Link from 'next/link';

import type { AuditLogRow } from '@/lib/teacher-audit-log';
import { amsterdamDatesWithLogsDesc, filterLogsByAmsterdamDate, formatLogLine } from '@/lib/teacher-audit-log';
import { buildWorkOverview } from '@/lib/logbook-overview';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatPillDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

export function TeacherLogbookClient() {
  const [auditLogs, setAuditLogs] = React.useState<AuditLogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedLogDate, setSelectedLogDate] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const daysWithLogs = React.useMemo(() => amsterdamDatesWithLogsDesc(auditLogs), [auditLogs]);
  const overview = React.useMemo(() => buildWorkOverview(auditLogs), [auditLogs]);
  const filteredLogs = React.useMemo(
    () => filterLogsByAmsterdamDate(auditLogs, selectedLogDate),
    [auditLogs, selectedLogDate]
  );
  const logLines = React.useMemo(() => filteredLogs.map(formatLogLine), [filteredLogs]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/teacher/audit-logs');
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Logboek laden mislukt');
        setAuditLogs((json?.data as AuditLogRow[]) ?? []);
      } catch (e: any) {
        setError(e?.message ?? 'Logboek laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function exportLogbook() {
    setExporting(true);
    try {
      const res = await fetch('/api/teacher/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedLogDate }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Export mislukt');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      let filename = 'logboek.docx';
      const m = cd?.match(/filename="([^"]+)"/);
      if (m?.[1]) filename = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      window.alert(e?.message ?? 'Export mislukt');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="glass-surface rounded-3xl p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Logboek</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Samenvatting van werk aan het portfolio (uit het technische logboek).{' '}
              <Link href="/teacher" className="font-medium text-primary underline-offset-4 hover:underline">
                ← Terug naar projecten
              </Link>
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void exportLogbook()} disabled={exporting || loading}>
            {exporting ? 'Exporteren…' : 'Exporteer Word'}
          </Button>
        </div>
      </div>

      {loading ? <p className="mt-6 text-sm text-muted-foreground">Laden…</p> : null}
      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="glass-surface mt-6 rounded-2xl p-5 shadow-inner">
            <h2 className="text-sm font-semibold text-foreground">Overzicht</h2>
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground">
              {overview}
            </pre>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted-foreground">Filter op dagen met activiteit (laatste 30 dagen).</p>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
            <button
              type="button"
              onClick={() => setSelectedLogDate(null)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedLogDate === null
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-background/60 text-muted-foreground hover:bg-accent'
              )}
            >
              Alle dagen
            </button>
            {daysWithLogs.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedLogDate(k)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedLogDate === k
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background/60 text-muted-foreground hover:bg-accent'
                )}
              >
                {formatPillDate(k)}
              </button>
            ))}
          </div>

          <div className="glass-surface mt-4 rounded-2xl p-4 font-mono text-xs leading-relaxed shadow-inner">
            {logLines.length ? (
              <pre className="whitespace-pre-wrap break-words">{logLines.join('\n')}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nog geen detailregels{selectedLogDate ? ` voor ${formatPillDate(selectedLogDate)}` : ''}.
              </p>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
