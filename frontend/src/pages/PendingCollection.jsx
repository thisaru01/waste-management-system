import PageHeader from "../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardContent } from "../components/ui/Card.jsx";
import {
  TableContainer,
  Table,
  THead,
  TBody,
  TH,
  TD,
} from "../components/ui/Table.jsx";
import { useEffect, useState } from "react";
import { listFlaggedBins } from "../services/bins";
import { transformAndSortBins, parseFill, getLocationKey } from "../utils/binHelpers";

function transformPendingBins(bins = [], threshold = 85) {
  const mapped = (bins || []).map((b) => {
    const raw = b.fillLevelPercent ?? b.fill ?? b.fillLevel ?? null;
    const fillNumeric = parseFill(raw);
    return { ...b, fillNumeric };
  }).filter((b) => {
    // Only include bins that are assigned (explicitly assigned by an authority)
    // A bin is considered assigned if the backend set its status to 'assigned'
    // or there is an assignedCollector populated.
    const status = (b.status ?? "").toString().toLowerCase();
    // Only include bins whose status is explicitly 'assigned'. This
    // guarantees 'needs-collection' or 'overflow' items are excluded.
    return status === 'assigned';
  });

  mapped.sort((a, c) => {
    const ka = getLocationKey(a);
    const kc = getLocationKey(c);
    const locCmp = ka.localeCompare(kc);
    if (locCmp !== 0) return locCmp;
    const codeA = (a.code ?? "").toString();
    const codeC = (c.code ?? "").toString();
    const codeCmp = codeA.localeCompare(codeC);
    if (codeCmp !== 0) return codeCmp;
    const idA = (a._id ?? a.id ?? "").toString();
    const idC = (c._id ?? c.id ?? "").toString();
    return idA.localeCompare(idC);
  });

  return mapped;
}

export default function PendingCollection() {
  const THRESHOLD = 85;
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listFlaggedBins(THRESHOLD)
      .then((data) => {
        if (!mounted) return;
        setBins(transformPendingBins(data, THRESHOLD));
      })
      .catch((err) => {
        console.error("listBins error", err);
        if (mounted) setError(err?.message || "Failed to load pending bins");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for binAssigned events to add newly assigned bins immediately
  useEffect(() => {
    const handler = (ev) => {
      const updated = ev?.detail;
      if (!updated) return;
  const st = (updated.status ?? '').toString().toLowerCase();
  if (st !== 'assigned') return; // ignore non-assigned updates
      setBins((prev) => {
        const id = updated._id || updated.id;
        // Avoid duplicate entries
        if (prev.some((b) => (b._id || b.id) === id)) return prev;
        const withFill = (() => {
          const raw = updated.fillLevelPercent ?? updated.fill ?? updated.fillLevel ?? null;
          const fillNumeric = parseFill(raw);
          return { ...updated, fillNumeric };
        })();
        const next = [...prev, withFill];
        // sort next array same as transformPendingBins
        next.sort((a, c) => {
          const ka = getLocationKey(a);
          const kc = getLocationKey(c);
          const locCmp = ka.localeCompare(kc);
          if (locCmp !== 0) return locCmp;
          const codeA = (a.code ?? "").toString();
          const codeC = (c.code ?? "").toString();
          const codeCmp = codeA.localeCompare(codeC);
          if (codeCmp !== 0) return codeCmp;
          const idA = (a._id ?? a.id ?? "").toString();
          const idC = (c._id ?? c.id ?? "").toString();
          return idA.localeCompare(idC);
        });
        return next;
      });
    };
    window.addEventListener('binAssigned', handler);
    return () => window.removeEventListener('binAssigned', handler);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Pending collection" subtitle="Bins pending collection" />
      <Card>
        <CardHeader title="Pending Bins" subtitle="Bins flagged for collection" />
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">Showing assigned bins pending collection.</div>
              <TableContainer>
                <Table>
                  <THead>
                    <tr>
                      <TH>Location</TH>
                      <TH>Fill Level</TH>
                      <TH>Garbage Type</TH>
                      <TH>Status</TH>
                      <TH>Collector</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {bins.map((b, idx) => (
                      <tr key={b._id ?? b.id ?? `${b.code ?? b.location ?? 'loc'}-${idx}`} className="border-t">
                        <TD className="py-4">{b.location?.description ?? b.location ?? '—'}</TD>
                        <TD className="py-4">{(b.fillNumeric ?? '–') + ' %'}</TD>
                        <TD className="py-4">{b.type ?? '—'}</TD>
                        <TD className="py-4">
                          <span className={(() => {
                            const s = (b.status ?? '').toString().toLowerCase();
                            if (s === 'collected') return 'inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium';
                            if (s === 'needs-collection') return 'inline-block bg-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium';
                            if (s === 'overflow') return 'inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium';
                            if (s === 'assigned') return 'inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium';
                            return 'inline-block bg-gray-300 text-gray-800 px-3 py-1 rounded-full text-sm font-medium';
                          })()}>{b.status ?? '—'}</span>
                        </TD>
                        <TD className="py-4">{b.assignedCollector ? `${b.assignedCollector.firstName || ''} ${b.assignedCollector.lastName || ''}`.trim() || b.assignedCollector.email : '—'}</TD>
                      </tr>
                    ))}
                    {!loading && !error && bins.length === 0 && (
                      <tr>
                        <TD colSpan={5} className="py-6 text-center text-gray-500">No assigned bins found.</TD>
                      </tr>
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
