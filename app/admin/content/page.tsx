'use client';

import * as React from 'react';
import Link from 'next/link';

import type { Project, TeacherAssignment } from '@/types/portfolio';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FileRow = {
  id: string;
  title: string;
  updated_at: string;
  show_on_website?: boolean | null;
  show_for_teacher?: boolean | null;
  visibility?: string;
};

type Filter = 'all' | 'docent' | 'web';

type Unified =
  | { kind: 'project'; id: string; title: string; subtitle: string; href: string; updated_at: string }
  | { kind: 'assignment'; id: string; title: string; subtitle: string; href: string; updated_at: string }
  | { kind: 'file'; id: string; title: string; subtitle: string; href: string; updated_at: string };

function rowInDocent(r: Unified): boolean {
  if (r.kind === 'assignment') return true;
  if (r.kind === 'file') return Boolean(r.subtitle.includes('docent'));
  if (r.kind === 'project') return r.subtitle.includes('published');
  return false;
}

function rowInWeb(r: Unified): boolean {
  if (r.kind === 'file') return r.subtitle.includes('website');
  if (r.kind === 'project') return r.subtitle.includes('published');
  return false;
}

function passes(r: Unified, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'docent') return rowInDocent(r);
  if (f === 'web') return rowInWeb(r);
  return true;
}

export default function AdminContentPage() {
  const [filter, setFilter] = React.useState<Filter>('all');
  const [rows, setRows] = React.useState<Unified[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const supabaseRef = React.useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  React.useEffect(() => {
    supabaseRef.current = createSupabaseBrowserClient();
  }, []);

  const refresh = React.useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [pr, ar, fr] = await Promise.all([
        supabase.from('projects').select('*').order('updated_at', { ascending: false }),
        supabase.from('teacher_assignments').select('*').order('updated_at', { ascending: false }),
        supabase.from('files').select('id,title,updated_at,show_on_website,show_for_teacher,visibility').order('updated_at', { ascending: false }),
      ]);
      if (pr.error) throw pr.error;
      if (ar.error) throw ar.error;
      if (fr.error) throw fr.error;

      const projects = (pr.data as Project[]) ?? [];
      const assigns = (ar.data as TeacherAssignment[]) ?? [];
      const files = (fr.data as FileRow[]) ?? [];

      const out: Unified[] = [];

      for (const p of projects) {
        out.push({
          kind: 'project',
          id: p.id,
          title: p.title,
          subtitle: `project · ${p.status}`,
          href: '/admin/projects',
          updated_at: p.updated_at,
        });
      }
      for (const a of assigns) {
        out.push({
          kind: 'assignment',
          id: a.id,
          title: a.title,
          subtitle: `docent-opdracht · ${a.status}`,
          href: '/admin/teacher-assignments',
          updated_at: a.updated_at,
        });
      }
      for (const f of files) {
        const flags: string[] = [];
        if (f.show_on_website) flags.push('website');
        if (f.show_for_teacher) flags.push('docent');
        if (!flags.length) flags.push('alleen-admin');
        out.push({
          kind: 'file',
          id: f.id,
          title: f.title,
          subtitle: `bestand · ${flags.join(' + ')}`,
          href: '/admin/uploads',
          updated_at: f.updated_at,
        });
      }

      out.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      setRows(out);
    } catch (e: any) {
      setError(e?.message ?? 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => rows.filter((r) => passes(r, filter)), [rows, filter]);

  const tabs: { id: Filter; label: string; hint: string }[] = [
    { id: 'all', label: 'Alles', hint: 'Projecten, docent-opdrachten en uploads' },
    { id: 'docent', label: 'Docent', hint: 'Wat het docentenportaal raakt (published projecten, docent-opdrachten, bestanden met docent-vlag)' },
    { id: 'web', label: 'Website', hint: 'Publiek zichtbaar (published projecten, bestanden met website-vlag)' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold">Alle content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Één overzicht van alles wat je beheert. Filter op docentgerichte inhoud of alleen wat op de publieke site hoort.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={filter === t.id ? 'default' : 'outline'}
            onClick={() => setFilter(t.id)}
            className={cn(filter === t.id && 'shadow-sm')}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{tabs.find((x) => x.id === filter)?.hint}</p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen items voor dit filter.</p>
        ) : (
          filtered.map((r) => (
            <div key={`${r.kind}:${r.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={r.href}>Open</Link>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
