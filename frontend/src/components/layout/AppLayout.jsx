import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, UserCheck, CheckSquare, Zap, Settings2, LogOut, Sun, Moon, BarChart2 } from 'lucide-react';
import GlobalSearch from '../ui/GlobalSearch';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/leads',       label: 'Leads',       icon: Users },
  { to: '/clients',     label: 'Clients',     icon: UserCheck },
  { to: '/tasks',       label: 'Tasks',       icon: CheckSquare },
  { to: '/automations', label: 'Automations', icon: Zap },
  { to: '/analytics',   label: 'Analytics',   icon: BarChart2 },
];

const ADMIN_NAV_ITEMS = [
  { to: '/team', label: 'Team', icon: Settings2 },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('zentra_theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('zentra_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark]         = useDarkMode();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">Z</div>
          <span>Zentra<span className="highlight">CRM</span></span>
        </div>

        {/* Search trigger */}
        <div style={{ padding: '0 14px 12px' }}>
          <button className="search-trigger" onClick={() => setSearchOpen(true)}>
            <Users size={13} style={{ opacity: 0.5 }} />
            Search…
            <span className="search-trigger-kbd">
              <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</kbd>
              <kbd>K</kbd>
            </span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Main Menu</div>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-nav-label" style={{ marginTop: 16 }}>Admin</div>
              {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role-row">
                <span className={`role-badge role-badge--${user?.role}`}>{user?.role}</span>
              </div>
            </div>
            <button
              className="dark-toggle"
              onClick={() => setDark((d) => !d)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
