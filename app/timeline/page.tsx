import type { PublishStatus } from '@/types/portfolio';
import { createSupabasePublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-static';

type TimelineItem = {
  id: string;
  title: string;
  period: string;
  description: string;
  order_index: number;
  status: PublishStatus;
};

export default async function TimelinePage() {
  const supabase = createSupabasePublicClient();
  const { data } = supabase
    ? await supabase
        .from('timeline_items')
        .select('id,title,period,description,order_index,status')
        .eq('status', 'published')
        .order('order_index', { ascending: true })
    : { data: null };

  const items = (data as TimelineItem[] | null) ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12">
      <h1 className="text-2xl font-semibold">Timeline</h1>
      <p className="mt-1 text-sm text-muted-foreground">Mijlpalen en studie-voortgang.</p>

      {!supabase && (
        <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Supabase is nog niet geconfigureerd. Voeg env vars toe (zie `.env.example`).
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="glass-surface rounded-3xl p-6 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.period}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{it.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

