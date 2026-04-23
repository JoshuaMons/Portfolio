import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/** Publieke projectdetails (alleen `published`) voor home-modal e.d. */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug?.trim();
    if (!slug) return NextResponse.json({ error: 'Geen slug' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRole) {
      return NextResponse.json({ error: 'Supabase niet geconfigureerd' }, { status: 500 });
    }

    const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

    const adminUserId = process.env.ADMIN_USER_ID;
    let q = supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('show_on_website', true);
    if (adminUserId) q = q.eq('owner_id', adminUserId);
    const { data: project, error } = await q.maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!project) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

    const token = project.mini_project_token as string | null | undefined;
    let miniOk = false;
    if (token) {
      const { data: m } = await supabase.from('mini_projects').select('show_on_website').eq('token', token).maybeSingle();
      miniOk = m?.show_on_website === true;
    }

    const safe = {
      ...project,
      mini_project_token: miniOk ? token : null,
    };

    return NextResponse.json({ project: safe });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
