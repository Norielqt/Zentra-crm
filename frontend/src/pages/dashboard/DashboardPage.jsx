import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, CheckSquare, TrendingUp, Sparkles, AlertTriangle, AlertCircle, Info, CheckCircle2, Zap, RefreshCw, ArrowRight, LayoutDashboard } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/ui/LoadingScreen';

const STATUSES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed'];

const STATUS_COLORS = {
  'New Lead':  '#7C3AED',
  'Contacted': '#1E40AF',
  'Qualified': '#92400E',
  'Proposal':  '#9A3412',
  'Closed':    '#065F46',
};

const STATUS_TRACK_COLORS = {
  'New Lead':  '#EDE9FE',
  'Contacted': '#DBEAFE',
  'Qualified': '#FEF3C7',
  'Proposal':  '#FED7AA',
  'Closed':    '#D1FAE5',
};

const INSIGHT_CONFIG = {
  urgent:  { icon: AlertTriangle, label: 'Urgent',      type: 'urgent'  },
  warning: { icon: AlertCircle,   label: 'Heads up',    type: 'warning' },
  action:  { icon: Zap,           label: 'Opportunity', type: 'action'  },
  info:    { icon: Info,          label: 'Info',        type: 'info'    },
  success: { icon: CheckCircle2,  label: 'Great work',  type: 'success' },
};

const ONBOARDING_DISMISSED_KEY = (userId) => `zentra_onboarding_dismissed_${userId}`;

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

function PipelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{d.name}</div>
      <div className="chart-tooltip-row">
        <span>Leads:</span> <strong>{d.value}</strong>
      </div>
      {d.payload.revenue > 0 && (
        <div className="chart-tooltip-row">
          <span>Revenue:</span> <strong>{fmt(d.payload.revenue)}</strong>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [activities, setActivities] = useState([]);
  const [insights, setInsights]   = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onboarding, setOnboarding] = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const fetchInsights = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const { data } = await api.get('/insights');
      setInsights(data);
    } finally {
      setInsightsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      setOnboardingDismissed(
        localStorage.getItem(ONBOARDING_DISMISSED_KEY(user.id)) === 'true'
      );
    }
  }, [user?.id]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/activities'),
      api.get('/onboarding'),
    ]).then(([statsRes, activitiesRes, onboardingRes]) => {
      setStats(statsRes.data);
      setActivities(activitiesRes.data.slice(0, 6));
      setOnboarding(onboardingRes.data);
    }).finally(() => setLoading(false));

    fetchInsights();
  }, [fetchInsights]);

  const dismissOnboarding = () => {
    if (user?.id) localStorage.setItem(ONBOARDING_DISMISSED_KEY(user.id), 'true');
    setOnboardingDismissed(true);
  };

  if (loading) return <LoadingScreen />;

  const showOnboarding = onboarding && !onboarding.all_done && !onboardingDismissed;

  const pipelineChartData = STATUSES
    .map((s) => ({
      name: s,
      value: stats?.leads_by_status?.[s] ?? 0,
      revenue: stats?.revenue_by_status?.[s] ?? 0,
      color: STATUS_COLORS[s],
    }))
    .filter((d) => d.value > 0);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <LayoutDashboard size={18} />
          </div>
          <div className="page-header-text">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {showOnboarding && (
          <OnboardingPanel steps={onboarding.steps} onDismiss={dismissOnboarding} />
        )}

        {/* Stats Row */}
        <div className="stats-grid">
          <StatCard
            icon={<Users size={20} color="#003148" />}
            bg="var(--primary-light)"
            label="Total Leads"
            value={stats?.total_leads ?? 0}
            accent="var(--primary)"
          />
          <StatCard
            icon={<UserCheck size={20} color="#065F46" />}
            bg="#D1FAE5"
            label="Total Clients"
            value={stats?.total_clients ?? 0}
            accent="#1A9E53"
          />
          <StatCard
            icon={<CheckSquare size={20} color="#92400E" />}
            bg="#FEF3C7"
            label="Tasks Pending"
            value={stats?.tasks_pending ?? 0}
            accent="#D97706"
          />
          <StatCard
            icon={<TrendingUp size={20} color="#1E40AF" />}
            bg="#DBEAFE"
            label="Tasks Completed"
            value={stats?.tasks_completed ?? 0}
            accent="#1E40AF"
          />
        </div>

        {/* Pipeline + Activity + AI Insights */}
        <div className="dashboard-bottom-grid">
          {/* Pipeline Overview */}
          <div className="card" style={{ gridColumn: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Pipeline Overview</span>
              <span className="card-subtitle">
                {stats?.total_revenue_pipeline > 0
                  ? fmt(stats.total_revenue_pipeline) + ' total'
                  : `${stats?.total_leads ?? 0} leads`}
              </span>
            </div>
            <div className="card-body chart-body">
              {pipelineChartData.length === 0 ? (
                <p className="chart-empty">No leads in pipeline yet.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pipelineChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {pipelineChartData.map((d, i) => (
                          <Cell key={i} fill={d.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<PipelineTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {pipelineChartData.map((d) => (
                      <div key={d.name} className="pie-legend-item">
                        <span className="pie-legend-dot" style={{ background: d.color }} />
                        <span className="pie-legend-label">{d.name}</span>
                        <span className="pie-legend-value">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ gridColumn: 2, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
              <span className="card-subtitle">Last 6 actions</span>
            </div>
            <div className="card-body" style={{ padding: '0 22px', flex: 1, overflowY: 'auto' }}>
              {activities.length === 0 ? (
                <p className="text-muted" style={{ padding: '20px 0', fontSize: 13 }}>No activity yet.</p>
              ) : (
                <div className="activity-list">
                  {activities.map((a) => (
                    <div className="activity-item" key={a.id}>
                      <div className={`activity-avatar${a.user?.name ? '' : ' activity-avatar--system'}`}>
                        {a.user?.name
                          ? a.user.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
                          : 'Z'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-message">{a.message}</div>
                        <div className="activity-footer">
                          {a.user?.name && <span className="activity-author">{a.user.name}</span>}
                          {a.user?.name && <span className="activity-sep">·</span>}
                          <span>{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Insights — full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <InsightsPanel
              insights={insights}
              loading={insightsLoading}
              refreshing={refreshing}
              onRefresh={() => fetchInsights(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function OnboardingPanel({ steps, onDismiss }) {
  const navigate = useNavigate();
  const done = steps.filter((s) => s.done).length;
  const pct  = Math.round((done / steps.length) * 100);

  return (
    <div className="onboarding-panel">
      <div className="onboarding-header">
        <div className="onboarding-header-left">
          <CheckCircle2 size={20} className="onboarding-icon" />
          <div>
            <div className="onboarding-title">Getting Started</div>
            <div className="onboarding-subtitle">{done} of {steps.length} steps completed</div>
          </div>
          <span className="onboarding-badge">{pct}%</span>
        </div>
        <button className="onboarding-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>

      <div className="onboarding-progress-track">
        <div className="onboarding-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="onboarding-steps">
        {steps.map((step) => (
          <div key={step.key} className={`onboarding-step${step.done ? ' done' : ''}`}>
            <div className="onboarding-step-check">
              {step.done && <CheckCircle2 size={14} />}
            </div>
            <div className="onboarding-step-body">
              <div className="onboarding-step-label">{step.label}</div>
              <div className="onboarding-step-desc">{step.description}</div>
            </div>
            {!step.done && step.action && (
              <button
                className="onboarding-step-btn"
                onClick={() => navigate(step.action.path)}
              >
                {step.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsPanel({ insights, loading, refreshing, onRefresh }) {
  const navigate = useNavigate();

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="insights-header-left">
          <div className="insights-icon-wrap">
            <Sparkles size={15} />
          </div>
          <div>
            <div className="insights-title">AI Insights</div>
            <div className="insights-subtitle">{insights.length > 0 ? `${insights.length} recommendations for you` : 'Analyzing your pipeline…'}</div>
          </div>
        </div>
        <button
          className={`insights-refresh${refreshing ? ' spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh insights"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="insights-body">
        {loading ? (
          <>
            <div className="insights-skeleton-card" />
            <div className="insights-skeleton-card" />
            <div className="insights-skeleton-card" />
          </>
        ) : insights.length === 0 ? (
          <div className="insights-empty">
            <CheckCircle2 size={28} />
            <p>You're all caught up! No action items right now.</p>
          </div>
        ) : (
          insights.map((insight, i) => {
            const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div key={i} className={`insight-card insight-card--${cfg.type}`}>
                <div className="insight-card-header">
                  <div className="insight-type-pill">
                    <Icon size={11} />
                    {cfg.label}
                  </div>
                </div>
                <div className="insight-card-title">{insight.title}</div>
                <p className="insight-card-message">{insight.message}</p>
                {insight.action && (
                  <button
                    className="insight-action-link"
                    onClick={() => navigate(insight.action.path)}
                  >
                    {insight.action.label}
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value, accent }) {
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
