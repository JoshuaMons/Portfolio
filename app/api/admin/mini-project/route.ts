import AdmZip from 'adm-zip';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { guessMimeFromPath } from '@/lib/mini-project-mime';
import { getAuthedUserId, isAdminUser } from '@/lib/session-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const uid = await getAuthedUserId();
    if (!isAdminUser(uid)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await req.formData();
    const title = String(form.get('title') || '').trim();
    const file = form.get('file');
    const show_on_website = form.get('show_on_website') === 'true';
    const show_for_teacher = form.get('show_for_teacher') === 'true';

    if (!title) return NextResponse.json({ error: 'Titel verplicht' }, { status: 400 });
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'ZIP-bestand verplicht' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Alleen .zip wordt ondersteund' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buf);
    const entries = zip.getEntries().filter((e) => !e.isDirectory);

    let indexEntry: (typeof entries)[0] | null = null;
    let bestLen = Infinity;
    for (const e of entries) {
      const n = e.entryName.replace(/\\/g, '/');
      if (/(^|\/)index\.html$/i.test(n) && n.length < bestLen) {
        bestLen = n.length;
        indexEntry = e;
      }
    }
    if (!indexEntry) {
      return NextResponse.json({ error: 'Geen index.html in de ZIP gevonden.' }, { status: 400 });
    }

    const normalizedIndex = indexEntry.entryName.replace(/\\/g, '/');
    const slash = normalizedIndex.lastIndexOf('/');
    const webRoot = slash >= 0 ? normalizedIndex.slice(0, slash + 1) : '';

    const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const svc = createClient(url, serviceRole, { auth: { persistSession: false } });

    const miniId = crypto.randomUUID();
    const prefix = `owner/${uid}/mini/${miniId}/`;

    for (const ent of entries) {
      const name = ent.entryName.replace(/\\/g, '/');
      if (!name.startsWith(webRoot)) continue;
      const rel = name.slice(webRoot.length).replace(/^\/+/, '');
      if (!rel || rel.includes('..')) continue;
      const body = ent.getData();
      const up = await svc.storage.from('uploads').upload(`${prefix}${rel}`, body, {
        contentType: guessMimeFromPath(rel),
        upsert: true,
      });
      if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
    }

    const { data, error } = await svc
      .from('mini_projects')
      .insert({
        id: miniId,
        owner_id: uid,
        title,
        root_prefix: prefix,
        show_on_website,
        show_for_teacher,
      })
      .select('id,token,title')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath('/teacher');
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/admin/uploads');
    revalidatePath('/admin/content');

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Import mislukt' }, { status: 500 });
  }
}
