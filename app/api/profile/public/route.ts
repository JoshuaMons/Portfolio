import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function GET() {
  try {
    const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const adminId = process.env.ADMIN_USER_ID || null;
    const q = supabase
      .from('profiles')
      .select('id,full_name,headline,bio,avatar_url,website_url,github_url,linkedin_url')
      .limit(1);

    const { data: profile, error } = adminId ? await q.eq('id', adminId).maybeSingle() : await q.maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!profile) return NextResponse.json({ data: null });

    let avatarSignedUrl: string | null = null;
    const avatar = (profile as any).avatar_url as string | null;
    if (avatar) {
      if (avatar.startsWith('http')) {
        avatarSignedUrl = avatar;
      } else {
        const signed = await supabase.storage.from('uploads').createSignedUrl(avatar, 60 * 10);
        avatarSignedUrl = signed.data?.signedUrl ?? null;
      }
    }

    return NextResponse.json({
      data: {
        ...profile,
        avatar_signed_url: avatarSignedUrl,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

