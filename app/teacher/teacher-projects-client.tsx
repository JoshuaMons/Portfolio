'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, FolderKanban } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TeacherFileRow = {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  mime_type: string | null;
  original_name: string | null;
  updated_at: string;
  signed_url: string | null;
  mini_project_token?: string | null;
};

type Item = {
  kind: 'evidence' | 'project' | 'file';
  key: string;
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url: string | null;
  mini_project_token: string | null;
  updated_at: string;
  mime_type?: string | null;
  original_name?: string | null;
};

function toProjectItem(p: Project): Item {
  return {
    kind: 'project',
    key: `project:${p.id}`,
    title: p.title,
    description: p.description,
    url: p.url,
    tags: p.tags ?? [],
    thumbnail_url: p.thumbnail_url,
    mini_project_token: p.mini_project_token ?? null,
    updated_at: p.updated_at,
  };
}

function toFileItem(r: TeacherFileRow): Item {
  return {
    kind: 'file',
    key: `file:${r.id}`,
    title: r.title,
    description: r.description ?? '',
    url: r.signed_url,
    tags: r.tags ?? [],
    thumbnail_url: null,
    mini_project_token: r.mini_project_token ?? null,
    updated_at: r.updated_at,
    mime_type: r.mime_type,
    original_name: r.original_name,
  };
}

const evidenceItem: Item = {
  kind: 'evidence',
  key: 'evidence:doc',
  title: 'Projectdocumentatie (bewijs)',
  description:
    'Samenvatting van prompts → wat er gebouwd is, met verwijzingen naar code en testplan. Print / Save as PDF.',
  url: '/teacher/evidence',
  tags: ['bewijs', 'documentatie', 'samenvatting'],
  thumbnail_url: null,
  mini_project_token: null,
  updated_at: '',
};

export function TeacherProjectsClient({ projects }: { projects: Project[] }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Item | null>(null);
  const [files, setFiles] = React.useState<TeacherFileRow[]>([]);
  const [filesLoading, setFilesLoading] = React.useState(true);
  const [filesError, setFilesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/teacher/files');
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setFilesError(typeof json.error === 'string' ? json.error : 'Bestanden laden mislukt');
          return;
        }
        if (!cancelled) setFiles((json.data as TeacherFileRow[]) ?? []);
      } catch {
        if (!cancelled) setFilesError('Netwerkfout bij bestanden');
      } finally {
        if (!cancelled) setFilesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openItem(item: Item) {
    setActive(item);
    setOpen(true);
  }

  const projectItems = projects.map(toProjectItem);
  const fileItems = files.map(toFileItem);
  const merged = [...projectItems, ...fileItems].sort((a, b) =>
    (b.updated_at || '').localeCompare(a.updated_at || '')
  );
  const gridItems = [evidenceItem, ...merged];

  const miniSrc =
    active?.mini_project_token != null
      ? `/api/mini-project/${active.mini_project_token}/index.html`
      : null;

  const isImage = active?.mime_type?.startsWith('image/');
  const isPdf = active?.mime_type === 'application/pdf';

  return (
    <>
      <div className="glass-surface rounded-3xl p-6 shadow-card">
        <h1 className="text-2xl font-semibold">Docentenportaal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gepubliceerde <strong>projecten</strong> en <strong>gedeelde bestanden</strong> staan hier hetzelfde als kaarten; open iets voor preview of download. Voor het technische logboek:{' '}
          <Link href="/teacher/logbook" className="font-medium text-primary underline-offset-4 hover:underline">
            Logboek
          </Link>
          .
        </p>
        {filesError ? <p className="mt-2 text-xs text-destructive">{filesError}</p> : null}
        {filesLoading ? <p className="mt-2 text-xs text-muted-foreground">Bestanden laden…</p> : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gridItems.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => openItem(it)}
            className="glass-surface group rounded-3xl p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {it.kind === 'file' ? (
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : it.kind === 'evidence' ? (
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold">{it.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>
                </div>
              </div>
              {it.url || it.mini_project_token ? (
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
              ) : null}
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
            <p className="mt-3 text-[10px] text-muted-foreground">
              {it.kind === 'file'
                ? 'Gedeeld bestand'
                : it.kind === 'evidence'
                  ? 'Interne pagina'
                  : it.mini_project_token
                    ? 'Project · bevat mini-site (HTML/CSS/JS)'
                    : 'Project'}
            </p>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? 'Item'}</DialogTitle>
            <DialogDescription>
              {active?.kind === 'file' ? 'Download of bekijk het gedeelde bestand.' : 'Externe link, mini-site, of beide.'}
            </DialogDescription>
          </DialogHeader>

          {active && (
            <>
              {active.kind === 'file' && active.mini_project_token && active.url ? (
                <Tabs defaultValue="mini">
                  <TabsList>
                    <TabsTrigger value="mini">Mini-site</TabsTrigger>
                    <TabsTrigger value="download">Bestand / download</TabsTrigger>
                  </TabsList>
                  <TabsContent value="mini" className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                      <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                    </div>
                  </TabsContent>
                  <TabsContent value="download" className="mt-4 space-y-3">
                    {renderFilePreview(active, isImage, isPdf)}
                  </TabsContent>
                </Tabs>
              ) : active.kind === 'file' && active.mini_project_token ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                </div>
              ) : active.kind === 'file' ? (
                <div className="mt-4 space-y-3">{renderFilePreview(active, isImage, isPdf)}</div>
              ) : active.mini_project_token && active.url ? (
                <Tabs defaultValue="extern">
                  <TabsList>
                    <TabsTrigger value="extern">Externe preview</TabsTrigger>
                    <TabsTrigger value="mini">Mini-site (lokaal)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="extern" className="mt-4">
                    <SmartLinkPreview url={active.url} title={active.title} thumbnailUrl={active.thumbnail_url} />
                  </TabsContent>
                  <TabsContent value="mini" className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                      <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : active.mini_project_token ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                </div>
              ) : active.url ? (
                <div className="mt-4 space-y-3">
                  {active.kind === 'evidence' ? (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => window.open(active.url!, '_blank', 'noopener,noreferrer')}>
                        Print / Save as PDF
                      </Button>
                    </div>
                  ) : null}
                  <SmartLinkPreview url={active.url} title={active.title} thumbnailUrl={active.thumbnail_url} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Geen preview beschikbaar.</p>
              )}

              {active.original_name ? (
                <p className="mt-2 text-xs text-muted-foreground">Bestandsnaam: {active.original_name}</p>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function renderFilePreview(active: Item, isImage: boolean | undefined, isPdf: boolean | undefined) {
  if (!active.url) {
    return <p className="text-sm text-muted-foreground">Geen downloadlink beschikbaar.</p>;
  }
  return (
    <>
      {isImage ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.url} alt={active.title} className="mx-auto max-h-[60vh] w-auto max-w-full object-contain" />
        </div>
      ) : null}
      {isPdf ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <iframe title="PDF" src={active.url} className="h-[72vh] w-full bg-white" />
        </div>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="default" size="sm" asChild>
          <a href={active.url} target="_blank" rel="noopener noreferrer">
            Openen in nieuw tabblad
          </a>
        </Button>
      </div>
    </>
  );
}
