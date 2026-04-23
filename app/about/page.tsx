import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const dynamic = 'force-static';

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
    </div>
  );
}

