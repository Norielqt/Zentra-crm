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
import { Plus, Mail, Phone } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed'];

const STAGE_COLORS = {
  'New Lead':  '#7C3AED',
  'Contacted': '#1E40AF',
  'Qualified': '#92400E',
  'Proposal':  '#9A3412',
  'Closed':    '#065F46',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = () => {
    api.get('/leads').then(({ data }) => setLeads(data));
  };

  const leadsByStage = (stage) => leads.filter((l) => l.status === stage);
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

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
        <h1 className="page-title">Leads Pipeline</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Lead
        </button>
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
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchLeads(); }}
        />
      )}
    </>
  );
}

function KanbanColumn({ stage, color, leads, onCardClick }) {
  return (
    <div className="kanban-column" style={{ borderTopColor: color }}>
      <div className="kanban-column-header">
        <span>{stage}</span>
        <span className="kanban-column-count">{leads.length}</span>
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
        {lead.source && <span>Source: {lead.source}</span>}
      </div>
    </div>
  );
}

function LeadFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', source: '', notes: '', status: 'New Lead',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/leads', form);
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
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" name="email" value={form.email} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" name="phone" value={form.phone} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Source</label>
          <input className="form-input" name="source" value={form.source} onChange={handle} placeholder="e.g. Website, Referral" />
        </div>
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
