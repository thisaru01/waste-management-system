import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import {
  Table,
  TableContainer,
  TBody,
  TH,
  TD,
  THead,
} from "../components/ui/Table.jsx";
import Button from "../components/ui/Button.jsx";
import { listAssignedBinsForCollector } from "../services/bins.js";
import { finishTodaySchedule } from "../services/history.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * BinCard Component
 * Mobile-friendly card view for a single bin
 */
function BinCard({ bin }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{bin.code}</h3>
          <p className="text-xs text-gray-500 capitalize">{bin.type}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize">
          {bin.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Capacity:</span>
          <span className="font-medium text-gray-900">
            {bin.capacityLiters}L
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fill Level:</span>
          <span className="font-medium text-gray-900">
            {bin.fillLevelPercent ?? "-"}%
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Weight:</span>
          <span className="font-medium text-gray-900">
            {bin.weightKg ?? "-"} kg
          </span>
        </div>

        {bin?.location?.description && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium text-gray-900 text-right ml-2">
              {bin.location.description}
            </span>
          </div>
        )}

        {bin?.owner && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Owner:</span>
            <span className="font-medium text-gray-900">
              {`${bin.owner.firstName || ""} ${
                bin.owner.lastName || ""
              }`.trim()}
            </span>
          </div>
        )}

        {bin.assignedAt && (
          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-600">Assigned:</span>
            <span className="text-xs text-gray-500">
              {new Date(bin.assignedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CollectorSchedule
 * Displays all bins assigned to the logged-in collector with full details.
 * Responsive: Card layout on mobile, table layout on desktop.
 */
export default function CollectorSchedule() {
  const { user } = useAuth();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingHistory, setSavingHistory] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listAssignedBinsForCollector();
        if (mounted) setBins(data || []);
      } catch (e) {
        if (mounted)
          setError(
            e?.response?.data?.message || e.message || "Failed to load schedule"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fullName = useMemo(
    () => `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    [user]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="My Schedule"
          subtitle={`Assigned bins for ${fullName || "collector"}`}
        />
        <CardContent>
          {loading && (
            <p className="text-sm text-gray-600">Loading assigned bins…</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && bins.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-8">
              No bins assigned to you yet.
            </p>
          )}

          {!loading && !error && bins.length > 0 && (
            <>
              {/* Mobile Card View (hidden on md and up) */}
              <div className="block md:hidden space-y-3">
                {bins.map((bin) => (
                  <BinCard key={bin._id} bin={bin} />
                ))}
              </div>

              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block">
                <TableContainer>
                  <Table>
                    <THead>
                      <tr>
                        <TH>Code</TH>
                        <TH>Type</TH>
                        <TH>Capacity (L)</TH>
                        <TH>Location</TH>
                        <TH>Owner</TH>
                        <TH>Fill %</TH>
                        <TH>Weight (kg)</TH>
                        <TH>Status</TH>
                        <TH>Assigned At</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {bins.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50">
                          <TD className="font-medium">{b.code}</TD>
                          <TD className="capitalize">{b.type}</TD>
                          <TD>{b.capacityLiters}</TD>
                          <TD>{b?.location?.description || "-"}</TD>
                          <TD>
                            {b?.owner
                              ? `${b.owner.firstName || ""} ${
                                  b.owner.lastName || ""
                                }`.trim()
                              : "-"}
                          </TD>
                          <TD>{b.fillLevelPercent ?? "-"}</TD>
                          <TD>{b.weightKg ?? "-"}</TD>
                          <TD>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">
                              {b.status}
                            </span>
                          </TD>
                          <TD className="text-xs">
                            {b.assignedAt
                              ? new Date(b.assignedAt).toLocaleString()
                              : "-"}
                          </TD>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </TableContainer>
              </div>

              {/* Finish Schedule Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={
                    savingHistory || bins.some((b) => b.status !== "collected")
                  }
                  onClick={async () => {
                    try {
                      setSavingHistory(true);
                      await finishTodaySchedule();
                      // Optionally, provide user feedback or refresh
                    } catch (e) {
                      setError(
                        e?.response?.data?.message ||
                          e.message ||
                          "Failed to finish schedule"
                      );
                    } finally {
                      setSavingHistory(false);
                    }
                  }}
                >
                  {savingHistory ? "Saving..." : "Finished Schedule"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
