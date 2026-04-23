import { Document, Packer, Paragraph } from 'docx';
import { NextResponse } from 'next/server';

import { requireTeacherServiceClient } from '@/lib/teacher-route-auth';
import type { AuditLogRow } from '@/lib/teacher-audit-log';
import { filterLogsByAmsterdamDate, formatLogLine } from '@/lib/teacher-audit-log';

function parseBodyDate(raw: unknown): { ok: true; date: string | null } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, date: null };
  if (raw === null) return { ok: true, date: null };
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: true, date: raw };
  return { ok: false, error: 'Ongeldige date (verwacht YYYY-MM-DD of null)' };
}

export async function POST(req: Request) {
  const auth = await requireTeacherServiceClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const dateField =
    typeof body === 'object' && body !== null && 'date' in body ? (body as { date: unknown }).date : undefined;
  const parsed = parseBodyDate(dateField);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { date } = parsed;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const { data: rows, error } = await auth.serviceClient
    .from('audit_logs')
    .select('id,owner_id,action,entity,entity_id,summary,created_at')
    .eq('owner_id', auth.adminUserId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = filterLogsByAmsterdamDate((rows as AuditLogRow[]) ?? [], date);
  const lines = filtered.map(formatLogLine);
  const paragraphs =
    lines.length > 0
      ? lines.map((line) => new Paragraph({ text: line }))
      : [new Paragraph({ text: 'Geen logs in deze periode.' })];

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = date ? `logboek-${date}.docx` : 'logboek-30dagen.docx';

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
