'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { ProjectModalBody } from '@/components/portfolio/project-modal-body';
import { Button } from '@/components/ui/button';

export function ProjectDetailClient({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div className="glass-surface rounded-3xl p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">{project.title}</h1>
        {project.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Samenvatting</h2>
          <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">{project.description || '—'}</p>
        </div>

        {project.url || project.mini_project_token ? (
          <div className="mt-8 border-t border-border/60 pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Voorbeeld & live preview</h2>
              {project.url ? (
                <Button asChild variant="outline" size="sm" className="w-fit shrink-0">
                  <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                    Live in nieuw tabblad <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
            <div className="mt-4">
              <ProjectModalBody
                variant="page"
                title={project.title}
                description={project.description}
                url={project.url}
                tags={project.tags ?? []}
                thumbnail_url={project.thumbnail_url}
                mini_project_token={project.mini_project_token ?? null}
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Er is nog geen externe URL of mini-site gekoppeld voor een live voorbeeld.</p>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Button asChild variant="link" className="h-auto p-0 text-xs">
          <Link href="/projects">← Alle projecten</Link>
        </Button>
      </p>
    </div>
  );
}
