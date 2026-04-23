import Link from 'next/link';

import type { Project } from '@/types/portfolio';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { Button } from '@/components/ui/button';
import { ProjectsClient } from './projects-client';

export const dynamic = 'force-static';

export default async function ProjectsPage() {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase.from('projects').select('*').eq('status', 'published').order('updated_at', { ascending: false })
    : { data: null };

  const projects = (data as Project[] | null) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projecten</h1>
          <p className="mt-1 text-sm text-muted-foreground">Selecteer een project voor details en preview.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Admin</Link>
        </Button>
      </div>

      <ProjectsClient initialProjects={projects} supabaseConfigured={Boolean(supabase)} />
    </div>
  );
}

