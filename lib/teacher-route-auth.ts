import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type TeacherAuthResult =
  | { ok: true; serviceClient: SupabaseClient; adminUserId: string }
  | { ok: false; error: string; status: number };

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/**
 * Verifies the browser session is the configured teacher user, then returns a service-role client
 * to read portfolio-owner data (e.g. audit_logs for ADMIN_USER_ID).
 */
export async function requireTeacherServiceClient(): Promise<TeacherAuthResult> {
  try {
    const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const teacherUserId = requiredEnv('TEACHER_USER_ID');
    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId) {
      return { ok: false, error: 'ADMIN_USER_ID is niet geconfigureerd', status: 500 };
    }

    const cookieStore = cookies();
    const supabaseAuth = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });

    const { data } = await supabaseAuth.auth.getUser();
    if (data.user?.id !== teacherUserId) {
      return { ok: false, error: 'Unauthorized', status: 401 };
    }

    const serviceClient = createClient(url, serviceRole, { auth: { persistSession: false } });
    return { ok: true, serviceClient, adminUserId };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Server error', status: 500 };
  }
}
