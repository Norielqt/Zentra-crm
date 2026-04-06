import { useEffect, useState } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart2, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import api from '../../api/axios';
import LoadingScreen from '../../components/ui/LoadingScreen';

// ─── Colour palette ───────────────────────────────────────────────────────────
const STAGE_COLORS = {
  'New Lead':  '#7C3AED',
  'Contacted': '#2563EB',
  'Qualified': '#D97706',
  'Proposal':  '#EA580C',
  'Closed':    '#16A34A',
};

const PIE_COLORS = ['#003148', '#2563EB', '#7C3AED', '#EA580C', '#16A34A', '#D97706', '#0E86D4'];

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span style={{ color: p.color }}>{p.name}:</span>
          <strong>{p.dataKey === 'revenue' ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function FunnelTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span style={{ color: p.color }}>{p.name}:</span>
          <strong>{p.dataKey === 'revenue' ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{d.name}</div>
      <div className="chart-tooltip-row">
        <span>Leads:</span> <strong>{d.value}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Revenue:</span> <strong>{fmt(d.payload.revenue)}</strong>
      </div>
    </div>
  );
}

function ConversionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span style={{ color: p.color }}>{p.name}:</span>
          <strong>{p.dataKey === 'rate' ? `${p.value}%` : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, bg, accent, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg, color: accent }}>{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
      </div>
    </div>
  );
}

// ─── Custom legend for pie ────────────────────────────────────────────────────
function PieLegend({ data }) {
  return (
    <div className="pie-legend">
      {data.map((d, i) => (
        <div key={d.source} className="pie-legend-item">
          <span className="pie-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
          <span className="pie-legend-label">{d.source}</span>
          <span className="pie-legend-value">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  const {
    total_leads, total_revenue, closed_revenue, closed_count, avg_deal_value,
    pipeline_funnel, conversion_funnel, revenue_by_month, leads_by_source,
  } = data;

  // Add colour to each funnel bar
  const funnelWithColor = pipeline_funnel.map((d) => ({ ...d, fill: STAGE_COLORS[d.stage] }));
  const convWithColor   = conversion_funnel.map((d) => ({ ...d, fill: STAGE_COLORS[d.stage] }));

  return (
    <>
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
            <BarChart2 size={18} />
          </div>
          <div className="page-header-text">
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Pipeline performance &amp; revenue insights</p>
          </div>
        </div>
      </div>

      <div className="page-body">

        {/* ── KPI strip ──────────────────────────────────────────────── */}
        <div className="stats-grid">
          <KpiCard
            icon={<Users size={20} />}
            bg="var(--primary-light)"
            accent="var(--primary)"
            label="Total Leads"
            value={total_leads}
          />
          <KpiCard
            icon={<DollarSign size={20} />}
            bg="#D1FAE5"
            accent="#16A34A"
            label="Pipeline Revenue"
            value={fmt(total_revenue)}
          />
          <KpiCard
            icon={<Award size={20} />}
            bg="#FEF3C7"
            accent="#D97706"
            label="Closed Revenue"
            value={`${fmt(closed_revenue)} (${closed_count} deals)`}
          />
          <KpiCard
            icon={<TrendingUp size={20} />}
            bg="#DBEAFE"
            accent="#2563EB"
            label="Avg Deal Value"
            value={fmt(avg_deal_value)}
          />
        </div>

        {/* ── Revenue over time + Lead source ───────────────────────── */}
        <div className="analytics-row-two">

          {/* Area chart: Revenue over time */}
          <div className="card analytics-card-wide">
            <div className="card-header">
              <span className="card-title">Revenue Over Time</span>
              <span className="card-subtitle">Last 6 months · by lead creation date</span>
            </div>
            <div className="card-body chart-body">
              {revenue_by_month.length === 0 ? (
                <p className="chart-empty">No revenue data for the last 6 months.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revenue_by_month} margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#2563EB"
                      strokeWidth={2}
                      fill="url(#revenueGrad)"
                      dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie chart: Lead source breakdown */}
          <div className="card analytics-card-narrow">
            <div className="card-header">
              <span className="card-title">Lead Sources</span>
            </div>
            <div className="card-body chart-body">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={leads_by_source}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {leads_by_source.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={leads_by_source} />
            </div>
          </div>
        </div>

        {/* ── Pipeline funnel + Conversion funnel ───────────────────── */}
        <div className="analytics-row-two">

          {/* Bar chart: Pipeline funnel (leads per stage) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Funnel</span>
              <span className="card-subtitle">Leads &amp; revenue per stage</span>
            </div>
            <div className="card-body chart-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={funnelWithColor} margin={{ top: 8, right: 16, left: 10, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<FunnelTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar yAxisId="left"  dataKey="count"   name="Leads"   radius={[4, 4, 0, 0]}>
                    {funnelWithColor.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} fill="#94A3B8" opacity={0.45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizontal bar chart: Conversion rate per stage */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Conversion Funnel</span>
              <span className="card-subtitle">% of leads that reached each stage</span>
            </div>
            <div className="card-body chart-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={convWithColor}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip content={<ConversionTooltip />} />
                  <Bar dataKey="rate" name="Conversion rate" radius={[0, 4, 4, 0]}>
                    {convWithColor.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
