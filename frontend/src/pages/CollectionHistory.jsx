import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import {
  TableContainer,
  Table,
  THead,
  TBody,
  TH,
  TD,
} from "../components/ui/Table.jsx";
import { listMyHistory } from "../services/history.js";
import API from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

function StatusPill({ status }) {
  const cls =
    status === "Collected"
      ? "bg-green-600 text-white px-3 py-1 rounded-full text-sm"
      : "bg-orange-400 text-white px-3 py-1 rounded-full text-sm";
  return <span className={cls}>{status}</span>;
}

export default function CollectionHistory() {
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    start: "",
    end: "",
    fill: 50,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Authority sees all; collectors see only their history
        const isAuthority = hasRole("authority");
        const { data } = isAuthority
          ? await API.get("/api/history")
          : { data: await listMyHistory() };
        if (mounted) setHistory(data || []);
      } catch (e) {
        if (mounted)
          setError(
            e?.response?.data?.message || e.message || "Failed to load history"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hasRole]);

  const flatRecords = useMemo(() => {
    // Flatten each history doc's bins into table rows
    const rows = [];
    for (const h of history) {
      const finished = h.finishedAt || h.createdAt;
      const collectorName =
        h.collector?.firstName || h.collector?.lastName
          ? `${h.collector?.firstName || ""} ${
              h.collector?.lastName || ""
            }`.trim()
          : undefined;
      for (const b of h.bins || []) {
        rows.push({
          finishedAt: finished,
          binCode: b.code,
          type: b.type,
          fill:
            typeof b.fillLevelPercent === "number"
              ? `${b.fillLevelPercent} %`
              : "-",
          status: b.status === "collected" ? "Collected" : b.status,
          collector: collectorName,
          location: b.locationDescription || "-",
        });
      }
    }
    return rows;
  }, [history]);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Collection List" subtitle="" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select
          value={filters.type}
          onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))}
          className="border-green-50"
        >
          <option value="">Select Waste Type</option>
          <option>Plastic</option>
          <option>Food</option>
          <option>All</option>
        </Select>
        <Input
          placeholder="Location : Rajagiriya"
          value={filters.location}
          onChange={(e) =>
            setFilters((s) => ({ ...s, location: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
        <Input
          type="date"
          value={filters.start}
          onChange={(e) => setFilters((s) => ({ ...s, start: e.target.value }))}
        />
        <Input
          type="date"
          value={filters.end}
          onChange={(e) => setFilters((s) => ({ ...s, end: e.target.value }))}
        />
        <div className="md:col-span-1 col-span-2">
          <label className="text-sm text-gray-700">Fill Level</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.fill}
            onChange={(e) =>
              setFilters((s) => ({ ...s, fill: e.target.value }))
            }
            className="w-full mt-2"
          />
        </div>
        <div className="flex items-center">
          <Button variant="success">Filter Bins</Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100 bg-white">
        {loading && (
          <div className="p-4 text-sm text-gray-600">Loading history…</div>
        )}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        <TableContainer>
          <Table>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Bin</TH>
                <TH>Waste Type</TH>
                <TH>Fill Level</TH>
                <TH>Location</TH>
                {hasRole("authority") && <TH>Collector</TH>}
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {flatRecords.map((r, i) => (
                <tr key={i} className="border-t">
                  <TD className="py-4">
                    {r.finishedAt
                      ? new Date(r.finishedAt).toLocaleString()
                      : "-"}
                  </TD>
                  <TD className="py-4">{r.binCode}</TD>
                  <TD className="py-4">{r.type}</TD>
                  <TD className="py-4">{r.fill}</TD>
                  <TD className="py-4">{r.location}</TD>
                  {hasRole("authority") && (
                    <TD className="py-4">{r.collector || "-"}</TD>
                  )}
                  <TD className="py-4 text-right">
                    <StatusPill status={r.status} />
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
