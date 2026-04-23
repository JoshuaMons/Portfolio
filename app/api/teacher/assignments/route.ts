import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function GET() {
  try {
    const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    const teacherUserId = requiredEnv('TEACHER_USER_ID');
    const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

    const cookieStore = cookies();
    const supabaseAuth = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });

    const { data } = await supabaseAuth.auth.getUser();
    if (data.user?.id !== teacherUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
    const { data: rows, error } = await supabase
      .from('teacher_assignments')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: rows ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

