import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';

function SlideOver({ open, onClose, children }) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full overflow-auto">{children}</div>
      </aside>
    </div>
  );
}

export default function Report() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [metrics, setMetrics] = useState({ wasteVolume: true, missedCollection: false, binFill: false, routeEfficiency: false });
  const [zone, setZone] = useState('all');

  function toggleMetric(key) {
    setMetrics((m) => ({ ...m, [key]: !m[key] }));
  }

  function generateReport() {
    // For now, just show a simple alert with the selected options (placeholder)
    const selectedMetrics = Object.keys(metrics).filter((k) => metrics[k]);
    alert(`Generate ${reportType} report\nFrom: ${fromDate} To: ${toDate}\nMetrics: ${selectedMetrics.join(', ')}\nZone: ${zone}`);
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export reports" actions={<Button onClick={() => setOpen(true)}>Filters</Button>} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <Card>
            <CardHeader title="Report Builder" subtitle="Choose parameters and generate reports" />
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="md:flex-1">
                  <label className="block text-sm font-medium text-gray-700">Report Type</label>
                  <div className="mt-1 flex gap-2">
                    <button className={`rounded-md px-3 py-2 ${reportType === 'daily' ? 'bg-blue-600 text-white' : 'border'}`} onClick={() => setReportType('daily')}>Daily</button>
                    <button className={`rounded-md px-3 py-2 ${reportType === 'monthly' ? 'bg-blue-600 text-white' : 'border'}`} onClick={() => setReportType('monthly')}>Monthly</button>
                  </div>
                </div>

                <div className="w-40">
                  <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="w-40">
                  <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>

                <div className="w-48">
                  <Select label="Zone" value={zone} onChange={(e) => setZone(e.target.value)}>
                    <option value="all">All Zones</option>
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={generateReport}>Generate report</Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.wasteVolume} onChange={() => toggleMetric('wasteVolume')} />
                  <span className="text-sm">Waste Volume</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.missedCollection} onChange={() => toggleMetric('missedCollection')} />
                  <span className="text-sm">Missed Collection</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.binFill} onChange={() => toggleMetric('binFill')} />
                  <span className="text-sm">Bin Fill Frequency</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.routeEfficiency} onChange={() => toggleMetric('routeEfficiency')} />
                  <span className="text-sm">Route Efficiency</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SlideOver open={open} onClose={() => setOpen(false)}>
        <h3 className="text-lg font-medium">Filters</h3>
        <div className="mt-4 space-y-4">
          <Select label="Zone" value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="all">All Zones</option>
            <option value="north">North</option>
            <option value="south">South</option>
            <option value="east">East</option>
            <option value="west">West</option>
          </Select>

          <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

          <div className="mt-2">
            <div className="text-sm font-medium text-gray-700">Metrics</div>
            <div className="mt-2 space-y-2">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={metrics.wasteVolume} onChange={() => toggleMetric('wasteVolume')} />
                <span className="text-sm">Waste Volume</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={metrics.missedCollection} onChange={() => toggleMetric('missedCollection')} />
                <span className="text-sm">Missed Collection</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={metrics.binFill} onChange={() => toggleMetric('binFill')} />
                <span className="text-sm">Bin Fill Frequency</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={metrics.routeEfficiency} onChange={() => toggleMetric('routeEfficiency')} />
                <span className="text-sm">Route Efficiency</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
