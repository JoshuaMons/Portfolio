'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

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

  return (
    <>
      <div className="mt-3 space-y-2">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.slug}`}
            className="block rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm hover:bg-accent"
          >
            {p.title}
          </Link>
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
    </>
  );
}
