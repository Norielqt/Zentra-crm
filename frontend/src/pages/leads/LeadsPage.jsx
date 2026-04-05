import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Mail, Phone, DollarSign, Download, Users } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed'];

const STAGE_COLORS = {
  'New Lead':  '#7C3AED',
  'Contacted': '#1E40AF',
  'Qualified': '#92400E',
  'Proposal':  '#9A3412',
  'Closed':    '#065F46',
};

function fmtCurrency(val) {
  if (!val) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

export default function LeadsPage() {
  const [leads, setLeads]       = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const { isAdmin }             = useAuth();
  const navigate                = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = () => {
    api.get('/leads').then(({ data }) => setLeads(data));
  };

  const leadsByStage   = (stage) => leads.filter((l) => l.status === stage);
  const revenueByStage = (stage) => leads
    .filter((l) => l.status === stage && l.deal_value)
    .reduce((sum, l) => sum + parseFloat(l.deal_value), 0);
  const activeLead     = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const lead = leads.find((l) => l.id === active.id);
    if (!lead) return;

    let newStatus = STAGES.includes(over.id) ? over.id : null;
    if (!newStatus) {
      const overLead = leads.find((l) => l.id === over.id);
      if (overLead) newStatus = overLead.status;
    }

    if (!newStatus || lead.status === newStatus) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    );
    api.put(`/leads/${lead.id}`, { status: newStatus }).catch(() => fetchLeads());
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
            <Users size={18} />
          </div>
          <div className="page-header-text">
            <h1 className="page-title">
              Leads Pipeline
              <span className="page-header-count">{leads.length}</span>
            </h1>
            <p className="page-subtitle">Drag cards between columns to update stage</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button
            className="btn-export"
            onClick={async () => {
              const res = await api.get('/leads/export', { responseType: 'blob' });
              const url = URL.createObjectURL(res.data);
              const a   = document.createElement('a');
              a.href = url; a.download = 'leads.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      <div className="page-body" style={{ overflow: 'hidden' }}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                color={STAGE_COLORS[stage]}
                leads={leadsByStage(stage)}
                revenue={revenueByStage(stage)}
                onCardClick={(id) => navigate(`/leads/${id}`)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {showModal && (
        <LeadFormModal
          isAdmin={isAdmin}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchLeads(); }}
        />
      )}
    </>
  );
}

function KanbanColumn({ stage, color, leads, revenue, onCardClick }) {
  return (
    <div className="kanban-column" style={{ borderTopColor: color }}>
      <div className="kanban-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{stage}</span>
          <span className="kanban-column-count">{leads.length}</span>
        </div>
        {revenue > 0 && (
          <span className="kanban-column-revenue" style={{ color }}>
            {fmtCurrency(revenue)}
          </span>
        )}
      </div>
      <SortableContext id={stage} items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <DroppableColumnBody stage={stage}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />
          ))}
        </DroppableColumnBody>
      </SortableContext>
    </div>
  );
}

function DroppableColumnBody({ stage, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className="kanban-column-body"
      style={{ background: isOver ? 'rgba(0,49,72,0.07)' : undefined }}
    >
      {children}
    </div>
  );
}

function LeadCard({ lead, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card${isDragging ? ' dragging' : ''}`}
      onClick={onClick}
    >
      <div className="kanban-card-name">{lead.name}</div>
      {lead.deal_value && (
        <div className="kanban-card-deal">
          <DollarSign size={11} />
          {fmtCurrency(lead.deal_value)}
        </div>
      )}
      <div className="kanban-card-meta">
        {lead.email && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Mail size={11} /> {lead.email}
          </span>
        )}
        {lead.phone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={11} /> {lead.phone}
          </span>
        )}
        {lead.assignedUser && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="kanban-assignee">{lead.assignedUser.name.split(' ')[0]}</span>
          </span>
        )}
        {lead.source && <span>Source: {lead.source}</span>}
      </div>
    </div>
  );
}

function LeadFormModal({ isAdmin, onClose, onSaved }) {
  const [form, setForm]     = useState({
    name: '', email: '', phone: '', source: '', notes: '', status: 'New Lead',
    deal_value: '', assigned_user_id: '',
  });
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { user }            = useAuth();

  useEffect(() => {
    if (isAdmin) {
      api.get('/users').then(({ data }) => setUsers(data));
    }
  }, [isAdmin]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.deal_value) delete payload.deal_value;
      if (!payload.assigned_user_id) delete payload.assigned_user_id;
      await api.post('/leads', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Lead"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="lead-form" disabled={loading}>
            {loading ? 'Saving...' : 'Create Lead'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form id="lead-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" name="name" value={form.name} onChange={handle} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handle} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" name="phone" value={form.phone} onChange={handle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Deal Value ($)</label>
            <input className="form-input" type="number" name="deal_value" value={form.deal_value} onChange={handle} placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Source</label>
            <input className="form-input" name="source" value={form.source} onChange={handle} placeholder="e.g. Website, Referral" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handle}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned To</label>
            {isAdmin ? (
              <select className="form-select" name="assigned_user_id" value={form.assigned_user_id} onChange={handle}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            ) : (
              <input className="form-input" value={user?.name ?? '—'} disabled />
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" name="notes" value={form.notes} onChange={handle} />
        </div>
      </form>
    </Modal>
  );
}

