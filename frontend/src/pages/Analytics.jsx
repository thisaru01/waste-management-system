import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';

function Metric({ title, value, subtitle }) {
  return (
    <Card className="p-0">
      <CardHeader title={title} subtitle={subtitle} />
      <CardContent className="flex items-end justify-between gap-4">
        <div className="text-3xl font-semibold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { user } = useAuth();

  // Dummy data for the requested cards
  const data = useMemo(() => ({
    todayVolume: '2,340 kg',
    dailyPickups: '14 / 16',
    overfullAlerts: 3,
    topBins: [
      { id: 'BIN-102', fill: '98%' },
      { id: 'BIN-017', fill: '95%' },
      { id: 'BIN-221', fill: '92%' },
    ],
  }), []);

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ''}`}
        subtitle={new Date().toLocaleDateString()}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Today card: displayed first and spans columns on larger screens */}
        <div className="md:col-span-3">
          <Card className="p-0">
            <CardHeader title="Today" subtitle="Overview" />
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Metric title="Waste Volume" value={data.todayVolume} subtitle="Collected today" />
              <Metric title="Daily Pickups" value={data.dailyPickups} subtitle="Completed vs scheduled" />
              <Metric title="Overfull Alerts" value={data.overfullAlerts} subtitle="Active alerts" />
            </CardContent>
          </Card>
        </div>

        {/* Top bins list */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader title="Top Bins (Today)" subtitle="Most filled bins" />
            <CardContent>
              <ul className="space-y-2">
                {data.topBins.map((b) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">{b.id}</div>
                    <div className="text-sm text-gray-600">{b.fill}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader title="Quick Actions" subtitle="Shortcuts" />
            <CardContent>
              <div className="space-y-2">
                <button className="w-full rounded-md bg-green-600 px-3 py-2 text-sm text-white">Acknowledge alerts</button>
                <button className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm">View pickups</button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
