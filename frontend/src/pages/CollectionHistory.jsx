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
    <div>
      <PageHeader title="Collection List" subtitle="" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select value={filters.type} onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))}>
          <option value="">Select Waste Type</option>
          <option>Plastic</option>
          <option>Food</option>
          <option>All</option>
        </Select>
        <Input placeholder="Location : Rajagiriya" value={filters.location} onChange={(e) => setFilters((s) => ({ ...s, location: e.target.value }))} />
        <div className="flex gap-2">
          <Input type="date" value={filters.start} onChange={(e) => setFilters((s) => ({ ...s, start: e.target.value }))} />
          <Input type="date" value={filters.end} onChange={(e) => setFilters((s) => ({ ...s, end: e.target.value }))} />
        </div>
      </div>

  <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="text-sm text-gray-700">Fill Level</label>
          <input type="range" min="0" max="100" value={filters.fill} onChange={(e) => setFilters((s) => ({ ...s, fill: e.target.value }))} className="w-full" />
        </div>
        <div>
          <Button variant="success">Filter Bins</Button>
        </div>
      </div>

      <TableContainer>
        <Table>
          <THead>
            <tr>
              <TH>Date</TH>
              <TH>Bin ID</TH>
              <TH>Waste Type</TH>
              <TH>Fill Level</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {records.map((r, i) => (
              <tr key={i}>
                <TD>{r.date}</TD>
                <TD>{r.id}</TD>
                <TD>{r.type}</TD>
                <TD>{r.fill}</TD>
                <TD><StatusPill status={r.status} /></TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </TableContainer>
    </div>
  );
}
