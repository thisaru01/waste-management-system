import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { Card, CardHeader, CardContent } from "../components/ui/Card.jsx";
import {
  TableContainer,
  Table,
  THead,
  TBody,
  TH,
  TD,
} from "../components/ui/Table.jsx";
import { listFlaggedBins, assignBin } from "../services/bins";
import { listCollectors } from "../services/users";
import Modal from "../components/ui/Modal.jsx";
import { transformAndSortBins } from "../utils/binHelpers";
import { useAuth } from "../context/AuthContext.jsx";

function StatusBadge({ status }) {
  // Normalize status
  const s = (status ?? "").toString().toLowerCase();
  let cls =
    "inline-block bg-gray-300 text-gray-800 px-3 py-1 rounded-full text-sm font-medium";
  let label = status ?? "Unknown";
  if (s === "collected") {
    cls =
      "inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium";
    label = "Collected";
  } else if (s === "needs-collection") {
    cls =
      "inline-block bg-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium";
    label = "Needs collection";
  } else if (s === "overflow") {
    cls =
      "inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium";
    label = "Overflow";
  } else if (s === "assigned") {
    cls =
      "inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium";
    label = "Assigned";
  }
  return <span className={cls}>{label}</span>;
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
      {box(days, "Days")}
      {box(hours, "Hours")}
      {box(mins, "Minutes")}
      {box(secs, "Seconds")}
    </div>
  );
}

export default function Collection() {
  const { hasRole } = useAuth();
  const canAssign = hasRole("authority");
  const nextPickup = new Date();
  nextPickup.setDate(nextPickup.getDate() + 3);
  const target = nextPickup.getTime();

  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  // quantity left empty string to allow a placeholder option to be shown
  // the actual value when selected will be converted to Number
  const [quantity, setQuantity] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForBin, setAssignForBin] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [collectorsLoading, setCollectorsLoading] = useState(false);
  const [selectedCollectorId, setSelectedCollectorId] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);
  // Bulk-assign (filtered) state — activated when a location filter is set
  // and the authority user chooses to assign all displayed bins.
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedCollectorIdBulk, setSelectedCollectorIdBulk] = useState("");
  const [savingBulkAssign, setSavingBulkAssign] = useState(false);

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
    setError("");
    setAssignForBin(bin);
    setSelectedCollectorId("");
    setAssignOpen(true);
    setCollectorsLoading(true);
    try {
      const list = await listCollectors();
      setCollectors(list);
    } catch (e) {
      setError(
        e?.response?.data?.message || e.message || "Failed to load collectors"
      );
    } finally {
      setCollectorsLoading(false);
    }
  };

  const confirmAssign = async () => {
    if (!assignForBin || !selectedCollectorId) return;
    setSavingAssign(true);
    try {
      const updated = await assignBin(
        assignForBin._id || assignForBin.id,
        selectedCollectorId
      );
      // Remove the assigned bin from the flagged list so it no longer
      // appears on the Collection dashboard. The backend marks the bin
      // with status 'assigned' when a collector is assigned; we remove
      // it locally to keep the UI responsive without refetching.
      setBins((prev) => prev.filter((b) => (b._id || b.id) !== (updated._id || updated.id)));
      // Notify other parts of the UI (Pending view) that a bin was assigned
      try {
        window.dispatchEvent(new CustomEvent('binAssigned', { detail: updated }));
      } catch (e) {
        // ignore in non-browser or test environments
      }
      setAssignOpen(false);
    } catch (e) {
      setError(
        e?.response?.data?.message || e.message || "Failed to assign bin"
      );
    } finally {
      setSavingAssign(false);
    }
  };

  // bulk assign removed per user request


  // assignCollectorForLocation removed — unused helper

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
        console.error("listBins error", err);
        const msg =
          err?.response?.data?.message || err?.message || "Failed to load bins";
        if (mounted) setError(msg);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Compute the displayed (filtered) bins once for reuse in rendering and
  // for bulk-assign. Behavior:
  // - If a locationFilter is provided, filter by location.
  // - If quantity is a number and a locationFilter is present, limit the
  //   result to the first `quantity` items (client-side limit).
  // - If no locationFilter is provided, show the full bins list (quantity
  //   does not apply per product requirement).
  const displayedBins = (locationFilter || "").toString().trim()
    ? (() => {
          const filtered = bins.filter((b) => {
            const loc = (b.location && (b.location.description || b.location)) || "";
            return loc.toString().toLowerCase().includes(locationFilter.toString().toLowerCase());
          }).slice();
          // Prioritize overflow bins within the same location. For bins that
          // share the same location string, move ones with status 'overflow'
          // to the top of that location's rows. Other ordering is preserved.
          filtered.sort((a, b) => {
            const locA = (a.location && (a.location.description || a.location) || "").toString().toLowerCase();
            const locB = (b.location && (b.location.description || b.location) || "").toString().toLowerCase();
            if (locA === locB) {
              const aFill = Number(a.fillNumeric ?? a.fill ?? 0);
              const bFill = Number(b.fillNumeric ?? b.fill ?? 0);
              const aOverflow = aFill >= 100 || (a.status || "").toString().toLowerCase() === "overflow";
              const bOverflow = bFill >= 100 || (b.status || "").toString().toLowerCase() === "overflow";
              if (aOverflow && !bOverflow) return -1;
              if (bOverflow && !aOverflow) return 1;
            }
            return 0;
          });
        // apply client-side quantity limit only when a location filter exists
        return typeof quantity === "number" && !Number.isNaN(quantity) && quantity > 0
          ? filtered.slice(0, quantity)
          : filtered;
      })()
    : bins;

  const openBulkAssignModal = async () => {
    setError("");
    setSelectedCollectorIdBulk("");
    setCollectorsLoading(true);
    try {
      const list = await listCollectors();
      setCollectors(list);
      setBulkAssignOpen(true);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load collectors");
    } finally {
      setCollectorsLoading(false);
    }
  };

  const confirmBulkAssign = async () => {
    if (!selectedCollectorIdBulk) return;
    setSavingBulkAssign(true);
    try {
      const results = [];
      for (const b of displayedBins) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const res = await assignBin(b._id || b.id, selectedCollectorIdBulk);
          results.push(res);
        } catch (err) {
          console.error('assignBin error for', b, err);
        }
      }
      const assignedIds = new Set(results.map((r) => r._id || r.id));
      setBins((prev) => prev.filter((b) => !assignedIds.has(b._id || b.id)));
      try {
        window.dispatchEvent(new CustomEvent('binsBulkAssigned', { detail: { ids: Array.from(assignedIds), collector: selectedCollectorIdBulk } }));
      } catch (e) {}
      setBulkAssignOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to assign selected bins');
    } finally {
      setSavingBulkAssign(false);
    }
  };

  // Note: quantity should only apply when a locationFilter is provided.
  // If no locationFilter is set, we display the full bins list regardless
  // of the quantity selection — this matches the user's requested behavior.

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Collection Dashboard"
          subtitle="Bin Collection Summary"
        />

        <Card>
          <CardHeader title="Flagged Bins for Collection" subtitle={null} />
          <CardContent>
            <div className="text-4xl font-extrabold">
              {loading ? "…" : bins.length}
            </div>
            <div className="mt-2 text-sm text-green-600">
              Average Fill Level{" "}
              <span className="font-semibold">
                {loading
                  ? "–"
                  : (() => {
                      if (!bins || bins.length === 0) return "–";
                      const avg =
                        bins.reduce(
                          (s, b) => s + Number(b.fillNumeric || 0),
                          0
                        ) / bins.length;
                      return `${Math.round(avg)}%`;
                    })()}
              </span>
            </div>

            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

            {/* Overflow notification intentionally removed from Collection view; alert appears on the dashboard. */}

            <div className="mt-3">
              <div className="flex items-center gap-3">
                <Button
                variant="secondary"
                onClick={async () => {
                  setError("");
                  setLoading(true);
                  try {
                    const data = await listFlaggedBins(THRESHOLD);
                    setBins(transformAndSortBins(data, THRESHOLD));
                    // Reset filters so Refresh shows the full bin list as requested
                    setLocationFilter("");
                    setQuantity("");
                  } catch (e) {
                    setError(
                      e?.response?.data?.message ||
                        e.message ||
                        "Failed to load bins"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Refresh
                </Button>
                {/* Location filter placed immediately after the Refresh button to match
                    the existing location search style used elsewhere in the app. This
                    only filters the displayed rows; counts/averages above remain
                    based on the full flagged list as requested. */}
                <div className="w-72">
                  <Input
                    placeholder="Filter by location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    aria-label="Filter bins by location"
                  />
                </div>
                <div className="w-24">
                  <Select
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    aria-label="Select quantity"
                  >
                    <option value="" disabled>
                      Quantity
                    </option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </Select>
                </div>
                {canAssign && locationFilter.toString().trim() && (
                  <div>
                    <Button variant="primary" onClick={openBulkAssignModal} aria-label="Assign filtered bins">
                      Assign filtered ({displayedBins.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Overflow badges removed from Collections page per user request */}

            <div className="mt-6">
              <TableContainer>
                <Table>
                  <THead>
                    <tr>
                      <TH className="w-12">{/* reserved for icon/spacing */}</TH>
                      <TH>Location</TH>
                      <TH>Fill Level</TH>
                      <TH>Garbage Type</TH>
                      <TH>Status</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {displayedBins.map((b, idx) => {
                        return (
                          <tr
                            key={
                              b._id ??
                              b.id ??
                              `${
                                b.code ??
                                b.location?.description ??
                                b.location ??
                                "loc"
                              }-${idx}`
                            }
                            className="border-t"
                          >
                              <TD className="py-4">{/* spacer */}</TD>
                              <TD className="py-4">
                                {b.location?.description ?? b.location ?? "—"}
                              </TD>
                            <TD className="py-4">
                              {(b.fillNumeric ?? "–") + " %"}
                            </TD>
                            <TD className="py-4">{b.type}</TD>
                            <TD className="py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <StatusBadge status={b.status} />
                                </div>
                                {canAssign && !(locationFilter || "").toString().trim() && (
                                  <div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-sm"
                                      onClick={() => openAssignModal(b)}
                                      aria-label={`Assign collector to bin ${
                                        b.code ?? b._id ?? ""
                                      }`}
                                    >
                                      Assign
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TD>
                          </tr>
                        );
                      })}
                    {!loading && !error && bins.length === 0 && (
                      <tr>
                        <TD colSpan={5} className="py-6 text-center text-gray-500">
                          No flagged bins found.
                        </TD>
                      </tr>
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              {/* bulk assign removed per user preference */}
              <div>
                <Button variant="success">View All →</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
      {/* Assign Collector Modal (authority only) */}
      {canAssign && (
        <Modal
          isOpen={assignOpen}
          onClose={() => setAssignOpen(false)}
          title={`Assign Collector${
            assignForBin
              ? ` — ${assignForBin.code || assignForBin._id || ""}`
              : ""
          }`}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setAssignOpen(false)}
                disabled={savingAssign}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmAssign}
                disabled={!selectedCollectorId || savingAssign}
              >
                {savingAssign ? "Assigning…" : "Assign"}
              </Button>
            </div>
          }
        >
          {collectorsLoading ? (
            <div className="text-sm text-gray-600">Loading collectors…</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Select a collector to assign to this bin.
              </div>
              <div className="max-h-64 overflow-auto border rounded-md divide-y">
                {collectors.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">
                    No collectors found. Create a user with the collector role
                    first.
                  </div>
                )}
                {collectors.map((u) => {
                  const id = u._id || u.id;
                  const name =
                    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                    u.email;
                  const isSel = selectedCollectorId === id;
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 p-3 cursor-pointer ${
                        isSel ? "bg-blue-50" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="collector"
                        value={id}
                        checked={isSel}
                        onChange={() => setSelectedCollectorId(id)}
                      />
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
      {/* Bulk Assign Modal (assign filtered bins) */}
      {canAssign && (
        <Modal
          isOpen={bulkAssignOpen}
          onClose={() => setBulkAssignOpen(false)}
          title={`Assign Collector — ${displayedBins.length} filtered`}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setBulkAssignOpen(false)}
                disabled={savingBulkAssign}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmBulkAssign}
                disabled={!selectedCollectorIdBulk || savingBulkAssign || displayedBins.length === 0}
              >
                {savingBulkAssign ? 'Assigning…' : `Assign ${displayedBins.length}`}
              </Button>
            </div>
          }
        >
          {collectorsLoading ? (
            <div className="text-sm text-gray-600">Loading collectors…</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Select a collector to assign to the filtered bins.
              </div>
              <div className="max-h-64 overflow-auto border rounded-md divide-y">
                {collectors.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">
                    No collectors found. Create a user with the collector role first.
                  </div>
                )}
                {collectors.map((u) => {
                  const id = u._id || u.id;
                  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                  const isSel = selectedCollectorIdBulk === id;
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 p-3 cursor-pointer ${isSel ? 'bg-blue-50' : ''}`}
                    >
                      <input
                        type="radio"
                        name="collector-bulk"
                        value={id}
                        checked={isSel}
                        onChange={() => setSelectedCollectorIdBulk(id)}
                      />
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
      {/* bulk assign removed */}
    </>
  );
}

// Inline below the component export to keep file scope
/* Modal UI to assign a bin to a collector */
