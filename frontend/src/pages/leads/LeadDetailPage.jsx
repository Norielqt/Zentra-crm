import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Trash2, Plus } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showTask, setShowTask] = useState(false);

  const fetchLead = () =>
    api.get(`/leads/${id}`).then(({ data }) => setLead(data));

  const fetchActivities = () =>
    api.get(`/activities?related_type=lead&related_id=${id}`).then(({ data }) => setActivities(data));

  useEffect(() => {
    Promise.all([fetchLead(), fetchActivities()]).finally(() => setLoading(false));
  }, [id]);

  const handleConvert = async () => {
    if (!confirm('Convert this lead to a client?')) return;
    try {
      const { data } = await api.post(`/leads/${id}/convert`);
      alert('Lead converted! Redirecting to client...');
      navigate(`/clients/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Conversion failed.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this lead?')) return;
    await api.delete(`/leads/${id}`);
    navigate('/leads');
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!lead) return <div className="loading-screen">Lead not found.</div>;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-avatar">
            {lead.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="page-header-text">
            <div className="page-breadcrumb">
              <Link to="/leads" className="page-breadcrumb-link"><ArrowLeft size={11} /> Leads</Link>
              <span className="page-breadcrumb-sep">/</span>
              <span>{lead.name}</span>
            </div>
            <h1 className="page-title">
              {lead.name}
              <Badge status={lead.status} />
            </h1>
          </div>
        </div>
        <div className="page-header-actions">
          {!lead.client && (
            <button className="btn btn-success" onClick={handleConvert}>
              <UserCheck size={15} /> Convert to Client
            </button>
          )}
          {lead.client && (
            <Link to={`/clients/${lead.client.id}`} className="btn btn-secondary btn-sm">
              View Client →
            </Link>
          )}
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Lead Info */}
          <div>
            <div className="card mb-4">
              <div className="card-header"><span className="card-title">Lead Info</span></div>
              <div className="card-body">
                <InfoRow label="Email" value={lead.email} />
                <InfoRow label="Phone" value={lead.phone} />
                <InfoRow label="Source" value={lead.source} />
                <InfoRow label="Status" value={<Badge status={lead.status} />} />
                {lead.notes && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                    <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Tasks</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowTask(true)}>
                  <Plus size={13} /> Add Task
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {lead.tasks?.length === 0 ? (
                  <p className="text-muted" style={{ padding: 16 }}>No tasks yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Due</th>
                        <th>Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.tasks?.map((t) => (
                        <tr key={t.id}>
                          <td>{t.title}</td>
                          <td><Badge status={t.status} /></td>
                          <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                          <td>{t.assigned_user?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-header"><span className="card-title">Activity Timeline</span></div>
            <div className="card-body" style={{ padding: '0 20px' }}>
              {activities.length === 0 ? (
                <p className="text-muted" style={{ padding: '16px 0' }}>No activity yet.</p>
              ) : (
                <div className="activity-list">
                  {activities.map((a) => (
                    <div className="activity-item" key={a.id}>
                      <div className="activity-dot" />
                      <div>
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

      {showEdit && (
        <EditLeadModal
          lead={lead}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchLead(); fetchActivities(); }}
        />
      )}

      {showTask && (
        <AddTaskModal
          leadId={lead.id}
          onClose={() => setShowTask(false)}
          onSaved={() => { setShowTask(false); fetchLead(); fetchActivities(); }}
        />
      )}
    </>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}

function EditLeadModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    source: lead.source || '',
    notes: lead.notes || '',
    status: lead.status || 'New Lead',
  });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/leads/${lead.id}`, form);
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Lead" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="edit-lead-form" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </>
    }>
      <form id="edit-lead-form" onSubmit={submit}>
        {['name','email','phone','source'].map((field) => (
          <div className="form-group" key={field}>
            <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input className="form-input" name={field} value={form[field]} onChange={handle} type={field === 'email' ? 'email' : 'text'} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handle}>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" name="notes" value={form.notes} onChange={handle} />
        </div>
      </form>
    </Modal>
  );
}

function AddTaskModal({ leadId, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', due_date: '', status: 'To Do', assigned_user_id: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tasks', { ...form, lead_id: leadId, assigned_user_id: form.assigned_user_id || null });
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Task" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="add-task-form" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
      </>
    }>
      <form id="add-task-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" name="title" value={form.title} onChange={handle} required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" name="description" value={form.description} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="form-input" type="date" name="due_date" value={form.due_date} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handle}>
            {['To Do','In Progress','Done'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-select" name="assigned_user_id" value={form.assigned_user_id} onChange={handle}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
}
