import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ResidentDashboard from '../components/ResidentDashboard';

export default function Home() {
  const { user } = useAuth();
  const isResident = user?.roles?.some((r) => r.name === 'resident' || r.name === 'bin-owner');
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome</h1>
      {user ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-700">Signed in as <span className="font-medium">{user.email}</span></div>
            <div className="text-sm text-gray-700">Roles: {user.roles.map((r) => r.displayName).join(', ')}</div>
            {!isResident && <div className="mt-3 text-sm text-gray-600">Use the nav bar above to access your tools.</div>}
            {user.roles.some((r) => r.name === 'admin') && (
              <div className="mt-3">
                <Link to="/admin" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Go to Admin</Link>
              </div>
            )}
          </div>

          {/* Show detailed dashboard only for residents */}
          {isResident && <ResidentDashboard />}
        </div>
      ) : (
        <p className="text-gray-700">Please log in</p>
      )}
    </div>
  );
}
