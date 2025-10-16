import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSignOut = () => {
    signOut();
    navigate('/login');
  };

  useEffect(() => {
    // prevent body scroll when drawer is open
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
  <div className="min-h-screen bg-gray-50 pt-14">
      {/* Sticky top header - fixed, does not scroll with page content */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
              aria-label="Open sidebar"
              onClick={() => setMobileOpen(true)}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
            <Link to="/" className="text-sm font-semibold text-gray-900">Waste Management System</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user && (
              <div className="hidden sm:block text-gray-600">
                {user.email}
              </div>
            )}
            <button
              onClick={onSignOut}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <div className="h-full shadow-xl">
              <Sidebar variant="mobile" onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
