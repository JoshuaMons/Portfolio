'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'portfolio_shader_v1';

type ShaderState = {
  a: string; // hex
  b: string; // hex
  c: string; // hex
  aAlpha: number;
  bAlpha: number;
  cAlpha: number;
  angle: number; // degrees
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

function rgbTupleToHex(rgb: string) {
  const parts = rgb.split(',').map((p) => Number(p.trim()));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [r, g, b] = parts.map((n) => Math.min(255, Math.max(0, Math.round(n))));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function parseRgba(input: string) {
  const m = input
    .trim()
    .match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+)\s*)?\)$/i);
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const a = m[4] == null ? 1 : Number(m[4]);
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return {
    rgb: `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`,
    alpha: clamp(a, 0, 1),
  };
}

function rgbaFromHexAlpha(hex: string, alpha: number) {
  const rgb = hexToRgbTuple(hex);
  if (!rgb) return null;
  return `rgba(${rgb}, ${clamp(alpha, 0, 1)})`;
}

function applyShader(state: ShaderState) {
  const root = document.documentElement;
  const a = hexToRgbTuple(state.a);
  const b = hexToRgbTuple(state.b);
  const c = hexToRgbTuple(state.c);
  if (a) root.style.setProperty('--shader-a', a);
  if (b) root.style.setProperty('--shader-b', b);
  if (c) root.style.setProperty('--shader-c', c);
  root.style.setProperty('--shader-a-alpha', String(clamp(state.aAlpha, 0, 1)));
  root.style.setProperty('--shader-b-alpha', String(clamp(state.bAlpha, 0, 1)));
  root.style.setProperty('--shader-c-alpha', String(clamp(state.cAlpha, 0, 1)));
  root.style.setProperty('--shader-angle', `${clamp(state.angle, 0, 360)}deg`);
}

export function ShaderScript() {
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ShaderState;
      if (!parsed?.a || !parsed?.b || !parsed?.c) return;
      applyShader(parsed);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId || !mounted) return;

      const { data } = await supabase
        .from('shader_settings')
        .select('a,b,c,angle_deg')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && mounted) {
        const ra = parseRgba(String((data as any).a ?? ''));
        const rb = parseRgba(String((data as any).b ?? ''));
        const rc = parseRgba(String((data as any).c ?? ''));
        const angle = Number((data as any).angle_deg ?? 135);

        const next: ShaderState | null =
          ra && rb && rc
            ? {
                a: rgbTupleToHex(ra.rgb) ?? '#6366f1',
                b: rgbTupleToHex(rb.rgb) ?? '#10b981',
                c: rgbTupleToHex(rc.rgb) ?? '#3b82f6',
                aAlpha: ra.alpha,
                bAlpha: rb.alpha,
                cAlpha: rc.alpha,
                angle: clamp(angle, 0, 360),
              }
            : null;

        if (next) {
          applyShader(next);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
      }

      // Best-effort realtime sync (if Realtime is enabled for the table).
      channel = supabase
        .channel(`shader_settings:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shader_settings', filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = (payload.new ?? payload.old) as any;
            const ra = row?.a ? parseRgba(String(row.a)) : null;
            const rb = row?.b ? parseRgba(String(row.b)) : null;
            const rc = row?.c ? parseRgba(String(row.c)) : null;
            const angle = Number(row?.angle_deg ?? 135);
            if (!ra || !rb || !rc) return;
            const next: ShaderState = {
              a: rgbTupleToHex(ra.rgb) ?? '#6366f1',
              b: rgbTupleToHex(rb.rgb) ?? '#10b981',
              c: rgbTupleToHex(rc.rgb) ?? '#3b82f6',
              aAlpha: ra.alpha,
              bAlpha: rb.alpha,
              cAlpha: rc.alpha,
              angle: clamp(angle, 0, 360),
            };
            applyShader(next);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}

export { STORAGE_KEY, applyShader, type ShaderState };

