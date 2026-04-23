import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getAuthedUserId(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function isAdminUser(userId: string | null): boolean {
  const admin = process.env.ADMIN_USER_ID;
  return Boolean(admin && userId && userId === admin);
}

export function isTeacherUser(userId: string | null): boolean {
  const teacher = process.env.TEACHER_USER_ID;
  return Boolean(teacher && userId && userId === teacher);
}
