import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="glass-surface flex h-10 w-10 items-center justify-center rounded-2xl shadow-card">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Portfolio dashboard</p>
            <p className="text-xs text-muted-foreground">Fontys Business & AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/projects">Projecten</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <section className="glass-surface rounded-3xl p-8 shadow-card sm:p-12">
          <div className="max-w-2xl">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Een modern portfolio met projecten, tijdlijn en logboek.
            </h1>
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              Beheer je content in een privé admin omgeving. Bezoekers kunnen projecten bekijken en previews openen in een
              modal (zonder de site te verlaten).
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/projects" className="flex items-center gap-2">
                  Bekijk projecten <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/blog" className="flex items-center gap-2">
                  Logboek <BookOpen className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
