'use client';

import { useState, useMemo } from 'react';
import { ParsedTable, TableAnalytics, FilterRule } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { applyFilters } from '@/lib/filters';
import { analyseTable } from '@/lib/analytics';
import MetricCards from './MetricCards';
import TimeSeriesChart from './TimeSeriesChart';
import CategoryChart from './CategoryChart';
import DataTable from './DataTable';
import FilterPanel from './FilterPanel';
import StatsPanel from './StatsPanel';
import { BarChart2 } from 'lucide-react';

interface Props {
  table: ParsedTable;
  analytics: TableAnalytics;
}

export default function TableTab({ table, analytics }: Props) {
  const { t } = useLanguage();
  const [appliedFilters, setAppliedFilters] = useState<FilterRule[]>([]);

  const filteredData = useMemo(
    () => applyFilters(table.data, appliedFilters),
    [table.data, appliedFilters]
  );

  // Re-run analytics on filtered data when filters are active so charts/metrics adapt
  const filteredTable = useMemo<ParsedTable>(
    () => ({ ...table, data: filteredData, rowCount: filteredData.length }),
    [table, filteredData]
  );
  const liveAnalytics = useMemo(
    () => appliedFilters.length > 0 ? analyseTable(filteredTable) : analytics,
    [filteredTable, analytics, appliedFilters.length]
  );

  const { metrics, charts } = liveAnalytics;
  // Route by key presence: xKey → vertical axis chart (TimeSeriesChart); nameKey → categorical (CategoryChart)
  const timeSeries = charts.find((c) => c.type === 'area' || c.type === 'line');
  const gridCharts = charts.filter((c) => c.type !== 'area' && c.type !== 'line');

  return (
    <div className="space-y-5">
      {/* Filter builder — passes appliedFilters so panel can show what's active */}
      <FilterPanel
        columns={table.columns}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
      />

      {/* KPI cards */}
      <MetricCards metrics={metrics} />

      {/* Time series full width */}
      {timeSeries && <TimeSeriesChart config={timeSeries} />}

      {/* Bar/pie charts in a responsive grid — route by xKey vs nameKey */}
      {gridCharts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {gridCharts.map((c) =>
            c.xKey
              ? <TimeSeriesChart key={c.id} config={c} />
              : <CategoryChart key={c.id} config={c} />
          )}
        </div>
      )}

      {charts.length === 0 && (
        <div className="card p-10 flex flex-col items-center gap-3 text-slate-400">
          <BarChart2 className="w-8 h-8" />
          <p className="text-sm">{t('noCharts')}</p>
        </div>
      )}

      {/* Column stats for numeric columns */}
      <StatsPanel table={table} data={filteredData} />

      {/* Data table — shows filtered rows, total row count always visible */}
      <DataTable table={table} data={filteredData} />
    </div>
  );
}
