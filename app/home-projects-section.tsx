'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { ProjectModalBody } from '@/components/portfolio/project-modal-body';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type HomeProjectRow = {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
};

export function HomeProjectsSection({
  initialProjects,
  initialNextOffset,
}: {
  initialProjects: HomeProjectRow[];
  initialNextOffset: number | null;
}) {
  const [items, setItems] = React.useState<HomeProjectRow[]>(initialProjects);
  const [nextOffset, setNextOffset] = React.useState<number | null>(initialNextOffset);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalSlug, setModalSlug] = React.useState<string | null>(null);
  const [modalProject, setModalProject] = React.useState<Project | null>(null);
  const [modalLoading, setModalLoading] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  async function loadMore() {
    if (nextOffset == null || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/public?limit=5&offset=${nextOffset}`);
      const json = (await res.json().catch(() => ({}))) as { data?: HomeProjectRow[]; nextOffset?: number | null; error?: string };
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Kon projecten niet laden');
      const chunk = json.data ?? [];
      setItems((prev) => [...prev, ...chunk]);
      setNextOffset(json.nextOffset ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout bij laden');
    } finally {
      setLoading(false);
    }
  }

  async function openProjectModal(slug: string) {
    setModalOpen(true);
    setModalSlug(slug);
    setModalProject(null);
    setModalError(null);
    setModalLoading(true);
    try {
      const res = await fetch(`/api/projects/public/by-slug/${encodeURIComponent(slug)}`);
      const json = (await res.json().catch(() => ({}))) as { project?: Project; error?: string };
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Project laden mislukt');
      if (!json.project) throw new Error('Geen projectdata');
      setModalProject(json.project);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Fout');
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <>
      <div className="mt-3 space-y-2">
        {items.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void openProjectModal(p.slug)}
            className="block w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
          >
            <span className="font-medium">{p.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Klik voor preview (zelfde als projecten-pagina)</span>
          </button>
        ))}
      </div>
      {nextOffset != null ? (
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMore()} disabled={loading}>
            {loading ? 'Laden…' : 'Meer projecten laden'}
          </Button>
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </div>
      ) : null}

      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) {
            setModalProject(null);
            setModalSlug(null);
            setModalError(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{modalProject?.title ?? (modalLoading ? 'Laden…' : 'Project')}</DialogTitle>
            <DialogDescription>
              Preview en samenvatting. Ga voor de volledige projectpagina naar de link hieronder.
            </DialogDescription>
          </DialogHeader>

          {modalLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Project laden…</span>
            </div>
          ) : modalError ? (
            <p className="text-sm text-destructive">{modalError}</p>
          ) : modalProject ? (
            <ProjectModalBody
              title={modalProject.title}
              description={modalProject.description}
              url={modalProject.url}
              tags={modalProject.tags ?? []}
              thumbnail_url={modalProject.thumbnail_url}
              mini_project_token={modalProject.mini_project_token ?? null}
            />
          ) : null}

          {modalSlug && !modalLoading ? (
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button asChild variant="outline" size="sm">
                <Link href={`/projects/${encodeURIComponent(modalSlug)}`}>Volledige projectpagina →</Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Sluiten
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
