import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserCheck, CheckSquare, TrendingUp, Sparkles, AlertTriangle, AlertCircle, Info, CheckCircle2, Zap, RefreshCw, ArrowRight, DollarSign, LayoutDashboard } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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
  urgent:  { icon: AlertTriangle, color: '#D93025', bg: '#FFF5F5', border: '#FED7D7', label: 'Urgent' },
  warning: { icon: AlertCircle,   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Heads up' },
  action:  { icon: Zap,           color: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF', label: 'Opportunity' },
  info:    { icon: Info,           color: '#0E86D4', bg: '#EFF6FF', border: '#BFDBFE', label: 'Info' },
  success: { icon: CheckCircle2,   color: '#1A9E53', bg: '#F0FDF4', border: '#BBF7D0', label: 'Great work' },
};

const ONBOARDING_DISMISSED_KEY = (userId) => `zentra_onboarding_dismissed_${userId}`;

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
      setActivities(activitiesRes.data.slice(0, 8));
      setOnboarding(onboardingRes.data);
    }).finally(() => setLoading(false));

    fetchInsights();
  }, [fetchInsights]);

  const dismissOnboarding = () => {
    if (user?.id) localStorage.setItem(ONBOARDING_DISMISSED_KEY(user.id), 'true');
    setOnboardingDismissed(true);
  };

  if (loading) return <div className="loading-screen">Loading dashboard…</div>;

  const showOnboarding = onboarding && !onboarding.all_done && !onboardingDismissed;

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

        {/* AI Insights + Pipeline + Activity */}
        <div className="dashboard-bottom-grid">
          {/* AI Insights */}
          <InsightsPanel
            insights={insights}
            loading={insightsLoading}
            refreshing={refreshing}
            onRefresh={() => fetchInsights(true)}
          />

          {/* Pipeline Overview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Overview</span>
              <Link to="/leads" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div className="card-body">
              {stats?.total_revenue_pipeline > 0 && (
                <div className="pipeline-total-revenue">
                  <DollarSign size={14} />
                  <span>Total pipeline value: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.total_revenue_pipeline)}</strong></span>
                </div>
              )}
              {STATUSES.map((s) => {
                const count   = stats?.leads_by_status?.[s] ?? 0;
                const total   = stats?.total_leads || 1;
                const pct     = Math.round((count / total) * 100);
                const revenue = stats?.revenue_by_status?.[s];
                return (
                  <div key={s} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {revenue > 0 && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: STATUS_COLORS[s], opacity: 0.8 }}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(revenue)}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLORS[s] }}>
                          {count} <span style={{ fontWeight: 500, opacity: 0.6 }}>({pct}%)</span>
                        </span>
                      </div>
                    </div>
                    <div style={{ height: '8px', background: STATUS_TRACK_COLORS[s], borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: STATUS_COLORS[s], borderRadius: '6px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
            </div>
            <div className="card-body" style={{ padding: '0 22px' }}>
              {activities.length === 0 ? (
                <p className="text-muted" style={{ padding: '20px 0', fontSize: 13 }}>No activity yet.</p>
              ) : (
                <div className="activity-list">
                  {activities.map((a) => (
                    <div className="activity-item" key={a.id}>
                      <div className="activity-dot" />
                      <div style={{ flex: 1 }}>
                        <div className="activity-message">{a.message}</div>
                        <div className="activity-time">
                          {a.user?.name && <span>{a.user.name} · </span>}
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <div className="insights-title">AI Assistant</div>
            <div className="insights-subtitle">Here to help you stay on track</div>
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
          <div className="insights-loading">
            <div className="insights-skeleton" />
            <div className="insights-skeleton" style={{ width: '80%' }} />
            <div className="insights-skeleton" style={{ width: '90%' }} />
          </div>
        ) : (
          insights.map((insight, i) => {
            const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className="insight-card"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="insight-card-top">
                  <div className="insight-type-badge" style={{ color: cfg.color, background: `${cfg.color}18` }}>
                    <Icon size={11} />
                    {cfg.label}
                  </div>
                  <span className="insight-card-title" style={{ color: cfg.color }}>{insight.title}</span>
                </div>
                <p className="insight-card-message">{insight.message}</p>
                {insight.action && (
                  <button
                    className="insight-action-btn"
                    style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}0D` }}
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
    <div className="stat-card" style={{ borderTopColor: accent }}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: bg }}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
