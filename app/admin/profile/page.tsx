'use client';

import * as React from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShaderControls } from '@/components/site/shader-controls';
import { ShaderScript } from '@/components/site/shader-script';
import { writeAuditLog } from '@/lib/audit-log';

type Profile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string;
  avatar_url: string | null;
  contact_email: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
};

export default function AdminProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);

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
        .select('id,full_name,headline,bio,avatar_url,contact_email,website_url,github_url,linkedin_url')
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
          contact_email: null,
          website_url: null,
          github_url: null,
          linkedin_url: null,
        }
      );

      const rawAvatar = (data as Profile | null)?.avatar_url ?? null;
      if (rawAvatar) {
        if (rawAvatar.startsWith('http')) {
          setAvatarPreview(rawAvatar);
        } else {
          const signed = await supabase.storage.from('uploads').createSignedUrl(rawAvatar, 60 * 10);
          setAvatarPreview(signed.data?.signedUrl ?? null);
        }
      } else {
        setAvatarPreview(null);
      }
    })();
  }, []);

  async function uploadAvatar(file: File) {
    const supabase = supabaseRef.current;
    if (!supabase || !profile) return;
    setAvatarUploading(true);
    setError(null);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ext.replace(/[^\w]+/g, '');
      const objectPath = `avatars/${profile.id}/${crypto.randomUUID()}.${safeExt}`;

      const up = await supabase.storage.from('uploads').upload(objectPath, file, {
        contentType: file.type || undefined,
        upsert: true,
      });
      if (up.error) throw up.error;

      const signed = await supabase.storage.from('uploads').createSignedUrl(objectPath, 60 * 10);
      setAvatarPreview(signed.data?.signedUrl ?? null);

      // Persist immediately so About page can show it without requiring "Opslaan"
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: profile.id, avatar_url: objectPath })
        .select()
        .single();
      if (upsertError) throw upsertError;

      setProfile((p) => (p ? { ...p, avatar_url: objectPath } : p));

      await writeAuditLog(supabase, {
        action: 'update',
        entity: 'profile',
        entity_id: profile.id,
        summary: 'Profielfoto geüpload',
      });
    } catch (e: any) {
      setError(e?.message ?? 'Upload mislukt.');
    } finally {
      setAvatarUploading(false);
    }
  }

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
        contact_email: profile.contact_email?.trim() || null,
        website_url: profile.website_url?.trim() || null,
        github_url: profile.github_url?.trim() || null,
        linkedin_url: profile.linkedin_url?.trim() || null,
      };

      const { error } = await supabase.from('profiles').upsert(payload).select().single();
      if (error) throw error;
      await writeAuditLog(supabase, {
        action: 'update',
        entity: 'profile',
        entity_id: profile.id,
        summary: `Profiel bijgewerkt: ${payload.full_name ?? ''}`.trim(),
      });
    } catch (e: any) {
      setError(e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-gradient -m-6 rounded-3xl p-6">
      <ShaderScript />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Profiel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Deze info kan later op je About pagina worden getoond.</p>
        </div>
        <div className="flex items-center gap-2">
          <ShaderControls />
          <Button onClick={save} disabled={!profile || saving}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!profile ? (
        <p className="mt-6 text-sm text-muted-foreground">Laden…</p>
      ) : (
        <div className="glass-surface mt-6 grid gap-4 rounded-3xl p-6 shadow-card">
          <div className="grid gap-2">
            <Label>Profielfoto</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Geen</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
                  {avatarUploading ? 'Uploaden…' : 'Upload profielfoto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={avatarUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAvatar(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Wordt opgeslagen in Supabase Storage. Klik daarna op <span className="font-semibold">Opslaan</span> om te bewaren in je profiel.
                </p>
              </div>
            </div>
          </div>

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
            <Label htmlFor="contact_email">Contact e-mail (voor reviews)</Label>
            <Input
              id="contact_email"
              type="email"
              value={profile.contact_email ?? ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, contact_email: e.target.value } : p))}
              placeholder="jij@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Reviews van bezoekers worden naar dit adres gestuurd.
            </p>
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

