import { useEffect, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { TableContainer, Table, THead, TBody, TH, TD } from '../components/ui/Table.jsx';
import { listBins, listFlaggedBins } from '../services/bins';

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

  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // threshold for flagging bins
  const THRESHOLD = 85;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // prefer calling flagged endpoint so non-admin users can see flagged bins
    listFlaggedBins(THRESHOLD)
      .then((data) => {
        if (!mounted) return;
        // helper to parse various fill representations like 90, '90 %', '90%'
        const parseFill = (val) => {
          if (val === undefined || val === null) return NaN;
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            // extract first number-like token
            const m = val.match(/-?\d+(?:\.\d+)?/);
            return m ? Number(m[0]) : NaN;
          }
          return NaN;
        };

            const flagged = (data || []).map((b) => {
          const raw = b.fillLevelPercent ?? b.fill ?? b.fillLevel ?? null;
          const fillNumeric = parseFill(raw);
          return { ...b, fillNumeric };
        }).filter((b) => !Number.isNaN(b.fillNumeric) && b.fillNumeric >= THRESHOLD);

        setBins(flagged);
      })
      .catch((err) => {
        console.error('listBins error', err);
        const msg = err?.response?.data?.message || err?.message || 'Failed to load bins';
        if (mounted) setError(msg);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Collection Dashboard" subtitle="Bin Collection Summary" />

      <Card>
        <CardHeader title="Flagged Bins for Collection" subtitle={null} />
        <CardContent>
          <div className="text-4xl font-extrabold">{loading ? '…' : bins.length}</div>
          <div className="mt-2 text-sm text-green-600">Average Fill Level <span className="font-semibold">{loading ? '–' : (() => {
            if (!bins || bins.length === 0) return '–';
            const avg = bins.reduce((s, b) => s + (Number(b.fillNumeric || 0)), 0) / bins.length;
            return `${Math.round(avg)}%`;
          })()}</span></div>

          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

          <div className="mt-3">
            <Button variant="secondary" onClick={() => { setError(''); setLoading(true); listBins().then(d => {
              // reuse same parsing logic as above
              const parseFill = (val) => {
                if (val === undefined || val === null) return NaN;
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                  const m = val.match(/-?\d+(?:\.\d+)?/);
                  return m ? Number(m[0]) : NaN;
                }
                return NaN;
              };
              const flagged = (d || []).map((b) => {
                const raw = b.fillLevelPercent ?? b.fill ?? b.fillLevel ?? null;
                const fillNumeric = parseFill(raw);
                return { ...b, fillNumeric };
              }).filter((b) => !Number.isNaN(b.fillNumeric) && b.fillNumeric >= THRESHOLD);
              setBins(flagged);
            }).catch(e => setError(e?.response?.data?.message || e.message || 'Failed to load bins')).finally(()=>setLoading(false)); }}>Refresh</Button>
          </div>

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
                  {bins.map((b) => (
                    <tr key={b._id ?? b.id ?? b.location ?? Math.random()} className="border-t">
                      <TD className="py-4">{b.location?.description ?? b.location ?? '—'}</TD>
                      <TD className="py-4">{(b.fillNumeric ?? '–') + ' %'}</TD>
                      <TD className="py-4">{b.type}</TD>
                      <TD className="py-4 text-right"><StatusBadge status={(b.status && String(b.status).toLowerCase().includes('collected')) ? 'Collected' : 'Pending'} /></TD>
                    </tr>
                  ))}
                  {!loading && !error && bins.length === 0 && (
                    <tr>
                      <TD colSpan={4} className="py-6 text-center text-gray-500">No flagged bins found.</TD>
                    </tr>
                  )}
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
