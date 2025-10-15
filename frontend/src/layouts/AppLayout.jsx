import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  const onSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-semibold text-gray-900 dark:text-gray-100">Waste Management System</Link>
            {hasRole('admin') && (
              <nav className="hidden md:flex items-center gap-4 text-sm">
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-2 py-1.5 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`
                  }
                  end
                >
                  Admin
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `px-2 py-1.5 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`
                  }
                >
                  Users
                </NavLink>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user && (
              <div className="hidden sm:block text-gray-600 dark:text-gray-300">
                {user.email}
              </div>
            )}
            <button
              onClick={onSignOut}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
