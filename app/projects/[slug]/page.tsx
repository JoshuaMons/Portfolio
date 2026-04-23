import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

import type { Project } from '@/types/portfolio';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { ProjectDetailClient } from '@/app/projects/project-detail-client';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase
        .from('projects')
        .select('*')
        .eq('slug', params.slug)
        .eq('status', 'published')
        .eq('show_on_website', true)
        .maybeSingle()
    : { data: null };

  const project = data as Project | null;

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <p className="text-sm text-muted-foreground">Project niet gevonden.</p>
        <Button asChild variant="link" className="px-0">
          <Link href="/projects">Terug naar projecten</Link>
        </Button>
      </div>
    );
  }

  let miniAllowed = false;
  const token = project.mini_project_token;
  if (token && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: m } = await svc.from('mini_projects').select('show_on_website').eq('token', token).maybeSingle();
    miniAllowed = m?.show_on_website === true;
  }

  const safeProject: Project = {
    ...project,
    mini_project_token: miniAllowed ? project.mini_project_token : null,
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/projects" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Link>
        </Button>
      </div>

      <ProjectDetailClient project={safeProject} />
    </div>
  );
}
