import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listFlaggedBins } from '../services/bins';
import { transformAndSortBins } from '../utils/binHelpers';

export default function Home() {
  const { user } = useAuth();
  const [overflowAlert, setOverflowAlert] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listFlaggedBins(85);
        if (!mounted) return;
        const transformed = transformAndSortBins(data, 85);
        const hasOverflow = transformed.some((b) => (b.fillNumeric ?? 0) >= 100 || (b.status && String(b.status).toLowerCase() === 'overflow'));
        setOverflowAlert(hasOverflow);
      } catch (e) {
        // don't surface errors on home; this is a best-effort alert
        console.debug('failed to fetch flagged bins for dashboard alert', e?.message || e);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome</h1>
      {user ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {overflowAlert && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-red-800">
              <strong>Overflow alert:</strong> One or more bins have reached 100% and require immediate attention.
            </div>
          )}
          <div className="text-sm text-gray-700">Signed in as <span className="font-medium">{user.email}</span></div>
          <div className="text-sm text-gray-700">Roles: {user.roles.map((r) => r.displayName).join(', ')}</div>
          <div className="mt-3 text-sm text-gray-600">Use the nav bar above to access admin tools.</div>
          {user.roles.some((r) => r.name === 'admin') && (
            <div className="mt-3">
              <Link to="/admin" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Go to Admin</Link>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-700">Please log in</p>
      )}
    </div>
  );
}
