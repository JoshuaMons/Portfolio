import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Publieke, gepubliceerde projecten voor home / “meer laden” (offset + limit, max 30 per request). */
export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRole) {
      return NextResponse.json({ error: 'Supabase niet geconfigureerd' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const rawLimit = Number(searchParams.get('limit')) || 5;
    const limit = Math.min(Math.max(rawLimit, 1), 30);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

    const { data: rows, error } = await supabase
      .from('projects')
      .select('id,title,slug,status,updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = rows ?? [];
    const hasMore = list.length > limit;
    const data = hasMore ? list.slice(0, limit) : list;

    return NextResponse.json({
      data,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
