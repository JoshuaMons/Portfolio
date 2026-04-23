import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { guessMimeFromPath, injectHtmlBase } from '@/lib/mini-project-mime';
import { getAuthedUserId, isAdminUser, isTeacherUser } from '@/lib/session-auth';

export const runtime = 'nodejs';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function GET(req: Request, { params }: { params: { token: string; path?: string[] } }) {
  try {
    const token = params.token;
    const rawParts = params.path ?? [];
    const parts = rawParts.filter((p) => p && p !== '.' && p !== '..');
    const rel = parts.length ? parts.join('/') : 'index.html';

    const svc = createClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    const { data: row, error } = await svc.from('mini_projects').select('*').eq('token', token).maybeSingle();
    if (error || !row) return new NextResponse('Niet gevonden', { status: 404 });

    const okPublic = row.show_on_website === true;
    const uid = await getAuthedUserId();
    if (!okPublic) {
      if (!isAdminUser(uid) && !(isTeacherUser(uid) && row.show_for_teacher === true)) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const root = String(row.root_prefix).replace(/\/?$/, '/');
    const storagePath = `${root}${rel}`.replace(/\/{2,}/g, '/');
    const dl = await svc.storage.from('uploads').download(storagePath);
    if (dl.error) return new NextResponse('Niet gevonden', { status: 404 });

    const mime = guessMimeFromPath(rel);
    let buf = Buffer.from(await dl.data.arrayBuffer());

    if (mime.startsWith('text/html')) {
      const u = new URL(req.url);
      const baseHref = `${u.origin}/api/mini-project/${token}/`;
      const text = buf.toString('utf8');
      buf = Buffer.from(injectHtmlBase(text, baseHref), 'utf8');
    }

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'private, max-age=120',
      },
    });
  } catch {
    return new NextResponse('Server error', { status: 500 });
  }
}
