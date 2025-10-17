import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import WasteTypeChart from '../components/ui/WasteTypeChart.jsx';
import WasteFillChart from '../components/ui/WasteFillChart.jsx';

// --- Local Helper Components & Mock Data ---

const mockDashboardData = {
  // Data for the 4 KPI cards (with trend information)
  totalWaste: { value: '8,500 kg', trend: '12%', type: 'positive' },
  missedCollections: { value: 5, trend: '2', type: 'negative' },
  activeZones: { value: 12, trend: '1', type: 'positive' },
  efficiency: { value: '85%', trend: '3%', type: 'positive' },
  // Data for the main trend chart (Placeholder array)
  wasteTrend: [/* your trend data here */], 
};

// StatCard Component (with subtitle and Trend Indicator)
const StatCard = ({ title, subtitle, value, trendValue, trendType = 'positive', timestamp }) => {
  const trendColor = trendType === 'positive' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trendType === 'positive' ? '▲' : '▼';

  const timeLabel = timestamp ? `Updated ${new Date(timestamp).toLocaleTimeString()}` : 'Today';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
        </div>
        <div className={`text-sm font-medium ${trendColor}`}>{trendIcon} {trendValue}</div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{timeLabel}</div>
      </div>
    </div>
  );
};

// Placeholder for the main Waste Collection Trend Chart (matching the large image block)
const WasteCollectionTrend = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg lg:col-span-full">
      {/* 💡 CHANGE 1: Increased heading size from 'text-xl' to 'text-2xl' */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Waste Collection Trend</h2>
      <div className="flex items-center justify-center h-64 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500">
        Line Chart Placeholder
      </div>
      <div className="mt-6 flex justify-center">
        {/* 💡 CHANGE 2: Increased button size (px, py, and text size) */}
        <Link to="/reports/generate" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 shadow-md">
            Generate New Report
        </Link>
      </div>
    </div>
);


export default function Home() {
  const { user } = useAuth();
  const [pi, setPi] = useState(null);
  const data = mockDashboardData;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/pi');
        if (!res.ok) throw new Error('Failed to fetch PI metrics');
        const json = await res.json();
        if (!cancelled) setPi(json);
      } catch (err) {
        // keep fallback
        // console.warn(err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Reporting Dashboard</h1>
      {user ? (
        <>
          {/* User Welcome Banner - Adjusted for better visual separation */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm border-l-4 border-blue-600">
            <div className="text-lg font-semibold text-gray-800">Welcome back, {user.firstName + ' ' +user.lastName}! 👋</div>
            <div className="text-sm text-gray-600">Your current role: <span className="font-medium">{user.roles.map((r) => r.displayName).join(', ')}</span></div>
            {user.roles.some((r) => r.name === 'admin') && (
              <div className="mt-3">
                <Link to="/admin" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Go to Admin</Link>
              </div>
            )}
          </div>

          {/* KPI Cards - Using StatCard with trends */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Waste Collected"
              subtitle="Collected today"
              value={pi?.totalWasteCollected ? `${pi.totalWasteCollected.value.kg} kg` : data.totalWaste.value}
              trendValue={data.totalWaste.trend}
              trendType={data.totalWaste.type}
              timestamp={pi?.totalWasteCollected?.recordedAt}
            />
            <StatCard
              title="Missed Collections"
              subtitle="Missed today"
              value={pi?.missedCollections?.value ?? data.missedCollections.value}
              trendValue={data.missedCollections.trend}
              trendType={data.missedCollections.type}
              timestamp={pi?.missedCollections?.recordedAt}
            />
            <StatCard
              title="Active Zones"
              subtitle="Zones reporting today"
              value={pi?.activeZones?.value ?? data.activeZones.value}
              trendValue={data.activeZones.trend}
              trendType={data.activeZones.type}
              timestamp={pi?.activeZones?.recordedAt}
            />
            <StatCard
              title="Efficiency %"
              subtitle="Route efficiency"
              value={pi?.efficiencyPercent ? `${pi.efficiencyPercent.value}%` : data.efficiency.value}
              trendValue={data.efficiency.trend}
              trendType={data.efficiency.type}
              timestamp={pi?.efficiencyPercent?.recordedAt}
            />
          </div>

          {/* Main Trend Chart and New Reports Button */}
          <WasteCollectionTrend />

          {/* Deep Dive Analysis */}
          <h2 className="text-2xl font-semibold text-gray-900 pt-2">Detailed Analysis</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WasteTypeChart />
            <WasteFillChart />
          </div>

        </>
      ) : (
        <p className="text-gray-700">Please log in</p>
      )}
    </div>
  );
}