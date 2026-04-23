import type { AuditLogRow } from '@/lib/teacher-audit-log';
import { amsterdamDateKey } from '@/lib/teacher-audit-log';

const TZ = 'Europe/Amsterdam';

/** Korte NL-samenvatting voor docenten: wat er aan het portfolio is gedaan (uit audit_logs). */
export function buildWorkOverview(rows: AuditLogRow[]): string {
  if (!rows.length) {
    return 'In de laatste 30 dagen zijn er nog geen registraties in het technische logboek. Zodra de beheerder wijzigingen doet (projecten, uploads, profiel, …), verschijnen die hier als overzicht.';
  }

  const byAction = new Map<string, number>();
  const byEntity = new Map<string, number>();
  for (const r of rows) {
    byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1);
    byEntity.set(r.entity, (byEntity.get(r.entity) ?? 0) + 1);
  }

  const topActions = Array.from(byAction.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topEntities = Array.from(byEntity.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const dates = rows.map((r) => amsterdamDateKey(r.created_at));
  const minD = dates.reduce((a, b) => (a < b ? a : b));
  const maxD = dates.reduce((a, b) => (a > b ? a : b));

  const fmtRange = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, dateStyle: 'medium' });
  const rangeLabel =
    minD === maxD ? fmtRange.format(new Date(rows[0]!.created_at)) : `${minD} t/m ${maxD}`;

  const promptish = rows.filter(
    (r) =>
      /\bprompt\b/i.test(r.summary) ||
      /\bcursor\b/i.test(r.summary) ||
      /\bai\b/i.test(r.summary) ||
      /\bchatgpt\b/i.test(r.summary)
  );
  const highlights = rows.slice(0, 12).map((r) => {
    const d = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(r.created_at)
    );
    return `• ${d} — ${r.action} · ${r.entity}: ${r.summary}`;
  });

  const lines: string[] = [];
  lines.push(`Overzicht portfolio-werk (${rows.length} registraties, periode ${rangeLabel})`);
  lines.push('');
  lines.push(
    'Dit logboek is een technische tijdlijn (wijzigingen in de app), geen letterlijke Cursor-chat. ' +
      'Het helpt wel om te zien welke onderdelen zijn aangepast en wanneer — handig voor begeleiding of verslag.'
  );
  lines.push('');
  lines.push(`Activiteit: ${topActions.map(([a, n]) => `${a} (${n}×)`).join(', ')}.`);
  lines.push(`Onderdelen: ${topEntities.map(([e, n]) => `${e} (${n}×)`).join(', ')}.`);
  if (promptish.length) {
    lines.push('');
    lines.push(
      `Er zijn ${promptish.length} regels die expliciet verwijzen naar prompts/AI-tools — zie tijdlijn hieronder.`
    );
  }
  lines.push('');
  lines.push('Tijdlijn (recentste eerst):');
  lines.push(...highlights);

  return lines.join('\n');
}
