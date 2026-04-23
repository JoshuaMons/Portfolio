'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';

import type { TeacherAssignment, PublishStatus } from '@/types/portfolio';
import { revalidatePortfolioContent } from '@/app/admin/revalidate-content';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/slug';
import { writeAuditLog } from '@/lib/audit-log';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type DocentFileRow = {
  id: string;
  title: string;
  updated_at: string;
  mime_type: string | null;
  original_name: string;
};

type FormState = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  tagsCsv: string;
  status: PublishStatus;
  thumbnail_url: string;
  attached_file_id: string;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  description: '',
  url: '',
  tagsCsv: '',
  status: 'draft',
  thumbnail_url: '',
  attached_file_id: '',
};

function tagsFromCsv(csv: string) {
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function AdminTeacherAssignmentsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<TeacherAssignment[]>([]);
  const [teacherFiles, setTeacherFiles] = React.useState<DocentFileRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const supabaseRef = React.useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  React.useEffect(() => {
    supabaseRef.current = createSupabaseBrowserClient();
    if (!supabaseRef.current) {
      setError('Supabase is nog niet geconfigureerd (env vars ontbreken).');
      setIsLoading(false);
    }
  }, []);

  const refresh = React.useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    const [aRes, fRes] = await Promise.all([
      supabase.from('teacher_assignments').select('*').order('updated_at', { ascending: false }),
      supabase.from('files').select('id,title,updated_at,mime_type,original_name').eq('show_for_teacher', true).order('updated_at', { ascending: false }),
    ]);

    if (aRes.error) setError(aRes.error.message);
    setItems((aRes.data as TeacherAssignment[]) ?? []);
    setTeacherFiles(fRes.error ? [] : ((fRes.data as DocentFileRow[]) ?? []));
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function startCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(p: TeacherAssignment) {
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      url: p.url ?? '',
      tagsCsv: (p.tags ?? []).join(', '),
      status: p.status,
      thumbnail_url: p.thumbnail_url ?? '',
      attached_file_id: p.attached_file_id ?? '',
    });
    setOpen(true);
  }

  async function save() {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        description: form.description ?? '',
        url: form.url.trim() || null,
        tags: tagsFromCsv(form.tagsCsv),
        status: form.status,
        thumbnail_url: form.thumbnail_url.trim() || null,
        attached_file_id: form.attached_file_id.trim() || null,
      };

      const { data, error } = await supabase.from('teacher_assignments').upsert(payload).select().single();
      if (error) throw error;
      await writeAuditLog(supabase, {
        action: form.id ? 'update' : 'create',
        entity: 'teacher_assignment',
        entity_id: (data as any)?.id ?? form.id ?? null,
        summary: `${form.id ? 'Bewerkt' : 'Aangemaakt'} docent opdracht: ${payload.title} (${payload.status})`,
      });
      setOpen(false);
      await refresh();
      await revalidatePortfolioContent();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    if (!confirm('Docent opdracht verwijderen?')) return;
    const { error } = await supabase.from('teacher_assignments').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    await writeAuditLog(supabase, { action: 'delete', entity: 'teacher_assignment', entity_id: id, summary: `Verwijderd docent opdracht (${id})` });
    await refresh();
    await revalidatePortfolioContent();
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Docent opdrachten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Opdrachten voor het docentenportaal. Hieronder ook bestanden die voor docenten zijn gezet (via Uploads).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Nieuwe opdracht
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <h2 className="text-base font-semibold">Gedeelde bestanden (docent)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bestanden met vlag “docent” uit <Link href="/admin/uploads" className="font-medium text-primary underline-offset-4 hover:underline">Uploads</Link>. Na upload: Refresh hierboven of wacht op automatische verversing.
        </p>
        <div className="mt-3 grid gap-2">
          {teacherFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen docent-bestanden.</p>
          ) : (
            teacherFiles.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.original_name} · {f.mime_type || '—'}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/uploads?highlight=${f.id}`}>Open in Uploads</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold">Opdrachten</h2>
        <div className="mt-3 grid gap-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Laden…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nog geen opdrachten.</div>
          ) : (
            items.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{p.slug} · {p.status}
                      {p.attached_file_id ? ' · bestand gekoppeld' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => startEdit(p)}>
                      Bewerken
                    </Button>
                    <Button variant="ghost" onClick={() => remove(p.id)}>
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Opdracht bewerken' : 'Nieuwe opdracht'}</DialogTitle>
            <DialogDescription>URL wordt gebruikt voor modal preview. Optioneel: koppel een docent-bestand.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((s) => ({ ...s, title, slug: s.slug ? s.slug : slugify(title) }));
                }}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="url">Website URL</Label>
              <Input id="url" value={form.url} onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))} placeholder="https://…" />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="attached_file_id">Gekoppeld docent-bestand (optioneel)</Label>
              <select
                id="attached_file_id"
                value={form.attached_file_id}
                onChange={(e) => setForm((s) => ({ ...s, attached_file_id: e.target.value }))}
                className="h-10 rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">— geen —</option>
                {teacherFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Alleen bestanden met docent-zichtbaarheid. Upload eerst via Uploads.</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="thumbnail_url">Thumbnail URL (optioneel)</Label>
              <Input id="thumbnail_url" value={form.thumbnail_url} onChange={(e) => setForm((s) => ({ ...s, thumbnail_url: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="tagsCsv">Tags (komma’s)</Label>
              <Input id="tagsCsv" value={form.tagsCsv} onChange={(e) => setForm((s) => ({ ...s, tagsCsv: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as PublishStatus }))}
                className="h-10 rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuleren
            </Button>
            <Button onClick={save} disabled={saving || !form.title.trim()}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
