import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import heroImg from '../../assets/hero.png';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(' '));
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ── 70% Hero Panel ── */}
      <div className="auth-panel-left">
        <div className="auth-hero-content">
          {/* Logo */}
          <div className="auth-hero-header">
            <div className="auth-hero-logo-icon">Z</div>
            <span className="auth-hero-logo-text">Zentra<span>CRM</span></span>
          </div>

          {/* Hero image */}
          <div className="auth-hero-image-zone">
            <div className="auth-hero-image-wrap">
              <img src={heroImg} alt="Zentra CRM" className="auth-hero-img" />
            </div>
          </div>

          {/* Bottom copy */}
          <div className="auth-hero-footer">
            <h2 className="auth-hero-headline">
              Your pipeline, your way —<br /><span>start for free</span>
            </h2>
            <p className="auth-hero-desc">
              Get up and running in minutes. Your account includes unlimited leads, drag-and-drop pipeline, task management and full activity logging.
            </p>
            <div className="auth-hero-pills">
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Free to start</span>
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Unlimited leads</span>
              <span className="auth-hero-pill"><span className="auth-hero-pill-dot" />Team ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-form-brand"><div className="auth-form-brand-icon">Z</div></div>
          <div className="auth-logo">Create account</div>
          <p className="auth-subtitle">Get started with Zentra CRM today</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                className="form-input"
                name="company_name"
                value={form.company_name}
                onChange={handle}
                placeholder="Acme Inc."
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your Full Name</label>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={handle}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                placeholder="jane@company.com"
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
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handle}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
        <div className="auth-trust">
          <span className="auth-trust-item"><span className="auth-trust-dot" />Free to start</span>
          <span className="auth-trust-item"><span className="auth-trust-dot" />Unlimited leads</span>
          <span className="auth-trust-item"><span className="auth-trust-dot" />Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}
