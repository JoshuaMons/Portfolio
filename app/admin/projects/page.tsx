'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';

import type { Project, PublishStatus } from '@/types/portfolio';
import { revalidatePortfolioContent } from '@/app/admin/revalidate-content';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/slug';
import { writeAuditLog } from '@/lib/audit-log';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type MiniRow = { id: string; title: string; token: string };

type PickerFile = { id: string; title: string; original_name: string };

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
  linkedFileId: string;
  uploadFile: File | null;
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
  linkedFileId: '',
  uploadFile: null,
};

function tagsFromCsv(csv: string) {
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function streamFileIdFromUrl(u: string): string {
  const m = u.trim().match(/\/api\/files\/stream\/([0-9a-f-]{36})/i);
  return m?.[1] ?? '';
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<Project[]>([]);
  const [minis, setMinis] = React.useState<MiniRow[]>([]);
  const [pickerFiles, setPickerFiles] = React.useState<PickerFile[]>([]);
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
    const [pRes, mRes, fRes] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('mini_projects').select('id,title,token').order('created_at', { ascending: false }),
      supabase.from('files').select('id,title,original_name').order('updated_at', { ascending: false }),
    ]);

    if (pRes.error) setError(pRes.error.message);
    setItems((pRes.data as Project[]) ?? []);
    setMinis(mRes.error ? [] : ((mRes.data as MiniRow[]) ?? []));
    setPickerFiles(fRes.error ? [] : ((fRes.data as PickerFile[]) ?? []));
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function startCreate() {
    setForm({ ...emptyForm });
    setOpen(true);
  }

  function startEdit(p: Project) {
    const streamId = streamFileIdFromUrl(p.url ?? '');
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
      linkedFileId: streamId,
      uploadFile: null,
    });
    setOpen(true);
  }

  const canAttemptSave =
    Boolean(form.title.trim()) ||
    Boolean(form.uploadFile) ||
    Boolean(form.linkedFileId) ||
    Boolean(form.mini_project_token.trim());

  async function save() {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSaving(true);
    setError(null);

    let uploadedPath: string | null = null;
    let uploadedFileId: string | null = null;

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const ownerId = userData.user?.id;
      if (!ownerId) throw new Error('Niet ingelogd.');

      let streamFileId: string | null = null;

      if (form.uploadFile) {
        const file = form.uploadFile;
        const fileId = crypto.randomUUID();
        const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
        const storagePath = `owner/${ownerId}/${fileId}/${safeName}`;
        const upload = await supabase.storage.from('uploads').upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upload.error) throw upload.error;
        uploadedPath = storagePath;
        uploadedFileId = fileId;

        const titleForRow = form.title.trim() || file.name.replace(/\.[^.]+$/, '').trim() || file.name;
        const { error: insErr } = await supabase.from('files').insert({
          id: fileId,
          owner_id: ownerId,
          title: titleForRow,
          description: form.description ?? '',
          tags: tagsFromCsv(form.tagsCsv),
          storage_path: storagePath,
          original_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          visibility: 'public',
          show_on_website: true,
          show_for_teacher: false,
        });
        if (insErr) throw insErr;

        await writeAuditLog(supabase, {
          action: 'create',
          entity: 'file',
          entity_id: fileId,
          summary: `Bestand via projectformulier: ${titleForRow}`,
        });

        streamFileId = fileId;
      } else if (form.linkedFileId) {
        streamFileId = form.linkedFileId;
      }

      const manualUrl = form.url.trim();
      const resolvedUrl =
        manualUrl || (streamFileId ? `/api/files/stream/${streamFileId}` : null);

      const hasMini = Boolean(form.mini_project_token.trim());
      if (!resolvedUrl && !hasMini) {
        throw new Error('Vul een externe URL in, kies of upload een bestand, of kies een mini-site.');
      }

      let titleFinal = form.title.trim();
      if (!titleFinal && form.uploadFile) {
        titleFinal =
          form.uploadFile.name.replace(/\.[^.]+$/, '').trim() || form.uploadFile.name;
      }
      if (!titleFinal && form.linkedFileId) {
        const pick = pickerFiles.find((f) => f.id === form.linkedFileId);
        titleFinal = pick?.title?.trim() || pick?.original_name?.replace(/\.[^.]+$/, '').trim() || pick?.original_name || 'Project';
      }
      if (!titleFinal && hasMini) {
        const mini = minis.find((m) => m.token === form.mini_project_token.trim());
        titleFinal = mini?.title ?? 'Project';
      }
      if (!titleFinal.trim()) throw new Error('Vul een titel in (of upload/kies een bestand voor automatische titel).');

      if (resolvedUrl?.startsWith('/api/files/stream/')) {
        const streamRowId = streamFileIdFromUrl(resolvedUrl);
        if (streamRowId) {
          const { error: visErr } = await supabase
            .from('files')
            .update({ show_on_website: true, visibility: 'public' })
            .eq('id', streamRowId);
          if (visErr) throw visErr;
        }
      }

      const slugBase = form.slug.trim() || slugify(titleFinal);
      const basePayload = {
        title: titleFinal.trim(),
        slug: slugBase,
        description: form.description ?? '',
        url: resolvedUrl,
        tags: tagsFromCsv(form.tagsCsv),
        status: form.status,
        thumbnail_url: form.thumbnail_url.trim() || null,
        mini_project_token: form.mini_project_token.trim() || null,
      };
      const payload = form.id ? { ...basePayload, id: form.id } : basePayload;

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
      await revalidatePortfolioContent();
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Opslaan mislukt.';
      setError(msg);
      if (uploadedPath && uploadedFileId) {
        try {
          await supabase.storage.from('uploads').remove([uploadedPath]);
        } catch {
          /* best effort */
        }
        try {
          await supabase.from('files').delete().eq('id', uploadedFileId);
        } catch {
          /* best effort */
        }
      }
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
    await revalidatePortfolioContent();
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Projecten</h1>
          <p className="mt-1 text-sm text-muted-foreground">Beheer je portfolio projecten.</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4" />
            <span className="ml-2 sm:hidden">Vernieuwen</span>
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={startCreate} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            <span className="ml-2">Nieuw project</span>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    /{p.slug} · {p.status}
                    {p.mini_project_token ? ' · mini-site' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                    Bewerken
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                    Verwijderen
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Project bewerken' : 'Nieuw project'}</DialogTitle>
            <DialogDescription>
              URL voor preview in de site. Laat URL leeg en kies of upload een bestand — dan wordt automatisch een
              stabiele preview-link gezet (<code className="text-xs">/api/files/stream/…</code>). Zie ook{' '}
              <Link href="/admin/uploads" className="font-medium text-primary underline-offset-4 hover:underline">
                Uploads
              </Link>
              .
            </DialogDescription>
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
                placeholder="Bijv. AI project — dashboard (mag leeg bij upload/kies bestand)"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="url">Website URL (optioneel als je bestand kiest)</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://…  of leeg voor bestand hieronder"
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium">Geüpload bestand koppelen</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Kies een bestaand bestand uit Uploads, of upload hier direct. Als de URL hierboven leeg is, wordt de
                preview-URL automatisch van dit bestand afgeleid — het project wordt altijd opgeslagen na een geslaagde
                upload.
              </p>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="linkedFile">Bestand uit bibliotheek</Label>
                  <select
                    id="linkedFile"
                    value={form.linkedFileId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((s) => {
                        if (!v) {
                          return {
                            ...s,
                            linkedFileId: '',
                            uploadFile: null,
                            url: s.url.includes('/api/files/stream/') ? '' : s.url,
                          };
                        }
                        return {
                          ...s,
                          linkedFileId: v,
                          uploadFile: null,
                          url:
                            s.url.trim() && !s.url.includes('/api/files/stream/')
                              ? s.url
                              : `/api/files/stream/${v}`,
                        };
                      });
                    }}
                    className="h-10 w-full max-w-full rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">— geen —</option>
                    {pickerFiles.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} ({f.original_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="projectUpload">Of nieuw bestand uploaden</Label>
                  <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-input bg-background/60 px-3 py-4 text-sm text-muted-foreground transition-colors hover:bg-accent/40">
                    <span>{form.uploadFile ? form.uploadFile.name : 'Klik om een bestand te kiezen…'}</span>
                    <input
                      id="projectUpload"
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setForm((s) => ({
                          ...s,
                          uploadFile: f,
                          linkedFileId: f ? '' : s.linkedFileId,
                          url: s.url.trim() ? s.url : '',
                        }));
                      }}
                    />
                  </label>
                </div>
              </div>
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
                className="h-10 w-full max-w-full rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">— geen —</option>
                {minis.map((m) => (
                  <option key={m.id} value={m.token}>
                    {m.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Importeer eerst een ZIP via Uploads.</p>
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
                className="h-10 w-full max-w-full rounded-xl border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                className="min-h-[120px] resize-y"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuleren
            </Button>
            <Button onClick={() => void save()} disabled={saving || !canAttemptSave}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
