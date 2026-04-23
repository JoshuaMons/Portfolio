'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import type { PublishStatus } from '@/types/portfolio';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit-log';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type TimelineItem = {
  id: string;
  title: string;
  period: string;
  description: string;
  order_index: number;
  status: PublishStatus;
  updated_at: string;
};

type FormState = {
  id?: string;
  title: string;
  period: string;
  description: string;
  order_index: number;
  status: PublishStatus;
};

const emptyForm: FormState = {
  title: '',
  period: '',
  description: '',
  order_index: 0,
  status: 'draft',
};

export default function AdminTimelinePage() {
  const [items, setItems] = React.useState<TimelineItem[]>([]);
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
      .from('timeline_items')
      .select('id,title,period,description,order_index,status,updated_at')
      .order('order_index', { ascending: true });
    if (error) setError(error.message);
    setItems((data as TimelineItem[]) ?? []);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function startCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(it: TimelineItem) {
    setForm({
      id: it.id,
      title: it.title,
      period: it.period,
      description: it.description,
      order_index: it.order_index,
      status: it.status,
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
        period: form.period.trim(),
        description: form.description ?? '',
        order_index: Number.isFinite(form.order_index) ? form.order_index : 0,
        status: form.status,
      };

      const { error } = await supabase.from('timeline_items').upsert(payload).select().single();
      if (error) throw error;
      await writeAuditLog(supabase, {
        action: form.id ? 'update' : 'create',
        entity: 'timeline_item',
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
    if (!confirm('Timeline item verwijderen?')) return;
    const { error } = await supabase.from('timeline_items').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    await writeAuditLog(supabase, { action: 'delete', entity: 'timeline_item', entity_id: id, summary: `Verwijderd timeline item (${id})` });
    await refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">Beheer je mijlpalen.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Nieuw item
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laden…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nog geen items.</div>
        ) : (
          items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{it.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {it.period} · order {it.order_index} · {it.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => startEdit(it)}>
                    Bewerken
                  </Button>
                  <Button variant="ghost" onClick={() => remove(it.id)}>
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
            <DialogTitle>{form.id ? 'Item bewerken' : 'Nieuw timeline item'}</DialogTitle>
            <DialogDescription>Wordt zichtbaar op `/timeline` zodra status `published` is.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="period">Periode</Label>
              <Input
                id="period"
                value={form.period}
                onChange={(e) => setForm((s) => ({ ...s, period: e.target.value }))}
                placeholder="Bijv. Semester 2 (2026)"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="order_index">Order</Label>
              <Input
                id="order_index"
                type="number"
                value={form.order_index}
                onChange={(e) => setForm((s) => ({ ...s, order_index: Number(e.target.value) }))}
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
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuleren
            </Button>
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.period.trim()}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

