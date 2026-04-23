import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function GET() {
  try {
    const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    const adminUserId = process.env.ADMIN_USER_ID || null;
    const teacherUserId = process.env.TEACHER_USER_ID || null;

    const cookieStore = cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    if (!userId) return NextResponse.json({ role: 'anon' });

    if (adminUserId && userId === adminUserId) return NextResponse.json({ role: 'admin' });
    if (teacherUserId && userId === teacherUserId) return NextResponse.json({ role: 'teacher' });
    return NextResponse.json({ role: 'user' });
  } catch {
    return NextResponse.json({ role: 'anon' });
  }
}

