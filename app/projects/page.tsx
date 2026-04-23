import { headers } from 'next/headers';

import type { Project } from '@/types/portfolio';
import type { PublicFile } from '@/app/files/files-client';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { ProjectsClient } from './projects-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectsPage() {
  const supabase = createSupabasePublicClient();

  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = host ? `${proto}://${host}` : '';

  const [{ data }, filesRes] = await Promise.all([
    supabase
      ? supabase.from('projects').select('*').eq('status', 'published').order('updated_at', { ascending: false })
      : Promise.resolve({ data: null as Project[] | null }),
    baseUrl ? fetch(`${baseUrl}/api/files/public`, { cache: 'no-store' }).catch(() => null) : Promise.resolve(null),
  ]);

  const projects = (data as Project[] | null) ?? [];
  const filesJson = filesRes?.ok ? await filesRes.json().catch(() => ({})) : {};
  const publicFiles = (filesJson?.data as PublicFile[] | undefined) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projecten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecteer een project voor details en preview. Publieke uploads staan hieronder op één plek.
          </p>
        </div>
      </div>

      <ProjectsClient
        initialProjects={projects}
        initialPublicFiles={publicFiles}
        supabaseConfigured={Boolean(supabase)}
        filesFetchFailed={Boolean(baseUrl && filesRes && !filesRes.ok)}
      />
    </div>
  );
}

