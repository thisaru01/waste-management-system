import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listFlaggedBins } from '../services/bins';
import { transformAndSortBins } from '../utils/binHelpers';

export default function Home() {
  const { user, hasRole } = useAuth();
  const [overflowAlert, setOverflowAlert] = useState(false);
  const [overflowLocations, setOverflowLocations] = useState([]);
  useEffect(() => {
    // Only fetch and show the overflow alert for users with the authority role.
    if (!hasRole || !hasRole('authority')) {
      // ensure the alert is cleared for non-authority users
      setOverflowAlert(false);
      return undefined;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await listFlaggedBins(85);
        if (!mounted) return;
        const transformed = transformAndSortBins(data, 85);
        const hasOverflow = transformed.some((b) => (b.fillNumeric ?? 0) >= 100 || (b.status && String(b.status).toLowerCase() === 'overflow'));
        setOverflowAlert(hasOverflow);
        // build per-location overflow counts for the dashboard message
        const map = new Map();
        for (const b of transformed) {
          const isOverflow = (b.fillNumeric ?? 0) >= 100 || (b.status && String(b.status).toLowerCase() === 'overflow');
          if (!isOverflow) continue;
          const loc = (b.location && (b.location.description || b.location)) || 'Unknown';
          map.set(loc, (map.get(loc) || 0) + 1);
        }
        setOverflowLocations(Array.from(map.entries()));
      } catch (e) {
        // don't surface errors on home; this is a best-effort alert
        console.debug('failed to fetch flagged bins for dashboard alert', e?.message || e);
      }
    })();
    return () => { mounted = false; };
  }, [hasRole]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome</h1>
      {user ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {/* Per-location overflow messages (authority only) */}
          {overflowLocations.length > 0 && (
            <div className="mb-4 mt-2 flex flex-wrap gap-3">
              {overflowLocations.map(([loc, count]) => (
                <div key={loc} className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  <strong>Overflow</strong>
                  <span className="font-medium">{loc}</span>
                  <span className="text-xs text-red-600">({count} bin{count > 1 ? 's' : ''})</span>
                </div>
              ))}
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
