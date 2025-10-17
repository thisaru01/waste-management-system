import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import WasteTypeChart from '../components/ui/WasteTypeChart.jsx';
import WasteFillChart from '../components/ui/WasteFillChart.jsx';
import WasteCollectionTrendChart from '../components/ui/WasteCollectionTrendChart.jsx';
// ✨ IMPORTING CARD COMPONENTS
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx'; 

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

// StatCard Component (UPDATED to use Card, CardHeader, CardContent)
const StatCard = ({ title, subtitle, value, trendValue, trendType = 'positive', timestamp }) => {
  const trendColor = trendType === 'positive' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trendType === 'positive' ? '▲' : '▼';

  const timeLabel = timestamp ? `Updated ${new Date(timestamp).toLocaleTimeString()}` : 'Today';

  return (
    // Replaced the basic div with the Card component structure
    <Card className="p-0">
      <CardHeader title={title} subtitle={subtitle} />
      
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className={`text-sm font-medium ${trendColor} flex items-center`}>
            <span className="mr-1">{trendIcon}</span> {trendValue}
          </div>
        </div>
        <div className="text-xs text-gray-500 text-right">{timeLabel}</div>
      </CardContent>
    </Card>
  );
};

// Placeholder for the main Waste Collection Trend Chart (matching the large image block)


export default function Home() {
  const { user } = useAuth();
  const [pi, setPi] = useState(null);
  const [now, setNow] = useState(new Date());
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

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reporting Dashboard</h1>
        <div className="text-sm text-gray-600">{now.toLocaleString()}</div>
      </div>
      {user ? (
        <>
          {/* User Welcome Banner - WRAPPED in Card structure */}
          <Card className="shadow-sm border-l-4 border-blue-600 p-0">
            <CardContent>
                <div className="text-lg font-semibold text-gray-800">Welcome back, {user.firstName + ' ' +user.lastName}! 👋</div>
                <div className="text-sm text-gray-600">Your current role: <span className="font-medium">{user.roles.map((r) => r.displayName).join(', ')}</span></div>
                {user.roles.some((r) => r.name === 'admin') && (
                  <div className="mt-3">
                    <Link to="/admin" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Go to Admin</Link>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* KPI Cards Header - New Card for "Today Overview" */}
          <Card className="p-0">
            <CardHeader title="Today" subtitle="Overview" />
            <CardContent>
              {/* KPI Cards Grid */}
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
            </CardContent>
          </Card>

          {/* Main Trend Chart and New Reports Button */}
          <WasteCollectionTrendChart />

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