import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';



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

// NOTE: This assumes you have components like PageHeader, Card, CardHeader, CardContent, Input, Select, and Button defined elsewhere.
// State variables like reportType, setReportType, fromDate, setFromDate, toDate, setToDate, zone, setZone, metrics, toggleMetric, and the generateReport function must be defined in the parent component.

return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* The image doesn't show the PageHeader, but we keep it for structure. */}
      <PageHeader title="Generate Reports" subtitle="Choose parameters and generate reports" />

      {/* Main content area, simplified from the original grid for a single card layout */}
      <div className="flex justify-center">
        {/* The Card container mimics the white box in the image */}
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader title="Report Builder" subtitle="Select options to generate your report" />
          <CardContent>
            {/* 1. Report Type - Matches the top-most dropdown in the image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              {/* Using a Select/Dropdown to match the visual in the image, even though the original code used buttons */}
              <Select 
                label="" // Label is moved outside
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="w-full md:w-auto" // Control width for better look
              >
                 {/* Added options to reflect a typical dropdown */}
                <option value="monthly">Monthly</option> 
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
            
            <hr className="my-6" />

            {/* 2. Date Range - Combines the 'From' and 'To' into a single concept like the image's 'Date Range' */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              {/* For simplicity and to match the image's single dropdown look, we'll use a single Select for the range, but keep the From/To inputs for functionality if needed. */}
              {/* If you wanted a *single* dropdown like the image, you'd use a Select component here. 
                  For now, I'll use the two date inputs since they were in your original logic, 
                  but visually group them under the "Date Range" label. */}
              <div className="flex flex-col gap-4 sm:flex-row">
                 {/* This dropdown is a conceptual placeholder for the image's 'January 2024' field. 
                     If your actual component uses From/To dates, keep the following two divs. */}
                 {/* Keeping the single Select to better match the image's single dropdown style */}
                <Select label="" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full sm:w-60">
                    <option value="2024-01">January 2024</option>
                    <option value="2024-02">February 2024</option>
                    <option value="2024-03">March 2024</option>
                </Select>
                 {/* If you need From/To inputs, uncomment these: */}
                 {/* <div className="w-full sm:w-40">
                   <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                 </div>
                 <div className="w-full sm:w-40">
                   <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                 </div> */}
              </div>
            </div>
            
            <hr className="my-6" />

            {/* 3. Select Metrics - Matches the checkboxes in the image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Metrics</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Waste Volume (Checked in image) */}
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.wasteVolume} onChange={() => toggleMetric('wasteVolume')} className="form-checkbox text-blue-600 rounded" />
                  <span className="text-sm">Waste Volume</span>
                </label>
                
                {/* Missed Collections (Checked in image) - Renamed for clarity */}
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.missedCollection} onChange={() => toggleMetric('missedCollection')} className="form-checkbox text-blue-600 rounded" />
                  <span className="text-sm">Missed Collections</span>
                </label>
                
                {/* Bin Fill Frequency (Checked in image) */}
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.binFill} onChange={() => toggleMetric('binFill')} className="form-checkbox text-blue-600 rounded" />
                  <span className="text-sm">Bin Fill Frequency</span>
                </label>
                
                {/* Route Efficiency (Unchecked in image) */}
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={metrics.routeEfficiency} onChange={() => toggleMetric('routeEfficiency')} className="form-checkbox text-blue-600 rounded" />
                  <span className="text-sm">Route Efficiency</span>
                </label>
              </div>
            </div>
            
            <hr className="my-6" />

            {/* 4. Filters (optional) - Matches the 'Select Zone' dropdown in the image */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filters (optional)</label>
              <Select 
                label="" // Label is moved outside
                value={zone} 
                onChange={(e) => setZone(e.target.value)}
                className="w-full md:w-60" // Control width for better look
              >
                <option value="">Select Zone</option>
                <option value="all">All Zones</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </Select>
            </div>
            
            {/* 5. Generate Report Button - Matches the button's final placement */}
            <div className="pt-4">
              <Button variant="primary" onClick={generateReport} className="w-full sm:w-auto">
                Generate Report
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
);
}
