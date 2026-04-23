'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderArchive, Plus, RefreshCw, UploadCloud } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit-log';
import { deleteFileOrMiniBundle } from '@/app/admin/delete-upload-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { revalidateAfterFileChange } from './actions';

type Placement = 'admin' | 'website' | 'teacher' | 'both';

type FileRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: 'private' | 'public';
  show_on_website?: boolean | null;
  show_for_teacher?: boolean | null;
  mini_project_id?: string | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  tagsCsv: string;
  placement: Placement;
  file?: File | null;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  tagsCsv: '',
  placement: 'admin',
  file: null,
};

function tagsFromCsv(csv: string) {
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function placementFromRow(row: FileRow): Placement {
  const w = Boolean(row.show_on_website);
  const t = Boolean(row.show_for_teacher);
  if (w && t) return 'both';
  if (w) return 'website';
  if (t) return 'teacher';
  return 'admin';
}

function flagsFromPlacement(p: Placement) {
  const show_on_website = p === 'website' || p === 'both';
  const show_for_teacher = p === 'teacher' || p === 'both';
  const visibility: 'private' | 'public' = show_on_website ? 'public' : 'private';
  return { show_on_website, show_for_teacher, visibility };
}

function placementLabel(p: Placement) {
  switch (p) {
    case 'admin':
      return 'Alleen admin';
    case 'website':
      return 'Website';
    case 'teacher':
      return 'Docent';
    case 'both':
      return 'Website + docent';
    default:
      return '';
  }
}

function AdminUploadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [items, setItems] = React.useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const [zipTitle, setZipTitle] = React.useState('');
  const [zipFile, setZipFile] = React.useState<File | null>(null);
  const [zipWeb, setZipWeb] = React.useState(false);
  const [zipTeach, setZipTeach] = React.useState(true);
  const [zipBusy, setZipBusy] = React.useState(false);

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
    const { data, error } = await supabase.from('files').select('*').order('updated_at', { ascending: false });

    if (error) setError(error.message);
    setItems((data as FileRow[]) ?? []);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`upload-row-${highlightId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, items]);

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
      placement: placementFromRow(row),
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
      const { show_on_website, show_for_teacher, visibility } = flagsFromPlacement(form.placement);

      if (form.id) {
        const { data, error } = await supabase
          .from('files')
          .update({
            title: form.title.trim(),
            description: form.description ?? '',
            tags,
            visibility,
            show_on_website,
            show_for_teacher,
          })
          .eq('id', form.id)
          .select()
          .single();
        if (error) throw error;
        await writeAuditLog(supabase, {
          action: 'update',
          entity: 'file',
          entity_id: (data as any)?.id ?? form.id,
          summary: `File bijgewerkt: ${form.title.trim()} (${form.placement})`,
        });
        setOpen(false);
        await refresh();
        await revalidateAfterFileChange();
        router.refresh();
        return;
      }

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
          visibility,
          show_on_website,
          show_for_teacher,
        })
        .select()
        .single();
      if (error) throw error;

      await writeAuditLog(supabase, {
        action: 'create',
        entity: 'file',
        entity_id: (data as any)?.id ?? fileId,
        summary: `File geüpload: ${form.title.trim() || file.name} (${form.placement})`,
      });

      setOpen(false);
      await refresh();
      await revalidateAfterFileChange();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function importMiniZip() {
    if (!zipTitle.trim() || !zipFile) {
      setError('Vul een titel in en kies een .zip met index.html in de map.');
      return;
    }
    setZipBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('title', zipTitle.trim());
      fd.append('file', zipFile);
      fd.append('show_on_website', zipWeb ? 'true' : 'false');
      fd.append('show_for_teacher', zipTeach ? 'true' : 'false');
      const res = await fetch('/api/admin/mini-project', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'ZIP-import mislukt');
      setZipTitle('');
      setZipFile(null);
      await refresh();
      await revalidateAfterFileChange();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'ZIP-import mislukt');
    } finally {
      setZipBusy(false);
    }
  }

  async function remove(row: FileRow) {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    if (!confirm(row.mini_project_id ? 'Mini-project en registratie verwijderen?' : 'Bestand verwijderen?')) return;
    setError(null);
    try {
      if (row.mini_project_id) {
        const res = await deleteFileOrMiniBundle(row.id);
        if (!res.ok) throw new Error(res.error);
        await writeAuditLog(supabase, {
          action: 'delete',
          entity: 'file',
          entity_id: row.id,
          summary: `Mini-project verwijderd: ${row.title}`,
        });
      } else {
        const del = await supabase.from('files').delete().eq('id', row.id);
        if (del.error) throw del.error;
        await supabase.storage.from('uploads').remove([row.storage_path]);
        await writeAuditLog(supabase, {
          action: 'delete',
          entity: 'file',
          entity_id: row.id,
          summary: `File verwijderd: ${row.title}`,
        });
      }
      await refresh();
      await revalidateAfterFileChange();
      router.refresh();
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
            Kies waar een bestand zichtbaar is: alleen voor jou, op de publieke bestandenpagina, voor het docentenportaal, of combinaties.
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
            <div
              key={row.id}
              id={`upload-row-${row.id}`}
              className={`rounded-2xl border border-border/60 bg-background/50 p-4 ${highlightId === row.id ? 'ring-2 ring-primary/50' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {row.original_name} · {row.mime_type || 'unknown'} ·{' '}
                    {row.size_bytes ? `${Math.round(row.size_bytes / 1024)} KB` : '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.mini_project_id ? (
                      <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-medium text-primary">Mini-ZIP</span>
                    ) : null}
                    {Boolean(row.show_on_website) ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">Website</span>
                    ) : null}
                    {Boolean(row.show_for_teacher) ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">Docent</span>
                    ) : null}
                    {!Boolean(row.show_on_website) && !Boolean(row.show_for_teacher) ? (
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">Alleen admin</span>
                    ) : null}
                  </div>
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

      <div className="mt-10 rounded-3xl border border-border/60 bg-background/40 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderArchive className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Mini-project (ZIP)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload een map als .zip met een <span className="font-medium">index.html</span> (plus css/js/assets). De site wordt via de server
              uitgeserveerd zodat styles en scripts werken in modals. Koppel daarna het project onder{' '}
              <span className="font-medium">Projecten → mini-site</span>.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="zipTitle">Titel</Label>
                <Input id="zipTitle" value={zipTitle} onChange={(e) => setZipTitle(e.target.value)} placeholder="Bijv. Dashboard prototype" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="zipFile">ZIP-bestand</Label>
                <Input id="zipFile" type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={zipWeb} onChange={(e) => setZipWeb(e.target.checked)} />
                Publiek via website (iframe op projectpagina)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={zipTeach} onChange={(e) => setZipTeach(e.target.checked)} />
                Docentenportaal (modal)
              </label>
            </div>
            <Button type="button" className="mt-4" disabled={zipBusy} onClick={() => void importMiniZip()}>
              {zipBusy ? 'Importeren…' : 'ZIP importeren'}
            </Button>
          </div>
        </div>
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
                  onChange={(e) =>
                    setForm((s) => ({ ...s, file: e.target.files?.[0] ?? null, title: s.title || (e.target.files?.[0]?.name ?? '') }))
                  }
                />
              </label>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="placement">Waar tonen?</Label>
              <select
                id="placement"
                value={form.placement}
                onChange={(e) => setForm((s) => ({ ...s, placement: e.target.value as Placement }))}
                className="h-10 rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="admin">Alleen admin (privé)</option>
                <option value="website">Publieke website (/files)</option>
                <option value="teacher">Alleen docentenportaal</option>
                <option value="both">Website én docentenportaal</option>
              </select>
              <p className="text-xs text-muted-foreground">Huidige keuze: {placementLabel(form.placement)}</p>
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

export default function AdminUploadsPage() {
  return (
    <React.Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Laden…</p>}>
      <AdminUploadsPageContent />
    </React.Suspense>
  );
}
