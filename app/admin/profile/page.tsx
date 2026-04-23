'use client';

import * as React from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Profile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string;
  avatar_url: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
};

export default function AdminProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const supabaseRef = React.useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  React.useEffect(() => {
    supabaseRef.current = createSupabaseBrowserClient();
    if (!supabaseRef.current) {
      setError('Supabase is nog niet geconfigureerd (env vars ontbreken).');
      return;
    }

    (async () => {
      const supabase = supabaseRef.current!;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError('Niet ingelogd.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,full_name,headline,bio,avatar_url,website_url,github_url,linkedin_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        setError(error.message);
        return;
      }

      setProfile(
        (data as Profile | null) ?? {
          id: userId,
          full_name: null,
          headline: null,
          bio: '',
          avatar_url: null,
          website_url: null,
          github_url: null,
          linkedin_url: null,
        }
      );
    })();
  }, []);

  async function save() {
    const supabase = supabaseRef.current;
    if (!supabase || !profile) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: profile.id,
        full_name: profile.full_name?.trim() || null,
        headline: profile.headline?.trim() || null,
        bio: profile.bio ?? '',
        avatar_url: profile.avatar_url?.trim() || null,
        website_url: profile.website_url?.trim() || null,
        github_url: profile.github_url?.trim() || null,
        linkedin_url: profile.linkedin_url?.trim() || null,
      };

      const { error } = await supabase.from('profiles').upsert(payload).select().single();
      if (error) throw error;
    } catch (e: any) {
      setError(e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Profiel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Deze info kan later op je About pagina worden getoond.</p>
        </div>
        <Button onClick={save} disabled={!profile || saving}>
          {saving ? 'Opslaan…' : 'Opslaan'}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!profile ? (
        <p className="mt-6 text-sm text-muted-foreground">Laden…</p>
      ) : (
        <div className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="full_name">Naam</Label>
            <Input
              id="full_name"
              value={profile.full_name ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={profile.headline ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, headline: e.target.value } : p))}
              placeholder="Bijv. Business & AI student • Web developer"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, bio: e.target.value } : p))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="avatar_url">Avatar URL (optioneel)</Label>
            <Input
              id="avatar_url"
              value={profile.avatar_url ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, avatar_url: e.target.value } : p))}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              value={profile.website_url ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, website_url: e.target.value } : p))}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              value={profile.github_url ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, github_url: e.target.value } : p))}
              placeholder="https://github.com/…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              value={profile.linkedin_url ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, linkedin_url: e.target.value } : p))}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

