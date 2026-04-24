import { headers } from 'next/headers';

import type { Project } from '@/types/portfolio';
import type { PublicFile } from '@/app/files/files-client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProjectsClient } from './projects-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectsPage() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = host ? `${proto}://${host}` : '';

  let viewerIsLoggedIn = false;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    viewerIsLoggedIn = Boolean(data.user);
  } catch {
    viewerIsLoggedIn = false;
  }

  const [projRes, filesRes] = await Promise.all([
    baseUrl
      ? fetch(`${baseUrl}/api/projects/public?limit=120&offset=0`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
    baseUrl && viewerIsLoggedIn
      ? fetch(`${baseUrl}/api/files/public`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const projJson = projRes?.ok ? await projRes.json().catch(() => ({})) : {};
  const projects = (projJson?.data as Project[] | undefined) ?? [];
  const filesJson = filesRes?.ok ? await filesRes.json().catch(() => ({})) : {};
  const publicFiles = (filesJson?.data as PublicFile[] | undefined) ?? [];
  const filesFetchFailed = Boolean(baseUrl && viewerIsLoggedIn && filesRes && !filesRes.ok);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projecten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecteer een project voor details en preview.
            {viewerIsLoggedIn ? ' Publieke uploads staan hieronder op één plek.' : ''}
          </p>
        </div>
      </div>

      <ProjectsClient
        initialProjects={projects}
        initialPublicFiles={publicFiles}
        supabaseConfigured={Boolean(baseUrl)}
        viewerIsLoggedIn={viewerIsLoggedIn}
        filesFetchFailed={filesFetchFailed}
        projectsFetchFailed={Boolean(baseUrl && projRes && !projRes.ok)}
      />
    </div>
  );
}

