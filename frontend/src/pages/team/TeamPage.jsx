import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';

export default function TeamPage() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard', { replace: true }); return; }
    fetchMembers();
  }, [isAdmin]);

  const fetchMembers = () => {
    api.get('/users').then(({ data }) => setMembers(data)).finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member?')) return;
    await api.delete(`/users/${id}`);
    setMembers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading) return <div className="loading-screen">Loading…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage who has access to your workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Invite Member
        </button>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Members ({members.length})</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="table-cell-name">
                        <div className="table-avatar">{m.name.slice(0, 2).toUpperCase()}</div>
                        {m.name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.email}</td>
                    <td>
                      <span className={`role-badge role-badge--${m.role}`}>
                        {m.role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
                        {m.role}
                      </span>
                    </td>
                    <td>
                      {m.role !== 'admin' && (
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(m.id)}
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchMembers(); }}
        />
      )}
    </>
  );
}

function InviteModal({ onClose, onSaved }) {
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Failed to invite member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Invite Team Member"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="invite-form" disabled={loading}>
            {loading ? 'Inviting…' : 'Send Invite'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form id="invite-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" name="name" value={form.name} onChange={handle} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" name="email" value={form.email} onChange={handle} required />
        </div>
        <div className="form-group">
          <label className="form-label">Temporary Password *</label>
          <input className="form-input" type="password" name="password" value={form.password} onChange={handle} required minLength={8} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          The new member will be added as a <strong>Member</strong> role. They can only see leads and tasks assigned to them.
        </p>
      </form>
    </Modal>
  );
}
