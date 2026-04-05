import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Link } from 'react-router-dom';

const TASK_STATUSES = ['To Do', 'In Progress', 'Done'];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = () => api.get('/tasks').then(({ data }) => setTasks(data));

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const handleStatusChange = async (task, newStatus) => {
    await api.put(`/tasks/${task.id}`, { status: newStatus });
    fetchTasks();
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="page-body">
        {/* Filter tabs */}
        <div className="filter-tabs">
          {['all', ...TASK_STATUSES].map((s) => (
            <button
              key={s}
              className={`filter-tab${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All Tasks' : s}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Assigned To</th>
                  <th>Linked To</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        {t.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {t.description.slice(0, 60)}{t.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                        >
                          {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        {t.due_date ? (
                          <span style={{ color: new Date(t.due_date) < new Date() && t.status !== 'Done' ? 'var(--danger)' : undefined }}>
                            {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{t.assigned_user?.name || '-'}</td>
                      <td>
                        {t.lead && (
                          <Link to={`/leads/${t.lead.id}`} style={{ color: 'var(--primary)', fontSize: 12 }}>
                            Lead: {t.lead.name}
                          </Link>
                        )}
                        {t.client && (
                          <Link to={`/clients/${t.client.id}`} style={{ color: 'var(--primary)', fontSize: 12 }}>
                            Client: {t.client.name}
                          </Link>
                        )}
                        {!t.lead && !t.client && '-'}
                      </td>
                      <td>
                        <div className="flex-row">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setEditTask(t); setShowModal(true); }}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <TaskFormModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSaved={() => { setShowModal(false); setEditTask(null); fetchTasks(); }}
        />
      )}
    </>
  );
}

function TaskFormModal({ task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'To Do',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    assigned_user_id: task?.assigned_user_id || '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = { ...form, assigned_user_id: form.assigned_user_id || null };
    try {
      if (isEdit) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Task' : 'Add New Task'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="task-form" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form id="task-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" name="title" value={form.title} onChange={handle} required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" name="description" value={form.description} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handle}>
            {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="form-input" type="date" name="due_date" value={form.due_date} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-select" name="assigned_user_id" value={form.assigned_user_id} onChange={handle}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
