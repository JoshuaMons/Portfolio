import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getAuthedUserId, isAdminUser } from '@/lib/session-auth';

export const runtime = 'nodejs';

/** Volledige projectrij voor admin-preview (modal). Alleen portfolio-admin. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const uid = await getAuthedUserId();
    if (!isAdminUser(uid)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRole) {
      return NextResponse.json({ error: 'Server niet geconfigureerd' }, { status: 500 });
    }

    const svc = createClient(url, serviceRole, { auth: { persistSession: false } });
    const { data: project, error } = await svc.from('projects').select('*').eq('id', id).maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!project) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

    return NextResponse.json({ project });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
