import { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { TableContainer, Table, THead, TBody, TH, TD } from '../components/ui/Table.jsx';

function StatusPill({ status }) {
  const cls = status === 'Collected' ? 'bg-green-600 text-white px-3 py-1 rounded-full text-sm' : 'bg-orange-400 text-white px-3 py-1 rounded-full text-sm';
  return <span className={cls}>{status}</span>;
}

export default function CollectionHistory() {
  // Default fill set to 0 so history shows all records by default
  const [filters, setFilters] = useState({ type: '', location: '', start: '', end: '', fill: 0 });

  // Initialize with an empty list and load persisted records (if any)
  const [records, setRecords] = useState([]);

  // Listen for binCollected events and append a record to the history.
  useEffect(() => {
    const handler = (ev) => {
      const b = ev?.detail;
      if (!b) return;
      // Create a simple record shape — keep it minimal and safe if fields missing
      const record = {
        date: new Date().toLocaleDateString(),
        id: b.code || b._id || b.id || '—',
        location: (b.location && (b.location.description || b.location)) || '—',
        type: b.type || '—',
        fill: (b.fillLevelPercent ?? b.fillNumeric ?? b.fill ?? b.fillLevel ?? '–') + ' %',
        status: 'Collected',
      };
      setRecords((prev) => [record, ...prev]);
    };
    window.addEventListener('binCollected', handler);
    return () => window.removeEventListener('binCollected', handler);
  }, []);

  // Load persisted records from localStorage (if any) so history page shows
  // collected bins that happened while this page was not open.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('collectionHistoryRecords');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return;
      setRecords((prev) => {
        // Merge persisted records, avoiding duplicates by id+date
        const seen = new Set(prev.map((r) => `${r.date}|${r.id}`));
        const merged = [...list.filter((r) => !seen.has(`${r.date}|${r.id}`)), ...prev];
        return merged;
      });
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // apply filters from the UI: type, location (substring, case-insensitive), date range and minimum fill
  const filteredRecords = records.filter((r) => {
    // type filter
    if (filters.type && filters.type !== '' && r.type !== filters.type) return false;

    // location filter (substring, case-insensitive)
    if (filters.location && filters.location.trim() !== '') {
      const loc = String(r.location ?? '').toLowerCase();
      const q = String(filters.location).toLowerCase().trim();
      if (!loc.includes(q)) return false;
    }

    // date range filter (inputs are YYYY-MM-DD)
    if (filters.start) {
      const start = new Date(filters.start);
      const d = new Date(r.date);
      if (d < start) return false;
    }
    if (filters.end) {
      const end = new Date(filters.end);
      const d = new Date(r.date);
      // include end date
      if (d > end) return false;
    }

    // fill level filter (r.fill like '90 %')
    if (filters.fill !== undefined && filters.fill !== null && String(filters.fill) !== '') {
      const fillNum = Number(String(r.fill).replace(/[^0-9.-]+/g, '')) || 0;
      const minFill = Number(filters.fill) || 0;
      if (fillNum < minFill) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Collection List" subtitle="" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select value={filters.type} onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))} className="border-green-50">
          <option value="">Select Waste Type</option>
          <option>Plastic</option>
          <option>Food</option>
          <option>All</option>
        </Select>
        <Input placeholder="Location : Rajagiriya" value={filters.location} onChange={(e) => setFilters((s) => ({ ...s, location: e.target.value }))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
        <Input type="date" value={filters.start} onChange={(e) => setFilters((s) => ({ ...s, start: e.target.value }))} />
        <Input type="date" value={filters.end} onChange={(e) => setFilters((s) => ({ ...s, end: e.target.value }))} />
        <div className="md:col-span-1 col-span-2">
          <label className="text-sm text-gray-700">Fill Level</label>
          <input type="range" min="0" max="100" value={filters.fill} onChange={(e) => setFilters((s) => ({ ...s, fill: e.target.value }))} className="w-full mt-2" />
        </div>
        <div className="flex items-center">
          <Button variant="success">Filter Bins</Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100 bg-white">
        <TableContainer>
          <Table>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Location</TH>
                <TH>Bin ID</TH>
                <TH>Waste Type</TH>
                <TH>Fill Level</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {filteredRecords.map((r, i) => (
                <tr key={i} className="border-t">
                  <TD className="py-4">{r.date}</TD>
                  <TD className="py-4">{r.location?.description ?? r.location ?? '—'}</TD>
                  <TD className="py-4">{r.id}</TD>
                  <TD className="py-4">{r.type}</TD>
                  <TD className="py-4">{r.fill}</TD>
                  <TD className="py-4 text-right"><StatusPill status={r.status} /></TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
