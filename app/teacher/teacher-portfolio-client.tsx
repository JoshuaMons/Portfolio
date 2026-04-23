'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';

import type { Project, TeacherAssignment } from '@/types/portfolio';
import type { AuditLogRow } from '@/lib/teacher-audit-log';
import { filterLogsByAmsterdamDate, formatLogLine, last30AmsterdamDateKeysDesc } from '@/lib/teacher-audit-log';
import { Button } from '@/components/ui/button';
import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Item = {
  kind: 'evidence' | 'project' | 'assignment';
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url: string | null;
};

function toItem(p: Project): Item {
  return {
    kind: 'project',
    title: p.title,
    description: p.description,
    url: p.url,
    tags: p.tags ?? [],
    thumbnail_url: p.thumbnail_url,
  };
}

function toAssignment(a: TeacherAssignment): Item {
  return {
    kind: 'assignment',
    title: a.title,
    description: a.description,
    url: a.url,
    tags: a.tags ?? [],
    thumbnail_url: a.thumbnail_url,
  };
}

function formatPillDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

export function TeacherPortfolioClient({ projects }: { projects: Project[] }) {
  const [assignments, setAssignments] = React.useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [auditLogs, setAuditLogs] = React.useState<AuditLogRow[]>([]);
  const [logLoading, setLogLoading] = React.useState(false);
  const [logError, setLogError] = React.useState<string | null>(null);
  const [logFetched, setLogFetched] = React.useState(false);
  const [selectedLogDate, setSelectedLogDate] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const dayKeys = React.useMemo(() => last30AmsterdamDateKeysDesc(), []);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Item | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/teacher/assignments');
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Laden mislukt');
        setAssignments((json?.data as TeacherAssignment[]) ?? []);
      } catch (e: any) {
        setError(e?.message ?? 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function fetchAuditLogs() {
    setLogLoading(true);
    setLogError(null);
    try {
      const res = await fetch('/api/teacher/audit-logs');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Logboek laden mislukt');
      setAuditLogs((json?.data as AuditLogRow[]) ?? []);
      setLogFetched(true);
    } catch (e: any) {
      setLogError(e?.message ?? 'Logboek laden mislukt');
    } finally {
      setLogLoading(false);
    }
  }

  async function exportLogbook() {
    setExporting(true);
    try {
      const res = await fetch('/api/teacher/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedLogDate }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || 'Export mislukt');
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

  function openItem(item: Item) {
    setActive(item);
    setOpen(true);
  }

  const evidenceItem: Item = {
    kind: 'evidence',
    title: 'Projectdocumentatie (bewijs)',
    description:
      'Samenvatting van prompts → wat er gebouwd is, met verwijzingen naar code en testplan. Print / Save as PDF.',
    url: '/teacher/evidence',
    tags: ['bewijs', 'documentatie', 'samenvatting'],
    thumbnail_url: null,
  };

  const projectItems = projects.map(toItem);
  const assignmentItems = assignments.map(toAssignment);
  const filteredLogs = React.useMemo(
    () => filterLogsByAmsterdamDate(auditLogs, selectedLogDate),
    [auditLogs, selectedLogDate]
  );
  const logLines = React.useMemo(() => filteredLogs.map(formatLogLine), [filteredLogs]);

  function Grid({ items }: { items: Item[] }) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <button
            key={`${it.kind}:${it.title}`}
            type="button"
            onClick={() => openItem(it)}
            className="glass-surface group rounded-3xl p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{it.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>
              </div>
              {it.url && <ExternalLink className="h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />}
            </div>
            {it.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {it.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="glass-surface rounded-3xl p-6 shadow-card">
        <h1 className="text-2xl font-semibold">Docenten view</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zelfde portfolio content + extra tab met docent-opdrachten.
        </p>
      </div>

      <Tabs
        defaultValue="projects"
        className="mt-6"
        onValueChange={(v) => {
          if (v === 'logbook' && !logFetched) void fetchAuditLogs();
        }}
      >
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="projects">Projecten</TabsTrigger>
          <TabsTrigger value="assignments">Docent opdrachten</TabsTrigger>
          <TabsTrigger value="logbook">Logboek</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Grid items={[evidenceItem, ...projectItems]} />
        </TabsContent>

        <TabsContent value="assignments">
          {loading ? <p className="mt-6 text-sm text-muted-foreground">Laden…</p> : null}
          {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
          {!loading && !error ? <Grid items={assignmentItems} /> : null}
        </TabsContent>

        <TabsContent value="logbook">
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => void exportLogbook()} disabled={exporting || logLoading}>
              {exporting ? 'Exporteren…' : 'Exporteer Word'}
            </Button>
            <p className="text-xs text-muted-foreground">Export volgt de gekozen dagfilter (of alle dagen).</p>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
            <button
              type="button"
              onClick={() => setSelectedLogDate(null)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedLogDate === null
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-background/60 text-muted-foreground hover:bg-accent'
              }`}
            >
              Alle dagen
            </button>
            {dayKeys.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedLogDate(k)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedLogDate === k
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background/60 text-muted-foreground hover:bg-accent'
                }`}
              >
                {formatPillDate(k)}
              </button>
            ))}
          </div>

          {logLoading ? <p className="mt-4 text-sm text-muted-foreground">Laden…</p> : null}
          {logError ? <p className="mt-4 text-sm text-red-600">{logError}</p> : null}

          {!logLoading && !logError ? (
            <div className="glass-surface mt-4 rounded-2xl p-4 font-mono text-xs leading-relaxed shadow-inner">
              {logLines.length ? (
                <pre className="whitespace-pre-wrap break-words">{logLines.join('\n')}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nog geen logs in deze periode{selectedLogDate ? ` voor ${formatPillDate(selectedLogDate)}` : ''}.
                </p>
              )}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? 'Item'}</DialogTitle>
            <DialogDescription>Preview + details in dezelfde modal-stijl.</DialogDescription>
          </DialogHeader>

          {active && (
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                {!active.url ? (
                  <p className="text-sm text-muted-foreground">Geen URL ingevuld.</p>
                ) : (
                  <div className="space-y-3">
                    {active.kind === 'evidence' ? (
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => window.open(active.url!, '_blank', 'noopener,noreferrer')}>
                          Print / Save as PDF
                        </Button>
                      </div>
                    ) : null}
                    <SmartLinkPreview
                      url={active.url}
                      title={active.title}
                      thumbnailUrl={active.thumbnail_url}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

