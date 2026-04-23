'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import type { Post, PublishStatus } from '@/types/portfolio';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/slug';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormState = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  status: PublishStatus;
  published_at: string;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  content: '',
  status: 'draft',
  published_at: '',
};

export default function AdminBlogPage() {
  const [items, setItems] = React.useState<Post[]>([]);
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
    const { data, error } = await supabase.from('posts').select('*').order('updated_at', { ascending: false });
    if (error) setError(error.message);
    setItems((data as Post[]) ?? []);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function startCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(p: Post) {
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      status: p.status,
      published_at: p.published_at ? new Date(p.published_at).toISOString().slice(0, 16) : '',
    });
    setOpen(true);
  }

  async function save() {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      const slug = form.slug.trim() || slugify(form.title);
      const payload = {
        id: form.id,
        title: form.title.trim(),
        slug,
        content: form.content ?? '',
        status: form.status,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };

      const { error } = await supabase.from('posts').upsert(payload).select().single();
      if (error) throw error;
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
    if (!confirm('Post verwijderen?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    await refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Logboek</h1>
          <p className="mt-1 text-sm text-muted-foreground">Beheer je posts (draft/published).</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Nieuwe post
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laden…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nog geen posts.</div>
        ) : (
          items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">/{p.slug} · {p.status}</p>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Post bewerken' : 'Nieuwe post'}</DialogTitle>
            <DialogDescription>Dit verschijnt op `/blog` zodra status `published` is.</DialogDescription>
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
              <Label htmlFor="published_at">Published at (optioneel)</Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm((s) => ({ ...s, published_at: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                placeholder="Schrijf je logboek update…"
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

