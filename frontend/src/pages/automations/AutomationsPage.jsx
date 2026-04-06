import { useEffect, useState } from 'react';
import { Plus, Zap, Trash2, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import LoadingScreen from '../../components/ui/LoadingScreen';

const TRIGGER_EVENTS = [
  { value: 'lead_created',        label: 'Lead is created' },
  { value: 'lead_status_changed', label: 'Lead status changes to...' },
  { value: 'client_created',      label: 'Lead is converted to client' },
  { value: 'task_overdue',        label: 'Task becomes overdue (daily)' },
];

const ACTION_TYPES = [
  { value: 'create_task',          label: 'Create a task' },
  { value: 'log_note',             label: 'Log a note / activity' },
  { value: 'update_lead_status',   label: 'Update lead status' },
];

const LEAD_STATUSES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed'];

const EVENT_LABELS = Object.fromEntries(TRIGGER_EVENTS.map((e) => [e.value, e.label]));
const ACTION_LABELS = Object.fromEntries(ACTION_TYPES.map((a) => [a.value, a.label]));

export default function AutomationsPage() {
  const [automations, setAutomations] = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { fetchAutomations(); }, []);

  const fetchAutomations = () => {
    api.get('/automations').then(({ data }) => setAutomations(data)).finally(() => setLoading(false));
  };

  const handleToggle = async (a) => {
    await api.put(`/automations/${a.id}`, { is_active: !a.is_active });
    fetchAutomations();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this automation?')) return;
    await api.delete(`/automations/${id}`);
    fetchAutomations();
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}>
            <Zap size={18} />
          </div>
          <div className="page-header-text">
            <h1 className="page-title">
              Automations
              <span className="page-header-count">{automations.length}</span>
            </h1>
            <p className="page-subtitle">Rules that run automatically when events happen</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Rule
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Info banner */}
        <div className="automation-banner">
          <div className="automation-banner-icon-wrap"><Zap size={14} /></div>
          <div>
            <strong>Built-in automations always run:</strong> Daily overdue task scanner at 07:00 and
            idle lead detection at 07:05. Add custom rules below to trigger tasks, notes, or status changes.
          </div>
        </div>

        {loading ? (
          <LoadingScreen />
        ) : automations.length === 0 ? (
          <div className="automation-empty">
            <Zap size={40} strokeWidth={1.5} color="var(--text-light)" />
            <p>No automation rules yet.</p>
            <span>Click "New Rule" to create your first trigger → action pair.</span>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Rule
            </button>
          </div>
        ) : (
          <div className="automation-list">
            {automations.map((a) => (
              <AutomationRow
                key={a.id}
                automation={a}
                onToggle={() => handleToggle(a)}
                onDelete={() => handleDelete(a.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AutomationFormModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAutomations(); }}
        />
      )}
    </>
  );
}

function AutomationRow({ automation: a, onToggle, onDelete }) {
  const actionSummary = () => {
    const cfg = a.action_config || {};
    if (a.action_type === 'create_task') return `Create task: "${cfg.title}"${cfg.due_days ? ` (due in ${cfg.due_days}d)` : ''}`;
    if (a.action_type === 'log_note') return `Log: "${cfg.message}"`;
    if (a.action_type === 'update_lead_status') return `Set lead status → ${cfg.status}`;
    return ACTION_LABELS[a.action_type] || a.action_type;
  };

  const triggerSummary = () => {
    let label = EVENT_LABELS[a.trigger_event] || a.trigger_event;
    if (a.trigger_event === 'lead_status_changed' && a.trigger_value) {
      label = `Lead status → "${a.trigger_value}"`;
    }
    return label;
  };

  return (
    <div className={`automation-card${a.is_active ? '' : ' inactive'}`}>
      <div className="automation-card-header">
        <div className="automation-card-name">{a.name}</div>
        <div className="automation-card-controls">
          <span className={`automation-status-pill${a.is_active ? ' active' : ''}`}>
            {a.is_active ? 'Active' : 'Inactive'}
          </span>
          <button className="automation-toggle-btn" onClick={onToggle} title={a.is_active ? 'Disable' : 'Enable'}>
            <span className={`toggle-track${a.is_active ? ' on' : ''}`}>
              <span className="toggle-thumb" />
            </span>
          </button>
          <button className="btn-icon btn-icon-danger" onClick={onDelete} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="automation-flow">
        <div className="automation-flow-block automation-flow-trigger">
          <span className="automation-flow-label">WHEN</span>
          <span className="automation-flow-text">{triggerSummary()}</span>
        </div>
        <ArrowRight size={13} className="automation-flow-arrow" />
        <div className="automation-flow-block automation-flow-action">
          <span className="automation-flow-label">THEN</span>
          <span className="automation-flow-text">{actionSummary()}</span>
        </div>
        <div className="automation-flow-spacer" />
        <div className="automation-meta">
          <span>{a.run_count} runs</span>
          {a.last_run_at && <span>Last run {new Date(a.last_run_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

function AutomationFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    trigger_event: 'lead_status_changed',
    trigger_value: 'Proposal',
    action_type: 'create_task',
    // create_task config
    task_title: '',
    task_description: '',
    task_due_days: '1',
    // log_note config
    note_message: '',
    // update_lead_status config
    new_status: 'Qualified',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const buildPayload = () => {
    let action_config = {};
    if (form.action_type === 'create_task') {
      action_config = {
        title:       form.task_title,
        description: form.task_description,
        due_days:    parseInt(form.task_due_days) || null,
      };
    } else if (form.action_type === 'log_note') {
      action_config = { message: form.note_message };
    } else if (form.action_type === 'update_lead_status') {
      action_config = { status: form.new_status };
    }

    return {
      name:          form.name,
      trigger_event: form.trigger_event,
      trigger_value: form.trigger_event === 'lead_status_changed' ? form.trigger_value : null,
      action_type:   form.action_type,
      action_config,
    };
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/automations', buildPayload());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save automation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="New Automation Rule"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="automation-form" disabled={loading}>
            {loading ? 'Creating...' : 'Create Rule'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form id="automation-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Rule Name *</label>
          <input
            className="form-input"
            name="name"
            value={form.name}
            onChange={handle}
            placeholder="e.g. Auto-task on Proposal"
            required
          />
        </div>

        {/* Trigger */}
        <div className="automation-section-label">TRIGGER — When this happens</div>
        <div className="form-group">
          <label className="form-label">Event</label>
          <select className="form-select" name="trigger_event" value={form.trigger_event} onChange={handle}>
            {TRIGGER_EVENTS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {form.trigger_event === 'lead_status_changed' && (
          <div className="form-group">
            <label className="form-label">Status is changed to</label>
            <select className="form-select" name="trigger_value" value={form.trigger_value} onChange={handle}>
              {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Action */}
        <div className="automation-section-label" style={{ marginTop: 18 }}>ACTION — Then do this</div>
        <div className="form-group">
          <label className="form-label">Action</label>
          <select className="form-select" name="action_type" value={form.action_type} onChange={handle}>
            {ACTION_TYPES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {form.action_type === 'create_task' && (
          <>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-input" name="task_title" value={form.task_title} onChange={handle} required placeholder="e.g. Follow up on proposal" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" name="task_description" value={form.task_description} onChange={handle} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Due in (days from trigger)</label>
              <input className="form-input" type="number" name="task_due_days" value={form.task_due_days} onChange={handle} min="0" style={{ maxWidth: 120 }} />
            </div>
          </>
        )}

        {form.action_type === 'log_note' && (
          <div className="form-group">
            <label className="form-label">Note message *</label>
            <textarea className="form-textarea" name="note_message" value={form.note_message} onChange={handle} required rows={2} />
          </div>
        )}

        {form.action_type === 'update_lead_status' && (
          <div className="form-group">
            <label className="form-label">Set status to</label>
            <select className="form-select" name="new_status" value={form.new_status} onChange={handle}>
              {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
}
