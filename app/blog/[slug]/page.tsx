import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createSupabasePublicClient } from '@/lib/supabase/public';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-static';

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  published_at: string | null;
};

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase.from('posts').select('id,title,slug,content,status,published_at').eq('slug', params.slug).eq('status', 'published').maybeSingle()
    : { data: null };

  const post = data as Post | null;

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <p className="text-sm text-muted-foreground">Post niet gevonden.</p>
        <Button asChild variant="link" className="px-0">
          <Link href="/blog">Terug naar logboek</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <Button asChild variant="ghost">
        <Link href="/blog" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Terug
        </Link>
      </Button>

      <article className="glass-surface mt-6 rounded-3xl p-8 shadow-card">
        <h1 className="text-2xl font-semibold">{post.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {post.published_at ? new Date(post.published_at).toLocaleDateString('nl-NL') : null}
        </p>
        <div className="prose prose-slate mt-6 max-w-none">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{post.content}</p>
        </div>
      </article>
    </div>
  );
}

