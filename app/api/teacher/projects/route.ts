import { NextResponse } from 'next/server';

import { requireTeacherServiceClient } from '@/lib/teacher-route-auth';

/** Gepubliceerde projecten alleen als expliciet voor docenten gemarkeerd (`show_for_teacher`). */
export async function GET() {
  const auth = await requireTeacherServiceClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let q = auth.serviceClient
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .eq('show_for_teacher', true)
    .eq('owner_id', auth.adminUserId)
    .order('updated_at', { ascending: false });

  const { data: rows, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (rows ?? []).map((row: Record<string, unknown>) => {
    const token = row.mini_project_token as string | null | undefined;
    return { ...row, mini_project_token: token };
  });

  return NextResponse.json({ data: items });
}
