'use client';

import * as React from 'react';
import { Plus, RefreshCw, UploadCloud } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit-log';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Visibility = 'private' | 'public';

type FileRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  tagsCsv: string;
  visibility: Visibility;
  file?: File | null;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  tagsCsv: '',
  visibility: 'private',
  file: null,
};

function tagsFromCsv(csv: string) {
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function AdminUploadsPage() {
  const [items, setItems] = React.useState<FileRow[]>([]);
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
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) setError(error.message);
    setItems((data as FileRow[]) ?? []);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function startCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(row: FileRow) {
    setForm({
      id: row.id,
      title: row.title,
      description: row.description,
      tagsCsv: (row.tags ?? []).join(', '),
      visibility: row.visibility,
      file: null,
    });
    setOpen(true);
  }

  async function save() {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData.user?.id;
      if (!ownerId) throw new Error('Niet ingelogd.');

      const tags = tagsFromCsv(form.tagsCsv);

      // Edit metadata only
      if (form.id) {
        const { data, error } = await supabase
          .from('files')
          .update({
            title: form.title.trim(),
            description: form.description ?? '',
            tags,
            visibility: form.visibility,
          })
          .eq('id', form.id)
          .select()
          .single();
        if (error) throw error;
        await writeAuditLog(supabase, {
          action: 'update',
          entity: 'file',
          entity_id: (data as any)?.id ?? form.id,
          summary: `File bijgewerkt: ${form.title.trim()} (${form.visibility})`,
        });
        setOpen(false);
        await refresh();
        return;
      }

      // Create + upload required
      if (!form.file) throw new Error('Kies een bestand om te uploaden.');
      const file = form.file;

      const fileId = crypto.randomUUID();
      const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
      const storagePath = `owner/${ownerId}/${fileId}/${safeName}`;

      const upload = await supabase.storage.from('uploads').upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upload.error) throw upload.error;

      const { data, error } = await supabase
        .from('files')
        .insert({
          id: fileId,
          owner_id: ownerId,
          title: form.title.trim() || file.name,
          description: form.description ?? '',
          tags,
          storage_path: storagePath,
          original_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          visibility: form.visibility,
        })
        .select()
        .single();
      if (error) throw error;

      await writeAuditLog(supabase, {
        action: 'create',
        entity: 'file',
        entity_id: (data as any)?.id ?? fileId,
        summary: `File geüpload: ${form.title.trim() || file.name} (${form.visibility})`,
      });

      setOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: FileRow) {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    if (!confirm('Bestand verwijderen?')) return;
    setError(null);
    try {
      const del = await supabase.from('files').delete().eq('id', row.id);
      if (del.error) throw del.error;
      // try delete from storage too (best effort)
      await supabase.storage.from('uploads').remove([row.storage_path]);
      await writeAuditLog(supabase, {
        action: 'delete',
        entity: 'file',
        entity_id: row.id,
        summary: `File verwijderd: ${row.title}`,
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Verwijderen mislukt.');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Uploads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload bestanden naar Supabase Storage. Zet op <span className="font-semibold">public</span> om ze op de site te tonen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen uploads.</p>
        ) : (
          items.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {row.original_name} · {row.visibility} · {row.mime_type || 'unknown'} ·{' '}
                    {row.size_bytes ? `${Math.round(row.size_bytes / 1024)} KB` : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => startEdit(row)}>
                    Bewerken
                  </Button>
                  <Button variant="ghost" onClick={() => remove(row)}>
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
            <DialogTitle>{form.id ? 'Upload bewerken' : 'Nieuw bestand uploaden'}</DialogTitle>
            <DialogDescription>
              Ondersteunt algemene bestanden (Word/Excel/PPT/foto/video/db/csv/etc.).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {!form.id && (
              <label className="glass-surface flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Kies bestand</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {form.file ? form.file.name : 'Klik om te kiezen'}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => setForm((s) => ({ ...s, file: e.target.files?.[0] ?? null, title: s.title || (e.target.files?.[0]?.name ?? '') }))}
                />
              </label>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="visibility">Zichtbaarheid</Label>
              <select
                id="visibility"
                value={form.visibility}
                onChange={(e) => setForm((s) => ({ ...s, visibility: e.target.value as Visibility }))}
                className="h-10 rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="private">private</option>
                <option value="public">public</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="tagsCsv">Tags (komma’s)</Label>
              <Input id="tagsCsv" value={form.tagsCsv} onChange={(e) => setForm((s) => ({ ...s, tagsCsv: e.target.value }))} />
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
            <Button onClick={save} disabled={saving || !form.title.trim() || (!form.id && !form.file)}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

