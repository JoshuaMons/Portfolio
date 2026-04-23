'use client';

import * as React from 'react';
import { ExternalLink, Eye, Link as LinkIcon } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function getThumbnailUrl(url: string) {
  const encoded = encodeURIComponent(url);
  return `https://image.thum.io/get/width/1200/${encoded}`;
}

export function ProjectsClient({
  initialProjects,
  supabaseConfigured,
}: {
  initialProjects: Project[];
  supabaseConfigured: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Project | null>(null);

  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [forceFallback, setForceFallback] = React.useState(false);

  React.useEffect(() => {
    setIframeLoaded(false);
    setForceFallback(false);
  }, [active?.id]);

  const canIframe = Boolean(active?.url) && !forceFallback;

  return (
    <>
      {!supabaseConfigured && (
        <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Supabase is nog niet geconfigureerd. Voeg env vars toe (zie `.env.example`).
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialProjects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setActive(p);
              setOpen(true);
            }}
            className="glass-surface group rounded-3xl p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              </div>
              {p.url && <ExternalLink className="h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />}
            </div>
            {p.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.slice(0, 4).map((t) => (
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? 'Project'}</DialogTitle>
            <DialogDescription>Bekijk details en een live preview zonder de pagina te verlaten.</DialogDescription>
          </DialogHeader>

          {active && (
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                {!active.url ? (
                  <p className="text-sm text-muted-foreground">Geen URL ingevuld voor dit project.</p>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setForceFallback((v) => !v)}
                          title="Als iframe niet werkt, gebruik thumbnail preview."
                        >
                          <Eye className="h-4 w-4" />
                          {canIframe ? 'Gebruik thumbnail' : 'Probeer iframe'}
                        </Button>
                      </div>
                    </div>

                    {canIframe ? (
                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                        {!iframeLoaded && (
                          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
                            <span>Preview laden… (soms blokkeren websites iframe; gebruik dan thumbnail)</span>
                            <Button variant="outline" size="sm" onClick={() => setForceFallback(true)}>
                              Thumbnail tonen
                            </Button>
                          </div>
                        )}
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

