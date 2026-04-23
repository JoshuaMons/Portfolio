import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase.from('projects').select('*').eq('slug', params.slug).eq('status', 'published').maybeSingle()
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

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/projects" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Link>
        </Button>

        {project.url ? (
          <Button asChild variant="outline">
            <a href={project.url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
              Live bekijken <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>

      <div className="glass-surface mt-6 rounded-3xl p-8 shadow-card">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>
      </div>
    </div>
  );
}

