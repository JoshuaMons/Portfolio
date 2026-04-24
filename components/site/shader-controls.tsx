'use client';

import * as React from 'react';
import { Paintbrush } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STORAGE_KEY, applyShader, type ShaderState } from './shader-script';

const defaults: ShaderState = {
  a: '#6366f1',
  b: '#10b981',
  c: '#3b82f6',
  aAlpha: 0.22,
  bAlpha: 0.12,
  cAlpha: 0.1,
  angle: 135,
};

function load(): ShaderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as ShaderState;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function save(state: ShaderState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hexToRgbTuple(hex: string) {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return null;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r}, ${g}, ${b}`;
}

function toRgba(hex: string, alpha: number) {
  const rgb = hexToRgbTuple(hex);
  if (!rgb) return null;
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${rgb}, ${a})`;
}

export function ShaderControls() {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<ShaderState>(defaults);
  const supabaseRef = React.useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const userIdRef = React.useRef<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const s = load();
    setState(s);
    applyShader(s);
  }, []);

  React.useEffect(() => {
    supabaseRef.current = createSupabaseBrowserClient();
    if (!supabaseRef.current) return;

    let mounted = true;
    (async () => {
      const supabase = supabaseRef.current!;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      userIdRef.current = userId;
      if (!userId || !mounted) return;

      const { data } = await supabase
        .from('shader_settings')
        .select('a,b,c,angle_deg')
        .eq('user_id', userId)
        .maybeSingle();

      // If the row exists, `ShaderScript` will apply it globally; we also want controls to reflect it.
      // We derive best-effort hex+alpha from stored rgba strings.
      if (data && mounted) {
        const parse = (s: any) => {
          const m = String(s ?? '')
            .trim()
            .match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+)\s*)?\)$/i);
          if (!m) return null;
          const r = Math.round(Number(m[1]));
          const g = Math.round(Number(m[2]));
          const b = Math.round(Number(m[3]));
          const a = m[4] == null ? 1 : Number(m[4]);
          if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
          const hex = `#${[r, g, b].map((n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0')).join('')}`;
          return { hex, alpha: Math.min(1, Math.max(0, a)) };
        };
        const ra = parse((data as any).a);
        const rb = parse((data as any).b);
        const rc = parse((data as any).c);
        if (ra && rb && rc) {
          setState((prev) => ({
            ...prev,
            a: ra.hex,
            b: rb.hex,
            c: rc.hex,
            aAlpha: ra.alpha,
            bAlpha: rb.alpha,
            cAlpha: rc.alpha,
            angle: Number((data as any).angle_deg ?? prev.angle),
          }));
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function update(next: Partial<ShaderState>) {
    setState((prev) => {
      const merged = { ...prev, ...next };
      applyShader(merged);
      save(merged);

      const supabase = supabaseRef.current;
      const userId = userIdRef.current;
      if (supabase && userId) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const a = toRgba(merged.a, merged.aAlpha);
          const b = toRgba(merged.b, merged.bAlpha);
          const c = toRgba(merged.c, merged.cAlpha);
          if (!a || !b || !c) return;
          supabase
            .from('shader_settings')
            .upsert({
              user_id: userId,
              a,
              b,
              c,
              angle_deg: Math.round(merged.angle),
              updated_at: new Date().toISOString(),
            })
            .then(() => {});
        }, 250);
      }

      return merged;
    });
  }

  function reset() {
    update(defaults);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Paintbrush className="h-4 w-4" />
        Gradient
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Gradient shader</DialogTitle>
            <DialogDescription>Pas de achtergrond gradient live aan. Wordt automatisch opgeslagen.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="colorA">Kleur A</Label>
                <Input id="colorA" type="color" value={state.a} onChange={(e) => update({ a: e.target.value })} className="h-10 p-1" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="colorB">Kleur B</Label>
                <Input id="colorB" type="color" value={state.b} onChange={(e) => update({ b: e.target.value })} className="h-10 p-1" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="colorC">Kleur C</Label>
                <Input id="colorC" type="color" value={state.c} onChange={(e) => update({ c: e.target.value })} className="h-10 p-1" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="aAlpha">A intensiteit</Label>
                <Input
                  id="aAlpha"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.aAlpha}
                  onChange={(e) => update({ aAlpha: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bAlpha">B intensiteit</Label>
                <Input
                  id="bAlpha"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.bAlpha}
                  onChange={(e) => update({ bAlpha: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cAlpha">C intensiteit</Label>
                <Input
                  id="cAlpha"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.cAlpha}
                  onChange={(e) => update({ cAlpha: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="angle">Angle</Label>
              <Input
                id="angle"
                type="range"
                min="0"
                max="360"
                step="1"
                value={state.angle}
                onChange={(e) => update({ angle: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">{state.angle}°</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
            <Button onClick={() => setOpen(false)}>Sluiten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

