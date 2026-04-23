import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HomeProjectsSection, type HomeProjectRow } from '@/app/home-projects-section';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = host ? `${proto}://${host}` : '';

  let initialProjects: HomeProjectRow[] = [];
  let initialNextOffset: number | null = null;
  let projectsFetchOk = false;

  if (baseUrl) {
    const res = await fetch(`${baseUrl}/api/projects/public?limit=5&offset=0`, { cache: 'no-store' }).catch(() => null);
    projectsFetchOk = Boolean(res?.ok);
    if (res?.ok) {
      const json = (await res.json().catch(() => ({}))) as {
        data?: HomeProjectRow[];
        nextOffset?: number | null;
      };
      initialProjects = json.data ?? [];
      initialNextOffset = json.nextOffset ?? null;
    }
  }

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
            {baseUrl ? (
              projectsFetchOk ? (
                <>
                  <HomeProjectsSection initialProjects={initialProjects} initialNextOffset={initialNextOffset} />
                  {initialProjects.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Nog geen gepubliceerde projecten.</p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Kon laatste projecten niet laden (API of configuratie).</p>
              )
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Host onbekend; projecten niet geladen.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
