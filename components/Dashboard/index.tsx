'use client';

import { useDatabase } from '@/contexts/DatabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import MetricCards from './MetricCards';
import TimeSeriesChart from './TimeSeriesChart';
import CategoryChart from './CategoryChart';
import DataTable from './DataTable';
import { ChartConfig } from '@/types';
import { BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const { database, analytics } = useDatabase();
  const { t } = useLanguage();

  if (!database || !analytics) return null;

  const primary = database.tables[0];
  const { metrics, charts } = analytics;

  const timeSeries = charts.find((c) => c.id === 'time_series');
  const categoryCharts = charts.filter((c) => c.id !== 'time_series');

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <MetricCards metrics={metrics} />

      {/* Time series full width */}
      {timeSeries && (
        <TimeSeriesChart config={timeSeries} />
      )}

      {/* Category charts grid */}
      {categoryCharts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categoryCharts.map((chart: ChartConfig) =>
            chart.type === 'pie' ? (
              <CategoryChart key={chart.id} config={chart} />
            ) : (
              <CategoryChart key={chart.id} config={chart} />
            )
          )}
        </div>
      ) : (
        !timeSeries && (
          <div className="card p-12 flex flex-col items-center gap-3 text-slate-400">
            <BarChart2 className="w-10 h-10" />
            <p className="text-sm">{t('noCharts')}</p>
          </div>
        )
      )}

      {/* Data table */}
      {primary && <DataTable table={primary} />}
    </div>
  );
}
