import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fmtDate(value: string) {
  try {
    return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminHomePage() {
  const supabase = createSupabaseServerClient();

  const [audit, projectsCount, teacherCount, filesCount] = await Promise.all([
    supabase.from('audit_logs').select('id,action,entity,summary,created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('projects').select('*', { head: true, count: 'exact' }),
    supabase.from('teacher_assignments').select('*', { head: true, count: 'exact' }),
    supabase.from('files').select('*', { head: true, count: 'exact' }),
  ]);

  const auditRows = audit.data ?? [];

  return (
    <div>
      <h1 className="text-xl font-semibold">Overzicht</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Hier beheer je projecten, logboekposts en timeline items.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="glass-surface rounded-3xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Projecten</p>
          <p className="mt-2 text-3xl font-semibold">{projectsCount.count ?? 0}</p>
        </div>
        <div className="glass-surface rounded-3xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Docent opdrachten</p>
          <p className="mt-2 text-3xl font-semibold">{teacherCount.count ?? 0}</p>
        </div>
        <div className="glass-surface rounded-3xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Uploads</p>
          <p className="mt-2 text-3xl font-semibold">{filesCount.count ?? 0}</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Laatste updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">De laatste 10 acties uit de audit log.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {audit.error ? (
            <p className="text-sm text-red-600">{audit.error.message}</p>
          ) : auditRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen updates.</p>
          ) : (
            auditRows.map((row: any) => (
              <div key={row.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {row.action} · {row.entity}
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{row.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

