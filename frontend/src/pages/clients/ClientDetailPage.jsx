import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Upload, Download, Pencil } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import LoadingScreen from '../../components/ui/LoadingScreen';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchClient = () => api.get(`/clients/${id}`).then(({ data }) => setClient(data));
  const fetchActivities = () =>
    api.get(`/activities?related_type=client&related_id=${id}`).then(({ data }) => setActivities(data));

  useEffect(() => {
    Promise.all([fetchClient(), fetchActivities()]).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this client?')) return;
    await api.delete(`/clients/${id}`);
    navigate('/clients');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('related_type', 'client');
    fd.append('related_id', id);
    try {
      await api.post('/files', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchClient();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    await api.delete(`/files/${fileId}`);
    fetchClient();
  };

  const handleFileDownload = async (file) => {
    try {
      const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed.');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!client) return <LoadingScreen />;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-avatar" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
            {client.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="page-header-text">
            <div className="page-breadcrumb">
              <Link to="/clients" className="page-breadcrumb-link"><ArrowLeft size={11} /> Clients</Link>
              <span className="page-breadcrumb-sep">/</span>
              <span>{client.name}</span>
            </div>
            <h1 className="page-title">{client.name}</h1>
          </div>
        </div>
        <div className="page-header-actions">
          <div className="btn-group-divider" />
          <button className="btn-icon" onClick={() => setShowEdit(true)} title="Edit client">
            <Pencil size={15} />
          </button>
          <button className="btn-icon-danger" onClick={handleDelete} title="Delete client">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            {/* Info */}
            <div className="card mb-4">
              <div className="card-header"><span className="card-title">Client Info</span></div>
              <div className="card-body">
                <InfoRow label="Email" value={client.email} />
                <InfoRow label="Phone" value={client.phone} />
                {client.lead && (
                  <InfoRow label="Lead" value={
                    <Link to={`/leads/${client.lead.id}`} style={{ color: 'var(--primary)' }}>
                      {client.lead.name}
                    </Link>
                  } />
                )}
                {client.notes && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                    <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{client.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">Tasks</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowTask(true)}>
                  <Plus size={13} /> Add Task
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {client.tasks?.length === 0 ? (
                  <p className="text-muted" style={{ padding: 16 }}>No tasks yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Status</th><th>Due</th><th>Assigned</th></tr>
                    </thead>
                    <tbody>
                      {client.tasks?.map((t) => (
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

            {/* Files */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Files</span>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {client.files?.length === 0 ? (
                  <p className="text-muted" style={{ padding: 16 }}>No files yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Size</th><th></th></tr>
                    </thead>
                    <tbody>
                      {client.files?.map((f) => (
                        <tr key={f.id}>
                          <td>{f.original_name}</td>
                          <td>{f.file_size ? (f.file_size / 1024).toFixed(1) + ' KB' : '-'}</td>
                          <td>
                            <div className="flex-row">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleFileDownload(f)}
                              >
                                <Download size={12} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFile(f.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
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
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchClient(); }}
        />
      )}

      {showTask && (
        <AddTaskModal
          clientId={client.id}
          onClose={() => setShowTask(false)}
          onSaved={() => { setShowTask(false); fetchClient(); fetchActivities(); }}
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

function EditClientModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client.name || '', email: client.email || '',
    phone: client.phone || '', notes: client.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await api.put(`/clients/${client.id}`, form); onSaved(); }
    finally { setLoading(false); }
  };
  return (
    <Modal title="Edit Client" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="edit-client" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </>
    }>
      <form id="edit-client" onSubmit={submit}>
        {['name','email','phone'].map((f) => (
          <div className="form-group" key={f}>
            <label className="form-label">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
            <input className="form-input" name={f} value={form[f]} onChange={handle} type={f === 'email' ? 'email' : 'text'} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" name="notes" value={form.notes} onChange={handle} />
        </div>
      </form>
    </Modal>
  );
}

function AddTaskModal({ clientId, onClose, onSaved }) {
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
    try { await api.post('/tasks', { ...form, client_id: clientId, assigned_user_id: form.assigned_user_id || null }); onSaved(); }
    finally { setLoading(false); }
  };
  return (
    <Modal title="Add Task" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="add-client-task" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
      </>
    }>
      <form id="add-client-task" onSubmit={submit}>
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
