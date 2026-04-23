import Link from 'next/link';
import { Download } from 'lucide-react';
import { headers } from 'next/headers';

import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PublicProfile = {
  full_name: string | null;
  headline: string | null;
  bio: string;
  avatar_signed_url: string | null;
};

export default async function AboutPage() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = host ? `${proto}://${host}` : '';

  const res = await fetch(`${baseUrl}/api/profile/public`, { cache: 'no-store' }).catch(() => null);
  const json = res ? await res.json().catch(() => ({})) : {};
  const profile = (json?.data as PublicProfile | null) ?? null;

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
        <div className="flex flex-wrap items-center gap-6">
          <div className="h-28 w-28 overflow-hidden rounded-3xl border border-border/60 bg-background/50">
            {profile?.avatar_signed_url ? (
              <img src={profile.avatar_signed_url} alt="Profielfoto" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Geen foto</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{profile?.full_name ?? 'Joshua'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{profile?.headline ?? 'Business & AI — portfolio'}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
              {profile?.bio?.trim()
                ? profile.bio
                : 'Vul je bio in via /admin/profile. Deze tekst verschijnt hier automatisch.'}
            </p>
          </div>
        </div>
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

