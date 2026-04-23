'use client';

import * as React from 'react';

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

  return null;
}

export { STORAGE_KEY, applyShader, type ShaderState };

