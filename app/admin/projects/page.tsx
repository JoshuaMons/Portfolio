'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import type { Project, PublishStatus } from '@/types/portfolio';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/slug';
import { writeAuditLog } from '@/lib/audit-log';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type MiniRow = { id: string; title: string; token: string };

type FormState = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  tagsCsv: string;
  status: PublishStatus;
  thumbnail_url: string;
  mini_project_token: string;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  description: '',
  url: '',
  tagsCsv: '',
  status: 'draft',
  thumbnail_url: '',
  mini_project_token: '',
};

function tagsFromCsv(csv: string) {
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function AdminProjectsPage() {
  const [items, setItems] = React.useState<Project[]>([]);
  const [minis, setMinis] = React.useState<MiniRow[]>([]);
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
    const [pRes, mRes] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('mini_projects').select('id,title,token').order('created_at', { ascending: false }),
    ]);

    if (pRes.error) setError(pRes.error.message);
    setItems((pRes.data as Project[]) ?? []);
    setMinis(mRes.error ? [] : ((mRes.data as MiniRow[]) ?? []));
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function startCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(p: Project) {
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      url: p.url ?? '',
      tagsCsv: (p.tags ?? []).join(', '),
      status: p.status,
      thumbnail_url: p.thumbnail_url ?? '',
      mini_project_token: p.mini_project_token ?? '',
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
        mini_project_token: form.mini_project_token.trim() || null,
      };

      const { error } = await supabase.from('projects').upsert(payload).select().single();
      if (error) throw error;
      await writeAuditLog(supabase, {
        action: form.id ? 'update' : 'create',
        entity: 'project',
        entity_id: form.id ?? null,
        summary: `${form.id ? 'Bewerkt' : 'Aangemaakt'}: ${payload.title} (${payload.status})`,
      });
      setOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    if (!confirm('Project verwijderen?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    await writeAuditLog(supabase, { action: 'delete', entity: 'project', entity_id: id, summary: `Verwijderd project (${id})` });
    await refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Projecten</h1>
          <p className="mt-1 text-sm text-muted-foreground">Beheer je portfolio projecten.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Nieuw project
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laden…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nog geen projecten.</div>
        ) : (
          items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /{p.slug} · {p.status}
                    {p.mini_project_token ? ' · mini-site' : ''}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Project bewerken' : 'Nieuw project'}</DialogTitle>
            <DialogDescription>Vul je project info in. URL wordt gebruikt voor de modal preview.</DialogDescription>
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
                placeholder="Bijv. AI project — dashboard"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://…"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="thumbnail_url">Thumbnail URL (optioneel)</Label>
              <Input
                id="thumbnail_url"
                value={form.thumbnail_url}
                onChange={(e) => setForm((s) => ({ ...s, thumbnail_url: e.target.value }))}
                placeholder="Wordt later automatisch gevuld als fallback."
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="mini_project_token">Mini-site (ZIP-import, optioneel)</Label>
              <select
                id="mini_project_token"
                value={form.mini_project_token}
                onChange={(e) => setForm((s) => ({ ...s, mini_project_token: e.target.value }))}
                className="h-10 rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">— geen —</option>
                {minis.map((m) => (
                  <option key={m.id} value={m.token}>
                    {m.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Importeer eerst een ZIP via Uploads. HTML/CSS/JS worden via de server geladen zodat styles werken.</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="tagsCsv">Tags (komma’s)</Label>
              <Input
                id="tagsCsv"
                value={form.tagsCsv}
                onChange={(e) => setForm((s) => ({ ...s, tagsCsv: e.target.value }))}
                placeholder="Next.js, Supabase, UI/UX"
              />
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
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Wat was het doel, jouw rol, gebruikte tech, resultaten…"
              />
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

