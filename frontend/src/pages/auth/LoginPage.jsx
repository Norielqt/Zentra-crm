import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import heroImg from '../../assets/hero.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {}).flat().join(' ') ||
        'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ── 70% Hero Panel ── */}
      <div className="auth-panel-left">
        <div className="auth-hero-content">
          <div className="auth-hero-header">
            <div className="auth-hero-logo-icon">Z</div>
            <span className="auth-hero-logo-text">Zentra<span>CRM</span></span>
          </div>
          <div className="auth-hero-image-zone">
            <div className="auth-hero-image-wrap">
              <img src={heroImg} alt="Zentra CRM" className="auth-hero-img" />
            </div>
          </div>
          <div className="auth-hero-footer">
            <h2 className="auth-hero-headline">
              Close deals faster with<br /><span>Zentra CRM</span>
            </h2>
            <p className="auth-hero-desc">
              The modern CRM built for growing teams. Manage your entire pipeline from first contact to closed deal.
            </p>
            <div className="auth-hero-pills">
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Kanban Pipeline</span>
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Client Management</span>
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Task Tracking</span>
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Activity Feed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-form-brand"><div className="auth-form-brand-icon">Z</div></div>
          <div className="auth-logo">Welcome back</div>
          <p className="auth-subtitle">Sign in to your Zentra account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            No account? <Link to="/register">Create one free</Link>
          </p>
        </div>
        <div className="auth-trust">
          <span className="auth-trust-item"><span className="auth-trust-dot" />500+ teams</span>
          <span className="auth-trust-item"><span className="auth-trust-dot" />10K+ deals closed</span>
          <span className="auth-trust-item"><span className="auth-trust-dot" />99.9% uptime</span>
        </div>
      </div>
    </div>
  );
}
