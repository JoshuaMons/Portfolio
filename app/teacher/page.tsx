import type { Project } from '@/types/portfolio';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { TeacherPortfolioClient } from './teacher-portfolio-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherPage() {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase.from('projects').select('*').eq('status', 'published').order('updated_at', { ascending: false })
    : { data: null };

  const projects = (data as Project[] | null) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <TeacherPortfolioClient projects={projects} />
    </div>
  );
}

