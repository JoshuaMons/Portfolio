const TZ = 'Europe/Amsterdam';

export type AuditLogRow = {
  id: string;
  owner_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
};

/** Calendar date YYYY-MM-DD in Europe/Amsterdam for an ISO timestamp */
export function amsterdamDateKey(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Unieke kalenderdagen (Europe/Amsterdam) waarop er logs zijn, nieuwste eerst. */
export function amsterdamDatesWithLogsDesc(rows: AuditLogRow[]): string[] {
  const keys = rows.map((r) => amsterdamDateKey(r.created_at));
  return Array.from(new Set(keys)).sort((a, b) => b.localeCompare(a));
}

export function filterLogsByAmsterdamDate(rows: AuditLogRow[], date: string | null): AuditLogRow[] {
  if (!date) return rows;
  return rows.filter((r) => amsterdamDateKey(r.created_at) === date);
}

export function formatLogLine(row: AuditLogRow): string {
  const when = new Intl.DateTimeFormat('nl-NL', {
    timeZone: TZ,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(row.created_at));
  const id = row.entity_id ? ` (${row.entity_id.slice(0, 8)}…)` : '';
  return `[${when}] ${row.action} · ${row.entity}${id} — ${row.summary}`;
}
