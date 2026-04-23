'use client';

import * as React from 'react';
import { Paintbrush } from 'lucide-react';

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

export function ShaderControls() {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<ShaderState>(defaults);

  React.useEffect(() => {
    const s = load();
    setState(s);
    applyShader(s);
  }, []);

  function update(next: Partial<ShaderState>) {
    setState((prev) => {
      const merged = { ...prev, ...next };
      applyShader(merged);
      save(merged);
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

