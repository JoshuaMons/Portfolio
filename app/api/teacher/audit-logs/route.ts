import { NextResponse } from 'next/server';

import { requireTeacherServiceClient } from '@/lib/teacher-route-auth';
import type { AuditLogRow } from '@/lib/teacher-audit-log';

export async function GET() {
  const auth = await requireTeacherServiceClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const { data: rows, error } = await auth.serviceClient
    .from('audit_logs')
    .select('id,owner_id,action,entity,entity_id,summary,created_at')
    .eq('owner_id', auth.adminUserId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (rows as AuditLogRow[]) ?? [] });
}
