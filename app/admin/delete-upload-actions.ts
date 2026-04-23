'use server';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getAuthedUserId, isAdminUser } from '@/lib/session-auth';

import { revalidatePortfolioContent } from '@/app/admin/revalidate-content';

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function collectAllStoragePaths(svc: SupabaseClient<any, 'public', any>, root: string): Promise<string[]> {
  const folder = root.replace(/\/+$/, '');
  const acc: string[] = [];

  async function walk(f: string) {
    const { data, error } = await svc.storage.from('uploads').list(f, { limit: 1000 });
    if (error || !data?.length) return;
    for (const item of data) {
      const path = `${f}/${item.name}`.replace(/\/+/g, '/');
      const size = (item as { metadata?: { size?: number } }).metadata?.size;
      if (typeof size === 'number') {
        acc.push(path);
      } else {
        await walk(path);
      }
    }
  }

  await walk(folder);
  return acc;
}

/** Verwijder een `files`-rij; bij mini-project ook storage + mini_projects + project-token. */
export async function deleteFileOrMiniBundle(fileId: string) {
  const uid = await getAuthedUserId();
  if (!isAdminUser(uid)) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRole = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const svc = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { data: row, error: fetchErr } = await svc.from('files').select('id,storage_path,mini_project_id').eq('id', fileId).maybeSingle();
  if (fetchErr || !row) {
    return { ok: false as const, error: fetchErr?.message ?? 'Niet gevonden' };
  }

  const miniId = row.mini_project_id as string | null;

  if (miniId) {
    const { data: mini, error: miniErr } = await svc.from('mini_projects').select('id,token,root_prefix').eq('id', miniId).maybeSingle();
    if (miniErr || !mini) {
      return { ok: false as const, error: miniErr?.message ?? 'Mini-project ontbreekt' };
    }

    const root = String(mini.root_prefix).replace(/\/+$/, '');
    const paths = await collectAllStoragePaths(svc, root);
    const chunk = 50;
    for (let i = 0; i < paths.length; i += chunk) {
      const batch = paths.slice(i, i + chunk);
      if (batch.length) await svc.storage.from('uploads').remove(batch);
    }

    await svc.from('projects').update({ mini_project_token: null }).eq('mini_project_token', mini.token);

    await svc.from('mini_projects').delete().eq('id', miniId);
  } else if (row.storage_path) {
    await svc.storage.from('uploads').remove([row.storage_path]);
  }

  const { error: delErr } = await svc.from('files').delete().eq('id', fileId);
  if (delErr) {
    return { ok: false as const, error: delErr.message };
  }

  await revalidatePortfolioContent();
  return { ok: true as const };
}
