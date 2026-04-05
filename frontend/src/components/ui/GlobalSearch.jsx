import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, UserCheck, CheckSquare, X } from 'lucide-react';
import api from '../../api/axios';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef(null);
  const navigate              = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/search', { params: { q } });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 250);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const go = (path) => { navigate(path); onClose(); };

  const totalResults = results
    ? (results.leads.length + results.clients.length + results.tasks.length)
    : 0;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            placeholder="Search leads, clients, tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="search-results">
          {loading && (
            <div className="search-empty">Searching…</div>
          )}

          {!loading && results && totalResults === 0 && (
            <div className="search-empty">No results for "{query}"</div>
          )}

          {!loading && results && results.leads.length > 0 && (
            <>
              <div className="search-section-label">Leads</div>
              {results.leads.map((lead) => (
                <div key={lead.id} className="search-result-item" onClick={() => go(`/leads/${lead.id}`)}>
                  <div className="search-result-icon" style={{ background: '#EDE9FE' }}>
                    <Users size={14} color="#7C3AED" />
                  </div>
                  <div>
                    <div className="search-result-name">{lead.name}</div>
                    <div className="search-result-sub">{lead.status}{lead.email ? ` · ${lead.email}` : ''}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && results && results.clients.length > 0 && (
            <>
              <div className="search-section-label">Clients</div>
              {results.clients.map((client) => (
                <div key={client.id} className="search-result-item" onClick={() => go(`/clients/${client.id}`)}>
                  <div className="search-result-icon" style={{ background: '#D1FAE5' }}>
                    <UserCheck size={14} color="#065F46" />
                  </div>
                  <div>
                    <div className="search-result-name">{client.name}</div>
                    <div className="search-result-sub">{client.email || 'No email'}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && results && results.tasks.length > 0 && (
            <>
              <div className="search-section-label">Tasks</div>
              {results.tasks.map((task) => (
                <div key={task.id} className="search-result-item" onClick={() => go('/tasks')}>
                  <div className="search-result-icon" style={{ background: '#FEF3C7' }}>
                    <CheckSquare size={14} color="#92400E" />
                  </div>
                  <div>
                    <div className="search-result-name">{task.title}</div>
                    <div className="search-result-sub">{task.status}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!query && (
            <div className="search-empty">Start typing to search across your CRM…</div>
          )}
        </div>

        <div className="search-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
