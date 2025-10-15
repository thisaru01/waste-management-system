import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome</h1>
      {user ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">Signed in as <span className="font-medium">{user.email}</span></div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Roles: {user.roles.map((r) => r.displayName).join(', ')}</div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">Use the nav bar above to access admin tools.</div>
          {user.roles.some((r) => r.name === 'admin') && (
            <div className="mt-3">
              <Link to="/admin" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Go to Admin</Link>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">Please log in</p>
      )}
    </div>
  );
}
