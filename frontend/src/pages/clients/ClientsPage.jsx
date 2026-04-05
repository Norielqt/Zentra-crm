import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = () =>
    api.get('/clients').then(({ data }) => setClients(data));

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-export"
            onClick={async () => {
              const res = await api.get('/clients/export', { responseType: 'blob' });
              const url = URL.createObjectURL(res.data);
              const a   = document.createElement('a');
              a.href = url; a.download = 'clients.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="flex-row" style={{ flex: 1 }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                className="form-input"
                style={{ maxWidth: 300 }}
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-muted text-sm">{filtered.length} clients</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Converted From</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No clients found.</td></tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="table-cell-name">
                          <div className="table-avatar">{c.name.slice(0, 2)}</div>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                        </div>
                      </td>
                      <td>{c.email || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td>{c.lead ? <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{c.lead.name}</span> : '-'}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <ClientFormModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchClients(); }}
        />
      )}
    </>
  );
}

function ClientFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/clients', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Client"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="client-form" disabled={loading}>
            {loading ? 'Saving...' : 'Create Client'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form id="client-form" onSubmit={submit}>
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
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" name="notes" value={form.notes} onChange={handle} />
        </div>
      </form>
    </Modal>
  );
}
