'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { PublicFilesGallery, type PublicFile } from '@/app/files/files-client';
import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProjectsClient({
  initialProjects,
  initialPublicFiles,
  supabaseConfigured,
  filesFetchFailed,
}: {
  initialProjects: Project[];
  initialPublicFiles: PublicFile[];
  supabaseConfigured: boolean;
  filesFetchFailed?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Project | null>(null);

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
                  <SmartLinkPreview url={active.url} title={active.title} thumbnailUrl={active.thumbnail_url} />
                )}
              </TabsContent>

              <TabsContent value="details">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <section className="mt-16 border-t border-border/60 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Bestanden & uploads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Zelfde publieke bestanden als op <Link href="/files" className="font-medium text-primary underline-offset-4 hover:underline">/files</Link>
              , direct onder je projecten.
            </p>
          </div>
        </div>
        {filesFetchFailed ? (
          <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
            Kon uploads niet laden. Controleer `SUPABASE_SERVICE_ROLE_KEY` op de server.
          </p>
        ) : initialPublicFiles.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Nog geen bestanden met website-zichtbaarheid.</p>
        ) : (
          <PublicFilesGallery files={initialPublicFiles} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
        )}
      </section>
    </>
  );
}

