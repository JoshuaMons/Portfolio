'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { PublicFilesGallery, type PublicFile } from '@/app/files/files-client';
import { ProjectModalBody } from '@/components/portfolio/project-modal-body';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ProjectsClient({
  initialProjects,
  initialPublicFiles,
  supabaseConfigured,
  viewerIsLoggedIn,
  filesFetchFailed,
  projectsFetchFailed,
}: {
  initialProjects: Project[];
  initialPublicFiles: PublicFile[];
  supabaseConfigured: boolean;
  viewerIsLoggedIn: boolean;
  filesFetchFailed?: boolean;
  projectsFetchFailed?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Project | null>(null);

  return (
    <>
      {!supabaseConfigured && (
        <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Host/URL onbekend of API niet bereikbaar. Controleer deployment en env vars.
        </p>
      )}
      {projectsFetchFailed ? (
        <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Kon projecten niet laden. Controleer `SUPABASE_SERVICE_ROLE_KEY` en of de database-kolommen `show_on_website` /
          `show_for_teacher` bestaan (run `supabase/schema.sql`).
        </p>
      ) : null}

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
              {p.url || p.mini_project_token ? (
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              ) : null}
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
            <ProjectModalBody
              title={active.title}
              description={active.description}
              url={active.url}
              tags={active.tags ?? []}
              thumbnail_url={active.thumbnail_url}
              mini_project_token={active.mini_project_token ?? null}
            />
          )}
        </DialogContent>
      </Dialog>

      {viewerIsLoggedIn ? (
        <section className="mt-16 border-t border-border/60 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Bestanden & uploads</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Zelfde publieke bestanden als op{' '}
                <Link href="/files" className="font-medium text-primary underline-offset-4 hover:underline">
                  /files
                </Link>
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
      ) : null}
    </>
  );
}

