import Link from 'next/link';
import { headers } from 'next/headers';

import { Button } from '@/components/ui/button';
import { AboutClient } from './about-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PublicProfile = {
  full_name: string | null;
  headline: string | null;
  bio: string;
  avatar_signed_url: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
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

      <AboutClient profile={profile} />
    </div>
  );
}

