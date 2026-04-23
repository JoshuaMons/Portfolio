import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/**
 * Publieke redirect naar een kort geldige signed URL voor een website-zichtbaar bestand.
 * Gebruikt voor `projects.url` als `/api/files/stream/{id}` zodat previews stabiel blijven.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });
    }

    const supabase = createClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    const { data: row, error } = await supabase
      .from('files')
      .select('id,storage_path,show_on_website,visibility')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

    const visible = row.show_on_website === true || row.visibility === 'public';
    if (!visible) return NextResponse.json({ error: 'Niet publiek' }, { status: 403 });

    const path = row.storage_path as string | null;
    if (!path || !String(path).trim()) {
      return NextResponse.json({ error: 'Geen opslagpad' }, { status: 404 });
    }

    const signed = await supabase.storage.from('uploads').createSignedUrl(String(path), 60 * 60);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json({ error: 'Signed URL mislukt' }, { status: 502 });
    }

    return NextResponse.redirect(signed.data.signedUrl, 302);
  } catch {
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
