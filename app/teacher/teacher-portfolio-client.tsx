'use client';

import * as React from 'react';
import { Download, ExternalLink, FileText, Film, Image as ImageIcon } from 'lucide-react';

import type { Project, TeacherAssignment } from '@/types/portfolio';
import type { AuditLogRow } from '@/lib/teacher-audit-log';
import { amsterdamDatesWithLogsDesc, filterLogsByAmsterdamDate, formatLogLine } from '@/lib/teacher-audit-log';
import { Button } from '@/components/ui/button';
import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Item = {
  kind: 'evidence' | 'project' | 'assignment';
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url: string | null;
};

type TeacherFileRow = {
  id: string;
  title: string;
  description: string;
  original_name: string;
  mime_type: string | null;
  signed_url: string | null;
};

type Section = 'projects' | 'assignments' | 'logbook';

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

function fileKind(mime: string | null, name: string) {
  const m = (mime ?? '').toLowerCase();
  const n = name.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  return 'file';
}

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'projects', label: 'Projecten' },
  { id: 'assignments', label: 'Docent opdrachten' },
  { id: 'logbook', label: 'Logboek' },
];

export function TeacherPortfolioClient({ projects }: { projects: Project[] }) {
  const [section, setSection] = React.useState<Section>('projects');

  const [assignments, setAssignments] = React.useState<TeacherAssignment[]>([]);
  const [teacherFiles, setTeacherFiles] = React.useState<TeacherFileRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [auditLogs, setAuditLogs] = React.useState<AuditLogRow[]>([]);
  const [logLoading, setLogLoading] = React.useState(false);
  const [logError, setLogError] = React.useState<string | null>(null);
  const [logFetched, setLogFetched] = React.useState(false);
  const [selectedLogDate, setSelectedLogDate] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const daysWithLogs = React.useMemo(() => amsterdamDatesWithLogsDesc(auditLogs), [auditLogs]);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Item | null>(null);
  const [fileOpen, setFileOpen] = React.useState(false);
  const [activeFile, setActiveFile] = React.useState<TeacherFileRow | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [aRes, fRes] = await Promise.all([fetch('/api/teacher/assignments'), fetch('/api/teacher/files')]);
        const aJson = await aRes.json().catch(() => ({}));
        if (!aRes.ok) throw new Error(aJson?.error || 'Laden mislukt');
        setAssignments((aJson?.data as TeacherAssignment[]) ?? []);

        if (fRes.ok) {
          const fJson = await fRes.json().catch(() => ({}));
          setTeacherFiles((fJson?.data as TeacherFileRow[]) ?? []);
        } else {
          setTeacherFiles([]);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function goSection(s: Section) {
    setSection(s);
    if (s === 'logbook' && !logFetched) void fetchAuditLogs();
  }

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

  function openTeacherFile(row: TeacherFileRow) {
    setActiveFile(row);
    setFileOpen(true);
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

  function TeacherFilesGrid() {
    if (teacherFiles.length === 0) return null;
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Gedeelde bestanden</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bestanden die de beheerder specifiek voor docenten heeft gedeeld.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teacherFiles.map((f) => {
            const k = fileKind(f.mime_type, f.original_name);
            const Icon = k === 'image' ? ImageIcon : k === 'video' ? Film : FileText;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => openTeacherFile(f)}
                className="glass-surface group rounded-3xl p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{f.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
                </div>
                <p className="mt-4 truncate text-xs text-muted-foreground">{f.original_name}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-surface rounded-3xl p-6 shadow-card">
        <h1 className="text-2xl font-semibold">Docenten view</h1>
        <p className="mt-1 text-sm text-muted-foreground">Portfolio, opdrachten, gedeelde bestanden en logboek.</p>
      </div>

      <nav className="mt-8 flex flex-wrap gap-1 border-b border-border/50" aria-label="Secties">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => goSection(id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors',
              section === id
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {section === 'projects' ? (
        <div>
          <Grid items={[evidenceItem, ...projectItems]} />
          <TeacherFilesGrid />
        </div>
      ) : null}

      {section === 'assignments' ? (
        <div>
          {loading ? <p className="mt-6 text-sm text-muted-foreground">Laden…</p> : null}
          {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
          {!loading && !error ? <Grid items={assignmentItems} /> : null}
        </div>
      ) : null}

      {section === 'logbook' ? (
        <div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void exportLogbook()}
              disabled={exporting || logLoading}
            >
              {exporting ? 'Exporteren…' : 'Exporteer Word'}
            </Button>
            <p className="text-xs text-muted-foreground">Export volgt de gekozen dagfilter (of alle dagen).</p>
          </div>

          {logLoading ? <p className="mt-4 text-sm text-muted-foreground">Logboek laden…</p> : null}
          {logError ? <p className="mt-4 text-sm text-red-600">{logError}</p> : null}

          {!logLoading && !logError && logFetched ? (
            <>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
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
                    Nog geen activiteit in deze periode
                    {selectedLogDate ? ` op ${formatPillDate(selectedLogDate)}` : ''}.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

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
                    <SmartLinkPreview url={active.url} title={active.title} thumbnailUrl={active.thumbnail_url} />
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

      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{activeFile?.title ?? 'Bestand'}</DialogTitle>
            <DialogDescription>Download of bekijk via een tijdelijke link.</DialogDescription>
          </DialogHeader>

          {activeFile && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">{activeFile.original_name}</p>
                {activeFile.signed_url ? (
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <a href={activeFile.signed_url} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                ) : null}
              </div>
              {activeFile.signed_url ? (
                <SmartLinkPreview url={activeFile.signed_url} title={activeFile.title} />
              ) : (
                <p className="text-sm text-muted-foreground">Geen preview-link beschikbaar.</p>
              )}
              {activeFile.description ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{activeFile.description}</p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
