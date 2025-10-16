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
import { listAssignedBinsForCollector } from "../services/bins.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * CollectorSchedule
 * Displays all bins assigned to the logged-in collector with full details.
 */
export default function CollectorSchedule() {
  const { user } = useAuth();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          {!loading && !error && (
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
                  {bins.length === 0 ? (
                    <tr>
                      <TD colSpan={9}>
                        <p className="text-sm text-gray-600">
                          No bins assigned to you yet.
                        </p>
                      </TD>
                    </tr>
                  ) : (
                    bins.map((b) => (
                      <tr key={b._id} className="hover:bg-gray-50">
                        <TD>{b.code}</TD>
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
                        <TD>
                          {b.assignedAt
                            ? new Date(b.assignedAt).toLocaleString()
                            : "-"}
                        </TD>
                      </tr>
                    ))
                  )}
                </TBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
