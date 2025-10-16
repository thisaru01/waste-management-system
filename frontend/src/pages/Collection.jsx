import { useEffect, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { TableContainer, Table, THead, TBody, TH, TD } from '../components/ui/Table.jsx';

function StatusBadge({ status }) {
  const cls =
    status === 'Collected'
      ? 'inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium'
      : 'inline-block bg-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium';
  return <span className={cls}>{status}</span>;
}

function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const box = (v, label) => (
    <div className="bg-gray-100 rounded-md px-6 py-4 text-center">
      <div className="text-lg font-semibold">{v}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {box(days, 'Days')}
      {box(hours, 'Hours')}
      {box(mins, 'Minutes')}
      {box(secs, 'Seconds')}
    </div>
  );
}

export default function Collection() {
  const nextPickup = new Date();
  nextPickup.setDate(nextPickup.getDate() + 3);
  const target = nextPickup.getTime();

  const bins = [
    { location: '11/154 Main Street', fill: '90 %', type: 'Plastic', status: 'Pending' },
    { location: '28/125 Church Road, Colombo', fill: '88 %', type: 'Food', status: 'Pending' },
    { location: 'Bus Station, Main Street', fill: '100 %', type: 'All', status: 'Collected' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Collection Dashboard" subtitle="Bin Collection Summary" />

      <Card>
        <CardHeader title="Flagged Bins for Collection" subtitle={null} />
        <CardContent>
          <div className="text-4xl font-extrabold">23</div>
          <div className="mt-2 text-sm text-green-600">Average Fill Level <span className="font-semibold">+87%</span></div>

          <div className="mt-6">
            <TableContainer>
              <Table>
                <THead>
                  <tr>
                    <TH>Location</TH>
                    <TH>Fill Level</TH>
                    <TH>Garbage Type</TH>
                    <TH>Status</TH>
                  </tr>
                </THead>
                <TBody>
                  {bins.map((b, i) => (
                    <tr key={i} className="border-t">
                      <TD className="py-4">{b.location}</TD>
                      <TD className="py-4">{b.fill}</TD>
                      <TD className="py-4">{b.type}</TD>
                      <TD className="py-4 text-right"><StatusBadge status={b.status === 'Pending' ? 'Pending' : 'Collected'} /></TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </div>

          <div className="mt-6 flex justify-center">
            <Button variant="success">View All →</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-6">
        <div>
          <h4 className="text-sm font-medium">Next Scheduled Pickup</h4>
          <div className="text-xs text-gray-500">{nextPickup.toDateString()}</div>
          <Countdown target={target} />
        </div>

        <div>
          <h4 className="text-sm font-medium">Outstanding Payment</h4>
          <div className="text-xs text-green-600">$25.00</div>
          <div className="mt-3">
            <Button variant="success">Payments →</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
