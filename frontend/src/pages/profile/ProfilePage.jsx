import { useState } from 'react';
import { UserCircle, Lock, Save, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, login } = useAuth();

  const [info, setInfo] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [pw, setPw]     = useState({ current_password: '', password: '', password_confirmation: '' });

  const [infoLoading, setInfoLoading]   = useState(false);
  const [pwLoading, setPwLoading]       = useState(false);
  const [infoSuccess, setInfoSuccess]   = useState(false);
  const [pwSuccess, setPwSuccess]       = useState(false);
  const [infoError, setInfoError]       = useState('');
  const [pwError, setPwError]           = useState('');

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'Z';

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoError(''); setInfoSuccess(false);
    setInfoLoading(true);
    try {
      const { data } = await api.put('/profile', { name: info.name, email: info.email });
      // Refresh the user in context by re-fetching
      const meRes = await api.get('/me');
      // Patch context user directly via a re-read trick — AuthContext exposes setUser through login,
      // so we update localStorage user cache then force a page reload-less refresh via setUser.
      // Since AuthContext doesn't expose setUser, we patch via the returned data:
      user.name  = data.name;
      user.email = data.email;
      setInfo({ name: data.name, email: data.email });
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err) {
      setInfoError(err?.response?.data?.message || err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Failed to update profile.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (pw.password !== pw.password_confirmation) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/profile', {
        name: info.name,
        email: info.email,
        current_password:      pw.current_password,
        password:              pw.password,
        password_confirmation: pw.password_confirmation,
      });
      setPw({ current_password: '', password: '', password_confirmation: '' });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(
        err?.response?.data?.message ||
        (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Failed to update password.')
      );
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <UserCircle size={18} />
          </div>
          <div className="page-header-text">
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Update your name, email, and password</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="profile-layout">

          {/* Avatar card */}
          <div className="card profile-avatar-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{initials}</div>
            </div>
            <div className="profile-avatar-name">{user?.name}</div>
            <div className="profile-avatar-email">{user?.email}</div>
            <span className={`role-badge role-badge--${user?.role}`} style={{ marginTop: 8 }}>{user?.role}</span>
            {user?.company?.name && (
              <div className="profile-avatar-company">{user.company.name}</div>
            )}
          </div>

          <div className="profile-forms">
            {/* Personal info */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Personal Information</span>
                <span className="card-subtitle">Update your name and email address</span>
              </div>
              <div className="card-body">
                {infoError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{infoError}</div>}
                {infoSuccess && (
                  <div className="profile-success">
                    <CheckCircle2 size={14} /> Profile updated successfully.
                  </div>
                )}
                <form id="profile-info-form" onSubmit={handleInfoSubmit}>
                  <div className="form-grid-two">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-input"
                        value={info.name}
                        onChange={(e) => setInfo({ ...info, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        className="form-input"
                        type="email"
                        value={info.email}
                        onChange={(e) => setInfo({ ...info, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary" form="profile-info-form" disabled={infoLoading}>
                  <Save size={14} /> {infoLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Change password */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><Lock size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Change Password</span>
                <span className="card-subtitle">Leave blank to keep your current password</span>
              </div>
              <div className="card-body">
                {pwError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{pwError}</div>}
                {pwSuccess && (
                  <div className="profile-success">
                    <CheckCircle2 size={14} /> Password changed successfully.
                  </div>
                )}
                <form id="profile-pw-form" onSubmit={handlePwSubmit}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={pw.current_password}
                      onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-grid-two" style={{ marginTop: 14 }}>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={pw.password}
                        onChange={(e) => setPw({ ...pw, password: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={pw.password_confirmation}
                        onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary" form="profile-pw-form" disabled={pwLoading}>
                  <Lock size={14} /> {pwLoading ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
