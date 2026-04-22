import { ParsedTable, MetricCard, ChartConfig, ChatbotColumns, AnalyticsResult, ColumnType } from '@/types';

// ─── Keyword banks (EN + NL) ──────────────────────────────────────────────────

const KEYWORDS: Record<keyof ChatbotColumns, string[]> = {
  date: ['date', 'datum', 'created', 'aangemaakt', 'timestamp', 'tijdstip', 'created_at', 'aangemaakt_op', 'started', 'gestart', 'time', 'tijd', 'datetime', 'modified', 'updated'],
  handover: ['handover', 'overdracht', 'escalation', 'escalatie', 'transfer', 'overdragen'],
  status: ['status', 'staat', 'state', 'resolved', 'opgelost', 'result', 'resultaat', 'outcome', 'uitkomst'],
  reason: ['reason', 'reden', 'cause', 'oorzaak', 'category', 'categorie', 'type', 'soort', 'subject', 'onderwerp', 'topic', 'onderwerp', 'intent', 'intentie'],
  agent: ['agent', 'medewerker', 'operator', 'employee', 'werknemer', 'assignee', 'toegewezen', 'handler', 'behandelaar', 'user', 'gebruiker'],
  channel: ['channel', 'kanaal', 'source', 'bron', 'medium', 'platform', 'origin', 'herkomst'],
  duration: ['duration', 'duur', 'time_spent', 'bestede_tijd', 'handle_time', 'afhandeltijd', 'waiting', 'wachttijd', 'seconds', 'minutes', 'minuten'],
  customer: ['customer', 'klant', 'client', 'visitor', 'bezoeker', 'contact', 'naam', 'name', 'user_id', 'customer_id', 'klant_id'],
  resolved: ['resolved', 'opgelost', 'closed', 'gesloten', 'done', 'klaar', 'finished', 'afgerond', 'completed', 'voltooid'],
};

function matchesKeyword(colName: string, keywords: string[]): boolean {
  const lower = colName.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function detectChatbotColumns(table: ParsedTable): ChatbotColumns {
  const result: ChatbotColumns = {};
  const cols = table.columns;

  for (const [role, keywords] of Object.entries(KEYWORDS) as [keyof ChatbotColumns, string[]][]) {
    const match = cols.find((c) => matchesKeyword(c.originalName, keywords));
    if (match) result[role] = match.originalName;
  }

  // Prefer date columns typed as 'date' over keyword-matched text columns
  const dateTypedCol = cols.find((c) => c.inferredType === 'date');
  if (dateTypedCol && !result.date) result.date = dateTypedCol.originalName;

  return result;
}

function chatbotScore(cb: ChatbotColumns): number {
  const keys = Object.keys(cb) as (keyof ChatbotColumns)[];
  return keys.length;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Metric builders ──────────────────────────────────────────────────────────

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#2dd4bf'];

function buildMetrics(table: ParsedTable, cb: ChatbotColumns, isChatbot: boolean): MetricCard[] {
  const metrics: MetricCard[] = [];

  // Total records
  metrics.push({
    key: 'total',
    titleEn: isChatbot ? 'Total Handovers' : 'Total Records',
    titleNl: isChatbot ? 'Totaal Handovers' : 'Totaal Records',
    value: table.rowCount.toLocaleString(),
    icon: 'database',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  });

  // Date range
  if (cb.date) {
    const dates = table.data
      .map((r) => parseDate(r[cb.date!]))
      .filter(Boolean) as Date[];
    if (dates.length) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const first = toYYYYMMDD(dates[0]);
      const last = toYYYYMMDD(dates[dates.length - 1]);

      // Count last 7 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const recent = dates.filter((d) => d >= cutoff).length;

      metrics.push({
        key: 'this_week',
        titleEn: 'Last 7 Days',
        titleNl: 'Laatste 7 Dagen',
        value: recent.toLocaleString(),
        icon: 'calendar',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });

      metrics.push({
        key: 'date_range',
        titleEn: 'Date Range',
        titleNl: 'Datumbereik',
        value: `${first} – ${last}`,
        icon: 'clock',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
      });
    }
  }

  // Resolution rate
  if (cb.resolved || cb.status) {
    const col = cb.resolved ?? cb.status!;
    const vals = table.data.map((r) => String(r[col] ?? '').toLowerCase());
    const resolvedKw = ['resolved', 'opgelost', 'closed', 'gesloten', 'done', 'klaar', 'true', '1', 'yes', 'ja', 'completed', 'voltooid', 'finished', 'afgerond'];
    const resolved = vals.filter((v) => resolvedKw.some((kw) => v.includes(kw))).length;
    const rate = vals.length ? Math.round((resolved / vals.length) * 100) : 0;
    metrics.push({
      key: 'resolved',
      titleEn: 'Resolution Rate',
      titleNl: 'Oplossingspercentage',
      value: `${rate}%`,
      icon: 'check-circle',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    });
  }

  // Duration
  if (cb.duration) {
    const vals = table.data
      .map((r) => Number(r[cb.duration!]))
      .filter((n) => !isNaN(n) && n > 0);
    if (vals.length) {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      metrics.push({
        key: 'avg_duration',
        titleEn: 'Avg. Duration',
        titleNl: 'Gem. Duur',
        value: avg >= 60 ? `${Math.round(avg / 60)} min` : `${avg}s`,
        icon: 'timer',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      });
    }
  }

  // Top reason/channel/agent
  for (const [roleKey, icon, enTitle, nlTitle] of [
    ['reason', 'tag', 'Top Reason', 'Toprede'],
    ['channel', 'globe', 'Top Channel', 'Topkanaal'],
    ['agent', 'user', 'Top Agent', 'Topmedewerker'],
  ] as [keyof ChatbotColumns, string, string, string][]) {
    const col = cb[roleKey];
    if (!col) continue;
    const freq: Record<string, number> = {};
    table.data.forEach((r) => {
      const v = String(r[col] ?? '').trim();
      if (v) freq[v] = (freq[v] ?? 0) + 1;
    });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      metrics.push({
        key: `top_${roleKey}`,
        titleEn: enTitle,
        titleNl: nlTitle,
        value: top[0],
        icon,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
      });
    }
  }

  return metrics;
}

// ─── Chart builders ───────────────────────────────────────────────────────────

function buildTimeSeries(table: ParsedTable, dateCol: string): ChartConfig | null {
  const freq: Record<string, number> = {};
  table.data.forEach((r) => {
    const d = parseDate(r[dateCol]);
    if (d) {
      const key = toYYYYMMDD(d);
      freq[key] = (freq[key] ?? 0) + 1;
    }
  });
  const data = Object.entries(freq)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  if (data.length < 2) return null;

  return {
    id: 'time_series',
    type: 'area',
    titleEn: 'Volume Over Time',
    titleNl: 'Volume in de Tijd',
    data,
    xKey: 'date',
    yKey: 'count',
    colors: ['#6366f1'],
  };
}

function buildCategoryChart(
  table: ParsedTable,
  colName: string,
  titleEn: string,
  titleNl: string,
  chartType: 'bar' | 'pie' = 'bar',
  id?: string
): ChartConfig | null {
  const freq: Record<string, number> = {};
  table.data.forEach((r) => {
    const v = String(r[colName] ?? '').trim();
    if (v) freq[v] = (freq[v] ?? 0) + 1;
  });

  const data = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  if (data.length < 2) return null;

  return {
    id: id ?? `cat_${colName}`,
    type: chartType,
    titleEn,
    titleNl,
    data,
    nameKey: 'name',
    valueKey: 'value',
    colors: CHART_COLORS,
  };
}

function buildNumericChart(table: ParsedTable, colName: string): ChartConfig | null {
  const vals = table.data
    .map((r) => Number(r[colName]))
    .filter((n) => !isNaN(n));
  if (vals.length < 5) return null;

  vals.sort((a, b) => a - b);
  const min = vals[0];
  const max = vals[vals.length - 1];
  const buckets = 10;
  const step = (max - min) / buckets || 1;
  const hist: Record<string, number> = {};
  vals.forEach((v) => {
    const bucket = Math.floor((v - min) / step) * step + min;
    const label = `${Math.round(bucket)}`;
    hist[label] = (hist[label] ?? 0) + 1;
  });

  const data = Object.entries(hist)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([name, value]) => ({ name, value }));

  return {
    id: `num_${colName}`,
    type: 'bar',
    titleEn: `Distribution: ${colName}`,
    titleNl: `Verdeling: ${colName}`,
    data,
    xKey: 'name',
    yKey: 'value',
    colors: ['#6366f1'],
  };
}

// ─── Main analytics function ──────────────────────────────────────────────────

export function analyseDatabase(tables: ParsedTable[]): AnalyticsResult {
  if (!tables.length) {
    return { metrics: [], charts: [], isChatbotData: false, chatbotColumns: {} };
  }

  // Pick the largest table as primary
  const primary = tables.reduce((a, b) => (a.rowCount >= b.rowCount ? a : b));
  const cb = detectChatbotColumns(primary);
  const score = chatbotScore(cb);
  const isChatbot = score >= 2;

  const metrics = buildMetrics(primary, cb, isChatbot);
  const charts: ChartConfig[] = [];

  // Time series
  if (cb.date) {
    const ts = buildTimeSeries(primary, cb.date);
    if (ts) charts.push(ts);
  }

  // Chatbot-specific charts
  if (isChatbot) {
    if (cb.reason) {
      const c = buildCategoryChart(primary, cb.reason, 'Handovers by Reason', 'Handovers per Reden', 'bar', 'reason');
      if (c) charts.push(c);
    }
    if (cb.channel) {
      const c = buildCategoryChart(primary, cb.channel, 'Handovers by Channel', 'Handovers per Kanaal', 'pie', 'channel');
      if (c) charts.push(c);
    }
    if (cb.agent) {
      const c = buildCategoryChart(primary, cb.agent, 'Handovers by Agent', 'Handovers per Medewerker', 'bar', 'agent');
      if (c) charts.push(c);
    }
    if (cb.status) {
      const c = buildCategoryChart(primary, cb.status, 'Handovers by Status', 'Handovers per Status', 'pie', 'status');
      if (c) charts.push(c);
    }
  }

  // Generic charts for non-chatbot columns
  const coveredCols = new Set(Object.values(cb).filter(Boolean));
  const remaining = primary.columns.filter((c) => !coveredCols.has(c.originalName));

  for (const col of remaining) {
    if (charts.length >= 8) break;
    if (col.inferredType === 'category' && col.uniqueCount >= 2) {
      const c = buildCategoryChart(primary, col.originalName, `Count by ${col.originalName}`, `Aantal per ${col.originalName}`, 'bar');
      if (c) charts.push(c);
    } else if (col.inferredType === 'number') {
      const c = buildNumericChart(primary, col.originalName);
      if (c) charts.push(c);
    }
  }

  return { metrics, charts, isChatbotData: isChatbot, chatbotColumns: cb };
}
