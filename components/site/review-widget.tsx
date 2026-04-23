'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type State = {
  name: string;
  email: string;
  message: string;
  rating: number;
};

const initial: State = { name: '', email: '', message: '', rating: 5 };

export function ReviewWidget() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<State>(initial);
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/login');
  if (hidden) return null;

  async function submit() {
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...state, pageUrl: window.location.href }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Versturen mislukt');
      setStatus('sent');
      setState(initial);
    } catch (e: any) {
      setStatus('error');
      setError(e?.message ?? 'Versturen mislukt');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setStatus('idle'); setError(null); }}
        className="fixed bottom-5 right-3 z-50 inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm font-semibold shadow-card backdrop-blur-xl hover:bg-accent"
        aria-label="Laat een review achter"
      >
        <MessageSquare className="h-4 w-4" />
        Review
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review achterlaten</DialogTitle>
            <DialogDescription>Je review wordt doorgestuurd naar de admin e-mail.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="review_name">Naam</Label>
              <Input id="review_name" value={state.name} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="review_email">E-mail</Label>
              <Input id="review_email" type="email" value={state.email} onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="review_rating">Rating</Label>
              <Input
                id="review_rating"
                type="range"
                min="1"
                max="5"
                step="1"
                value={state.rating}
                onChange={(e) => setState((s) => ({ ...s, rating: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">{state.rating}/5</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="review_message">Bericht</Label>
              <Textarea
                id="review_message"
                value={state.message}
                onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
                placeholder="Wat vond je van het portfolio?"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {status === 'sent' && <p className="text-sm text-emerald-600">Verzonden. Dankjewel!</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Sluiten</Button>
            <Button
              onClick={submit}
              disabled={status === 'sending' || !state.name.trim() || !state.email.trim() || !state.message.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {status === 'sending' ? 'Versturen…' : 'Verstuur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

