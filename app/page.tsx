import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { createSupabasePublicClient } from '@/lib/supabase/public';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const supabase = createSupabasePublicClient();
  const [{ data: projects }] = supabase
    ? await Promise.all([
        supabase.from('projects').select('id,title,slug,status,updated_at').eq('status', 'published').order('updated_at', { ascending: false }).limit(3),
      ])
    : [{ data: null }];

  return (
    <div className="min-h-dvh">
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <section className="glass-surface rounded-3xl p-8 shadow-card sm:p-12">
          <div className="max-w-2xl">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Een modern portfolio met projecten en tijdlijn.
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
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="glass-surface rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Laatste projecten</p>
              <Button asChild variant="ghost" size="sm">
                <Link href="/projects">Alles</Link>
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {(projects ?? []).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="block rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm hover:bg-accent"
                >
                  {p.title}
                </Link>
              ))}
              {supabase && (projects ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen gepubliceerde projecten.</p>
              ) : null}
              {!supabase ? (
                <p className="text-sm text-muted-foreground">Supabase niet geconfigureerd.</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
