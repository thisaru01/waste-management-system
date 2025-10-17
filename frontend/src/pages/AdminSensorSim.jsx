import { useEffect, useState } from 'react';
import { listBins, updateBinSensor } from '../services/bins';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { Card, CardContent, CardHeader } from '../components/ui/Card.jsx';
import { Table, TableContainer, TBody, THead, TH, TD } from '../components/ui/Table.jsx';

function PercentBadge({ value }) {
  const color = value >= 85 ? 'bg-red-100 text-red-700' : value >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700';
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}>{value}%</span>;
}

export default function AdminSensorSim() {
  const [bins, setBins] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listBins();
      setBins(data);
    } catch (e) {
      setError('Failed to load bins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDraftChange = (id, field, value) => {
    setDraft((d) => ({
      ...d,
      [id]: {
        ...d[id],
        [field]: value,
      },
    }));
    setError('');
    setSuccess('');
  };

  const onSubmitRow = async (id) => {
    const d = draft[id] || {};
    const payload = {};
    if (d.fillLevelPercent !== undefined && d.fillLevelPercent !== '') payload.fillLevelPercent = Number(d.fillLevelPercent);
    if (d.weightKg !== undefined && d.weightKg !== '') payload.weightKg = Number(d.weightKg);
    if (d.status) payload.status = d.status;
    if (Object.keys(payload).length === 0) {
      setError('Enter fill level and/or weight, or change status to update');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await updateBinSensor(id, payload);
      setSuccess('Sensor values updated');
      // Notify other UI parts that a bin was updated (status change, etc.)
      try {
        window.dispatchEvent(new CustomEvent('binUpdated', { detail: updated }));
      } catch (e) {
        // ignore in non-browser/test envs
      }

      // If the status moved to a terminal collected state, persist a
      // lightweight history record and emit a binCollected event so the
      // CollectionHistory page shows the entry even if PendingCollection
      // wasn't open to perform the persistence.
      try {
        const st = (updated.status ?? '').toString().toLowerCase();
        if (st === 'collected' || st === 'collector') {
          const record = {
            date: new Date().toLocaleDateString(),
            id: updated.code || updated._id || updated.id || '—',
            location: (updated.location && (updated.location.description || updated.location)) || '—',
            type: updated.type || '—',
            fill: (updated.fillLevelPercent ?? updated.fillNumeric ?? updated.fill ?? updated.fillLevel ?? '–') + ' %',
            status: 'Collected',
          };
          const key = 'collectionHistoryRecords';
          const raw = localStorage.getItem(key);
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(record);
          localStorage.setItem(key, JSON.stringify(list));
          try {
            window.dispatchEvent(new CustomEvent('binCollected', { detail: updated }));
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore storage errors
      }
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update bin');
    } finally {
      setLoading(false);
    }
  };
//comment
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader title="Sensor Simulation" subtitle="View bins and simulate sensor readings (fill level and weight)." />
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Button onClick={load} variant="secondary" disabled={loading}>Refresh</Button>
            {loading && <span className="text-sm text-gray-500">Loading…</span>}
            {success && <span className="text-sm text-green-700">{success}</span>}
            {error && <span className="text-sm text-red-700">{error}</span>}
          </div>

          <TableContainer>
            <Table>
              <THead>
                <tr>
                  <TH>Code</TH>
                  <TH>Type</TH>
                  <TH>Location</TH>
                  <TH>Capacity (L)</TH>
                  <TH>Fill</TH>
                  <TH>Weight (kg)</TH>
                  <TH>Status</TH>
                  <TH>Update</TH>
                </tr>
              </THead>
              <TBody>
                {bins.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <TD className="font-mono text-xs md:text-sm">{b.code}</TD>
                    <TD className="capitalize">{b.type}</TD>
                    <TD>{b.location?.description || '—'}</TD>
                    <TD>{b.capacityLiters}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <PercentBadge value={b.fillLevelPercent ?? 0} />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={draft[b._id]?.fillLevelPercent ?? ''}
                          placeholder="%"
                          onChange={(e) => onDraftChange(b._id, 'fillLevelPercent', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{b.weightKg?.toFixed?.(2) ?? b.weightKg ?? 0}</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={draft[b._id]?.weightKg ?? ''}
                          placeholder="kg"
                          onChange={(e) => onDraftChange(b._id, 'weightKg', e.target.value)}
                          className="w-28"
                        />
                      </div>
                    </TD>
                    <TD>
                      <select
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={draft[b._id]?.status ?? b.status ?? 'normal'}
                        onChange={(e) => onDraftChange(b._id, 'status', e.target.value)}
                      >
                        <option value="normal">Normal</option>
                        <option value="needs-collection">Needs collection</option>
                        <option value="collected">Collected</option>
                        <option value="unauthorized-collection">Unauthorized collection</option>
                        <option value="overflow">Overflow</option>
                      </select>
                    </TD>
                    <TD>
                      <Button onClick={() => onSubmitRow(b._id)} disabled={loading}>Apply</Button>
                    </TD>
                  </tr>
                ))}
                {bins.length === 0 && (
                  <tr>
                    <TD colSpan={8}>
                      <div className="px-4 py-6 text-center text-gray-500">No bins found.</div>
                    </TD>
                  </tr>
                )}
              </TBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
}
