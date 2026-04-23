import Link from 'next/link';

import { createSupabasePublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-static';

type Post = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
};

export default async function BlogPage() {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase
        .from('posts')
        .select('id,title,slug,status,published_at,created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
    : { data: null };

  const posts = (data as Post[] | null) ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12">
      <h1 className="text-2xl font-semibold">Logboek</h1>
      <p className="mt-1 text-sm text-muted-foreground">Updates en voortgang.</p>

      {!supabase && (
        <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Supabase is nog niet geconfigureerd. Voeg env vars toe (zie `.env.example`).
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="glass-surface rounded-3xl p-6 shadow-card">
            <p className="font-semibold">{p.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.published_at ? new Date(p.published_at).toLocaleDateString('nl-NL') : '—'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

