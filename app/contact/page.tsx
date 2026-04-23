import Link from 'next/link';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const dynamic = 'force-static';

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contact</h1>
          <p className="mt-1 text-sm text-muted-foreground">Neem contact op.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Projecten</Link>
        </Button>
      </div>

      <div className="glass-surface mt-8 rounded-3xl p-8 shadow-card">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">E-mail:</span>
          <span className="font-medium">jij@example.com</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          (Later kunnen we hier een formulier toevoegen met e-mail verzending, maar standaard houden we het simpel.)
        </p>
      </div>
    </div>
  );
}

