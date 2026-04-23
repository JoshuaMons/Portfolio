'use client';

import * as React from 'react';
import { ExternalLink, Eye, Link as LinkIcon } from 'lucide-react';

import type { Project, TeacherAssignment } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
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

function getThumbnailUrl(url: string) {
  const encoded = encodeURIComponent(url);
  return `https://image.thum.io/get/width/1200/${encoded}`;
}

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

export function TeacherPortfolioClient({ projects }: { projects: Project[] }) {
  const [assignments, setAssignments] = React.useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Item | null>(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [forceFallback, setForceFallback] = React.useState(false);

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

  React.useEffect(() => {
    setIframeLoaded(false);
    setForceFallback(false);
  }, [active?.title]);

  const canIframe = Boolean(active?.url) && !forceFallback;

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

      <Tabs defaultValue="projects" className="mt-6">
        <TabsList>
          <TabsTrigger value="projects">Projecten</TabsTrigger>
          <TabsTrigger value="assignments">Docent opdrachten</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Grid items={[evidenceItem, ...projectItems]} />
        </TabsContent>

        <TabsContent value="assignments">
          {loading ? <p className="mt-6 text-sm text-muted-foreground">Laden…</p> : null}
          {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
          {!loading && !error ? <Grid items={assignmentItems} /> : null}
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span className="truncate">{active.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={active.url} target="_blank" rel="noreferrer">
                            Open in nieuw tabblad
                          </a>
                        </Button>
                        {active.kind === 'evidence' ? (
                          <Button variant="outline" size="sm" onClick={() => window.open(active.url!, '_blank', 'noopener,noreferrer')}>
                            Print / Save as PDF
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => setForceFallback((v) => !v)}>
                          <Eye className="h-4 w-4" />
                          {canIframe ? 'Gebruik thumbnail' : 'Probeer iframe'}
                        </Button>
                      </div>
                    </div>

                    {active.kind === 'evidence' || canIframe ? (
                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                        {active.kind !== 'evidence' && !iframeLoaded ? (
                          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
                            <span>Preview laden…</span>
                            <Button variant="outline" size="sm" onClick={() => setForceFallback(true)}>
                              Thumbnail tonen
                            </Button>
                          </div>
                        ) : null}
                        <iframe
                          src={active.url}
                          title={`Preview: ${active.title}`}
                          className="h-[60vh] w-full"
                          onLoad={() => setIframeLoaded(true)}
                        />
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                        <img
                          src={active.thumbnail_url || getThumbnailUrl(active.url)}
                          alt={`Thumbnail: ${active.title}`}
                          className="h-[60vh] w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
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

