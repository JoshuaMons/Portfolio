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
      .select('id,title,description,tags,storage_path,original_name,mime_type,size_bytes,visibility,created_at,updated_at')
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const items = await Promise.all(
      (rows ?? []).map(async (r: any) => {
        const signed = await supabase.storage.from('uploads').createSignedUrl(r.storage_path, 60 * 10); // 10 min
        return {
          ...r,
          signed_url: signed.data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ data: items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

