'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ChartConfig } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#2dd4bf'];

interface Props {
  config: ChartConfig;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg p-3 text-sm">
      {label && <p className="font-medium text-slate-700 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.payload?.fill ?? p.color }}>
          {p.name ?? p.payload?.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function CategoryChart({ config }: Props) {
  const { lang } = useLanguage();
  const title = lang === 'nl' ? config.titleNl : config.titleEn;
  const nameKey = config.nameKey ?? 'name';
  const valueKey = config.valueKey ?? 'value';

  if (config.type === 'pie') {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={config.data}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              labelLine={false}
              label={renderCustomLabel}
            >
              {config.data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={config.data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
            {config.data.map((entry, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
