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

    const { data: rows, error } = await supabase
      .from('files')
      .select(
        'id,title,description,tags,storage_path,original_name,mime_type,size_bytes,visibility,show_on_website,show_for_teacher,created_at,updated_at,mini_project_id,mini_projects(token,show_on_website)'
      )
      .or('show_on_website.eq.true,visibility.eq.public')
      .order('updated_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const items = await Promise.all(
      (rows ?? []).map(async (r: Record<string, unknown>) => {
        const path = r.storage_path as string | null | undefined;
        const signed =
          path && String(path).length > 0
            ? await supabase.storage.from('uploads').createSignedUrl(String(path), 60 * 10)
            : { data: null as { signedUrl: string } | null };

        const nested = r.mini_projects as { token: string; show_on_website: boolean } | { token: string; show_on_website: boolean }[] | null | undefined;
        const m = Array.isArray(nested) ? nested[0] : nested;
        const miniOk = Boolean(m?.show_on_website && m?.token);
        const mini_project_token = miniOk ? m!.token : null;

        const { mini_projects: _drop, ...rest } = r;
        return {
          ...rest,
          mini_project_token,
          signed_url: signed.data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ data: items });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
