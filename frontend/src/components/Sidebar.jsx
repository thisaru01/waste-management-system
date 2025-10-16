import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV_ITEMS, filterNavItemsByRoles } from '../routes/nav.config.js';

function Icon({ name, className = 'w-5 h-5' }) {
  // Minimal inline-icons set; replace with a proper icon library later if desired
  const base = 'stroke-current';
  switch (name) {
    case 'home':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"/></svg>
      );
    case 'users':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      );
    case 'collection':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 6h18M6 6V4h12v2M6 6l1.5 14h9L18 6"/></svg>
      );
    case 'history':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3"/><path d="M12 7v5l3 3"/></svg>
      );
    case 'payments':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
      );
    case 'calendar':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      );
    case 'chart':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="5" width="3" height="13"/></svg>
      );
    case 'settings':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.49A1.65 1.65 0 0 0 5 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.1V3a2 2 0 1 1 4 0v.09c0 .67.39 1.28 1 1.51.4.17.87.1 1.22-.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.27.35-.34.82-.17 1.22.23.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.67 0-1.28.39-1.51 1z"/></svg>
      );
    case 'beaker':
      return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
          <path d="M9 3v6l-5 8a3 3 0 0 0 2.55 4.5h10.9A3 3 0 0 0 20 17l-5-8V3"/>
          <path d="M9 9h6"/>
          <path d="M7 17h10"/>
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({ variant = 'desktop', onNavigate } = {}) {
  const { user } = useAuth();
  const items = filterNavItemsByRoles(NAV_ITEMS, user?.roles || []);

  const containerClass =
    variant === 'mobile'
      ? 'flex w-64 shrink-0 border-r border-gray-200 bg-white h-full'
    : 'hidden md:flex md:w-60 lg:w-64 shrink-0 border-r border-gray-200 bg-white sticky top-14 self-start h-[calc(100vh-3.5rem)] z-30';

  return (
    <aside className={containerClass}>
      <nav className="w-full p-3">
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                onClick={() => onNavigate && onNavigate()}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
