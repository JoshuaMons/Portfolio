'use client';

import * as React from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

type PublicProfile = {
  full_name: string | null;
  headline: string | null;
  bio: string;
  avatar_signed_url: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
};

function PillSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="glass-surface rounded-3xl shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-3xl px-6 py-5 text-left"
      >
        <div className="min-w-0">
          <p className="text-lg font-semibold">{title}</p>
          {!open ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p> : null}
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? <div className="px-6 pb-6">{children}</div> : null}
    </div>
  );
}

function AvatarCard({ profile }: { profile: PublicProfile | null }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="glass-surface rounded-3xl p-8 shadow-card">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-border/60 bg-background/50">
          {profile?.avatar_signed_url ? (
            <img src={profile.avatar_signed_url} alt="Profielfoto" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Geen foto</div>
          )}

          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background/95 to-transparent transition-opacity ${
              scrolled ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">{profile?.full_name ?? 'Joshua'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{profile?.headline ?? 'Business & AI — portfolio'}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {profile?.bio?.trim() ? profile.bio : 'Vul je bio in via /admin/profile. Deze tekst verschijnt hier automatisch.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AboutClient({ profile }: { profile: PublicProfile | null }) {
  const links = [
    profile?.website_url ? { label: 'Website', href: profile.website_url } : null,
    profile?.github_url ? { label: 'GitHub', href: profile.github_url } : null,
    profile?.linkedin_url ? { label: 'LinkedIn', href: profile.linkedin_url } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const linksSummary = links.length ? links.map((l) => l.label).join(' • ') : 'Nog geen links toegevoegd (via /admin/profile).';

  return (
    <div className="mt-8 grid gap-6">
      <AvatarCard profile={profile} />

      <PillSection title="Links" summary={linksSummary} defaultOpen={false}>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Voeg links toe in `/admin/profile` (website, GitHub, LinkedIn).</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Button key={l.href} asChild variant="outline" className="gap-2">
                <a href={l.href} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {l.label}
                </a>
              </Button>
            ))}
          </div>
        )}
      </PillSection>

      <PillSection
        title="CV (Nederlands)"
        summary="Bekijk of download mijn CV. Klik om uit te klappen."
        defaultOpen={false}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Bekijk of download mijn CV.</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <a href="/cv-nl.pdf" download>
              Download CV
            </a>
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background/50">
          <iframe src="/cv-nl.pdf" title="CV (Nederlands)" className="h-[70vh] w-full" />
        </div>
      </PillSection>
    </div>
  );
}

