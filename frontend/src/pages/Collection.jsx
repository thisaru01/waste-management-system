import { useEffect, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { TableContainer, Table, THead, TBody, TH, TD } from '../components/ui/Table.jsx';
import { listBins, listFlaggedBins, assignBin } from '../services/bins';
import { listCollectors } from '../services/users';
import Modal from '../components/ui/Modal.jsx';
import { transformAndSortBins, getLocationKey } from '../utils/binHelpers';
import { useAuth } from '../context/AuthContext.jsx';

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
  const { hasRole } = useAuth();
  const canAssign = hasRole('authority');
  const nextPickup = new Date();
  nextPickup.setDate(nextPickup.getDate() + 3);
  const target = nextPickup.getTime();

  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForBin, setAssignForBin] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [collectorsLoading, setCollectorsLoading] = useState(false);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  // threshold for flagging bins
  const THRESHOLD = 85;

  /**
   * Handler invoked when the user clicks the Assign button for a bin row.
   * Currently this is a small placeholder that prompts for a collector name
   * and logs the assignment. Replace this with a proper modal or API call
   * when integrating with the assignment backend.
   *
   * @param {Object} bin - the bin object being assigned
   */
  const openAssignModal = async (bin) => {
    setError('');
    setAssignForBin(bin);
    setSelectedCollectorId('');
    setAssignOpen(true);
    setCollectorsLoading(true);
    try {
      const list = await listCollectors();
      setCollectors(list);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load collectors');
    } finally {
      setCollectorsLoading(false);
    }
  };

  const confirmAssign = async () => {
    if (!assignForBin || !selectedCollectorId) return;
    setSavingAssign(true);
    try {
      const updated = await assignBin(assignForBin._id || assignForBin.id, selectedCollectorId);
      // Update local bins state with updated bin
      setBins((prev) => prev.map((b) => ((b._id || b.id) === (updated._id || updated.id) ? { ...b, ...updated } : b)));
      setAssignOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to assign bin');
    } finally {
      setSavingAssign(false);
    }
  };

  /**
   * Assign a collector to all bins at a given location key.
   * This will prompt once and then apply the assignment to every bin
   * that shares the same location (useful when multiple bins are colocated).
   *
   * @param {string} locKey - stable location key as returned by getLocationKey
   */
  const assignCollectorForLocation = (locKey) => {
    try {
      const items = bins.filter((b) => getLocationKey(b) === locKey);
      if (!items || items.length === 0) return;
      const ids = items.map((b) => b._id ?? b.id ?? b.code ?? '(unknown)');
      const collector = window.prompt(`Assign collector for ${locKey} (bins: ${ids.join(', ')})`);
      if (!collector) return;
      // TODO: call API to persist assignment for all bins. Keeping placeholder for now.
      console.log('Assigning collector to location', { locKey, ids, collector });
      // eslint-disable-next-line no-alert
      alert(`Assigned ${collector} to ${ids.length} bin(s) at ${locKey}`);
    } catch (err) {
      console.error('assignCollectorForLocation error', err);
      setError('Failed to assign collector');
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // prefer calling flagged endpoint so non-admin users can see flagged bins
    listFlaggedBins(THRESHOLD)
      .then((data) => {
        if (!mounted) return;
        // transform and sort using helper to keep component code clean
        setBins(transformAndSortBins(data, THRESHOLD));
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
    <>
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

          {/* Overflow notification intentionally removed from Collection view; alert appears on the dashboard. */}

          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const data = await listFlaggedBins(THRESHOLD);
                  setBins(transformAndSortBins(data, THRESHOLD));
                } catch (e) {
                  setError(e?.response?.data?.message || e.message || 'Failed to load bins');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Refresh
            </Button>
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
                  {(() => {
                    let prevKey = null;
                    return bins.map((b, idx) => {
                      const locKey = getLocationKey(b);
                      const showAssignForLocation = locKey !== prevKey;
                      prevKey = locKey;
                      return (
                        <tr key={b._id ?? b.id ?? `${b.code ?? (b.location?.description ?? b.location ?? 'loc')}-${idx}`} className="border-t">
                          <TD className="py-4">{b.location?.description ?? b.location ?? '—'}</TD>
                          <TD className="py-4">{(b.fillNumeric ?? '–') + ' %'}</TD>
                          <TD className="py-4">{b.type}</TD>
                          <TD className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <StatusBadge status={(b.status && String(b.status).toLowerCase().includes('collected')) ? 'Collected' : 'Pending'} />
                              </div>
                              {canAssign && (
                                <div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sm"
                                    onClick={() => openAssignModal(b)}
                                    aria-label={`Assign collector to bin ${b.code ?? b._id ?? ''}`}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TD>
                        </tr>
                      );
                    });
                  })()}
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
  {/* Assign Collector Modal (authority only) */}
  {canAssign && (
    <Modal
      isOpen={assignOpen}
      onClose={() => setAssignOpen(false)}
      title={`Assign Collector${assignForBin ? ` — ${assignForBin.code || assignForBin._id || ''}` : ''}`}
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={savingAssign}>Cancel</Button>
          <Button variant="primary" onClick={confirmAssign} disabled={!selectedCollectorId || savingAssign}>
            {savingAssign ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      )}
    >
      {collectorsLoading ? (
        <div className="text-sm text-gray-600">Loading collectors…</div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Select a collector to assign to this bin.</div>
          <div className="max-h-64 overflow-auto border rounded-md divide-y">
            {collectors.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No collectors found. Create a user with the collector role first.</div>
            )}
            {collectors.map((u) => {
              const id = u._id || u.id;
              const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
              const isSel = selectedCollectorId === id;
              return (
                <label key={id} className={`flex items-center gap-3 p-3 cursor-pointer ${isSel ? 'bg-blue-50' : ''}`}>
                  <input type="radio" name="collector" value={id} checked={isSel} onChange={() => setSelectedCollectorId(id)} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-gray-500">{u.email}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
  </Modal>
  )}
    </>
  );
}

// Inline below the component export to keep file scope
/* Modal UI to assign a bin to a collector */

