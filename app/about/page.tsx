import Link from 'next/link';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Over mij</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fontys Business & AI — portfolio.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Projecten</Link>
        </Button>
      </div>

      <div className="glass-surface mt-8 rounded-3xl p-8 shadow-card">
        <p className="text-sm text-muted-foreground">
          Vul hier straks je profieltekst, interesses, en skills aan. Dit is bewust licht gehouden zodat jij makkelijk je
          eigen content kunt invullen.
        </p>
      </div>

      <div className="glass-surface mt-6 rounded-3xl p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">CV (Nederlands)</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bekijk of download mijn CV.</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <a href="/cv-nl.pdf" download>
              <Download className="h-4 w-4" />
              Download CV
            </a>
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background/50">
          <iframe
            src="/cv-nl.pdf"
            title="CV (Nederlands)"
            className="h-[70vh] w-full"
          />
        </div>
      </div>
    </div>
  );
}

