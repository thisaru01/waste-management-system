import { useState } from 'react';
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
  const [filters, setFilters] = useState({ type: '', location: '', start: '', end: '', fill: 50 });

  const records = [
    { date: 'July 15, 2024', id: 'Bin 123', type: 'Plastic', fill: '90 %', status: 'Pending' },
    { date: 'July 8, 2024', id: 'Bin 123', type: 'Food', fill: '88 %', status: 'Pending' },
    { date: 'July 1, 2024', id: 'Bin 123', type: 'All', fill: '100 %', status: 'Collected' },
    { date: 'June 24, 2024', id: 'Bin 123', type: 'Chemicals', fill: '85 %', status: 'Collected' },
    { date: 'June 17, 2024', id: 'Bin 123', type: 'Dust', fill: '94 %', status: 'Collected' },
  ];

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
              {records.map((r, i) => (
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
