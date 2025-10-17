import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx'; 
import Select from '../components/ui/Select.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';

export default function Report() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState('daily');
  // Initialize date states to empty string
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // State to hold only one selected metric
  const [selectedMetric, setSelectedMetric] = useState('wasteVolume'); 
  
  const [zone, setZone] = useState('all');

  // ✨ NEW STATES FOR WASTE VOLUME FILTERS
  const [wasteType, setWasteType] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [displayType, setDisplayType] = useState('chart');

  // ✨ NEW STATES FOR OTHER METRIC-SPECIFIC FILTERS
  // Missed Collections
  const [collector, setCollector] = useState('all');
  const [includeResolved, setIncludeResolved] = useState('unresolved');
  // Bin Fill
  const [thresholdPercent, setThresholdPercent] = useState(80);
  const [binType, setBinType] = useState('all');
  // Route Efficiency
  const [minEfficiency, setMinEfficiency] = useState(80);
  const [route, setRoute] = useState('all');

  // New function to handle report type change and reset date inputs
  function handleReportTypeChange(event) {
    const newReportType = event.target.value;
    setReportType(newReportType);
    // Reset date fields when report type changes
    setFromDate('');
    setToDate('');
  }

  // Function to handle single metric selection (used by radio buttons)
  function handleMetricChange(event) {
    setSelectedMetric(event.target.value);
    // Reset metric-specific filters when metric changes
    setWasteType('');
    setTimeSlot('');
    setDisplayType('chart');
    // reset others
    setCollector('all');
    setIncludeResolved('unresolved');
    setThresholdPercent(80);
    setBinType('all');
    setMinEfficiency(80);
    setRoute('all');
  }

  // 💡 UPDATED: Validation check now includes metric-specific filters
  function generateReport() {
    let validationMessage = '';

    // 1. Validate Date Selection (fromDate is used for all single-date/period inputs)
    if (!fromDate) {
      validationMessage = 'Please select a Date Range (Day, Week, Month, or Year).';
    } 
    // 2. If reportType is 'custom', check both From and To dates
    else if (reportType === 'custom' && (!fromDate || !toDate)) {
      validationMessage = 'Please select both "From" and "To" dates for a Custom Range.';
    }
    
    // 3. Validate Metric Selection (Redundant but kept for robustness)
    if (!selectedMetric) {
      validationMessage += (validationMessage ? '\n' : '') + 'Please select one Metric.';
    }

    // ✨ 4. VALIDATE WASTE VOLUME SPECIFIC FILTERS
    if (selectedMetric === 'wasteVolume') {
      if (!wasteType) {
        validationMessage += (validationMessage ? '\n' : '') + 'Please select a Waste Type.';
      }
      if (!timeSlot) {
        validationMessage += (validationMessage ? '\n' : '') + 'Please select a Time Slot.';
      }
    }

    // ✨ 5. VALIDATE MISSED COLLECTIONS FILTERS
    if (selectedMetric === 'missedCollection') {
      if (!includeResolved) {
        validationMessage += (validationMessage ? '\n' : '') + 'Please choose whether to include resolved missed collections.';
      }
    }

    // ✨ 6. VALIDATE BIN FILL FILTERS
    if (selectedMetric === 'binFill') {
      if (!thresholdPercent || Number(thresholdPercent) <= 0) {
        validationMessage += (validationMessage ? '\n' : '') + 'Please provide a valid threshold percent for Bin Fill.';
      }
    }

    // ✨ 7. VALIDATE ROUTE EFFICIENCY FILTERS
    if (selectedMetric === 'routeEfficiency') {
      if (!minEfficiency || Number(minEfficiency) <= 0) {
        validationMessage += (validationMessage ? '\n' : '') + 'Please provide a valid minimum efficiency percent.';
      }
    }

    // If there is any validation error, show the alert and stop
    if (validationMessage) {
      alert(`Validation Error:\n${validationMessage}`);
      return; // Stop function execution
    }
    
    // If validation passes, proceed with report generation placeholder
    let reportDetails = `Generating ${reportType} report\nFor Metric: ${selectedMetric}\nDate Range: ${fromDate} to ${toDate}\nZone: ${zone}`;
    
    if (selectedMetric === 'wasteVolume') {
      reportDetails += `\nWaste Type: ${wasteType}\nTime Slot: ${timeSlot}\nDisplay: ${displayType}`;
    }

    if (selectedMetric === 'missedCollection') {
      reportDetails += `\nCollector: ${collector}\nInclude Resolved: ${includeResolved}`;
    }

    if (selectedMetric === 'binFill') {
      reportDetails += `\nThreshold: ${thresholdPercent}%\nBin Type: ${binType}`;
    }

    if (selectedMetric === 'routeEfficiency') {
      reportDetails += `\nMin Efficiency: ${minEfficiency}%\nRoute: ${route}`;
    }

    alert(reportDetails);
  }

  // Helper function to render the correct date input component
  const renderDateRangeInput = () => {
    switch (reportType) {
      case 'daily':
        return (
          <Input 
            label="" 
            type="date" 
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)} 
            className="w-full sm:w-60" 
          />
        );
      case 'weekly':
        return (
          <Input 
            label="" 
            type="week" 
            value={fromDate} // Using fromDate to hold the selected week string (e.g., '2024-W05')
            onChange={(e) => setFromDate(e.target.value)} 
            className="w-full sm:w-60"
          />
        );
      case 'monthly':
        return (
          <Input 
            label="" 
            type="month" 
            value={fromDate} // Using fromDate to hold the selected month string (e.g., '2024-01')
            onChange={(e) => setFromDate(e.target.value)} 
            className="w-full sm:w-60"
          />
        );
      case 'yearly':
        const currentYear = new Date().getFullYear();
        const years = Array.from({length: 5}, (_, i) => currentYear - i); // Last 5 years
        return (
          <Select 
            label="" 
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)} 
            className="w-full sm:w-60"
          >
            <option value="">Select Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        );
      default:
        // Custom range
        return (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full sm:w-40">
              <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="w-full sm:w-40">
              <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        );
    }
  };

  // ✨ NEW HELPER FUNCTION FOR METRIC-SPECIFIC FILTERS
  const renderMetricSpecificFilters = () => {
    // Waste Volume filters
    if (selectedMetric === 'wasteVolume') {
      return (
        <>
          <hr className="my-6" />
          <h3 className="text-md font-semibold text-blue-700 mb-4">Waste Volume Specific Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Waste Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type *</label>
              <Select 
                label=""
                value={wasteType} 
                onChange={(e) => setWasteType(e.target.value)}
                className="w-full"
              >
                <option value="">Select Waste Type</option>
                <option value="general">General Waste</option>
                <option value="recyclables">Recyclables</option>
                <option value="organic">Organic Waste</option>
                <option value="hazardous">Hazardous Waste</option>
              </Select>
            </div>

            {/* Time Slot Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot *</label>
              <Select 
                label=""
                value={timeSlot} 
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full"
              >
                <option value="">Select Time Slot</option>
                <option value="morning">Morning (6AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 6PM)</option>
                <option value="evening">Evening (6PM - 12AM)</option>
                <option value="night">Night (12AM - 6AM)</option>
              </Select>
            </div>

            {/* Data Display Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Display</label>
              <Select 
                label=""
                value={displayType} 
                onChange={(e) => setDisplayType(e.target.value)}
                className="w-full"
              >
                <option value="chart">Chart/Graph</option>
                <option value="table">Data Table</option>
              </Select>
            </div>
          </div>
        </>
      );
    }

    // Missed Collections filters
    if (selectedMetric === 'missedCollection') {
      return (
        <>
          <hr className="my-6" />
          <h3 className="text-md font-semibold text-blue-700 mb-4">Missed Collections Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collector</label>
              <Select label="" value={collector} onChange={(e) => setCollector(e.target.value)} className="w-full">
                <option value="all">All Collectors</option>
                <option value="collector-a">Collector A</option>
                <option value="collector-b">Collector B</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Include Resolved</label>
              <Select label="" value={includeResolved} onChange={(e) => setIncludeResolved(e.target.value)} className="w-full">
                <option value="unresolved">Only Unresolved</option>
                <option value="all">Include Resolved</option>
              </Select>
            </div>
          </div>
        </>
      );
    }

    // Bin Fill filters
    if (selectedMetric === 'binFill') {
      return (
        <>
          <hr className="my-6" />
          <h3 className="text-md font-semibold text-blue-700 mb-4">Bin Fill Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Threshold %</label>
              <Input label="" type="number" value={thresholdPercent} onChange={(e) => setThresholdPercent(e.target.value)} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bin Type</label>
              <Select label="" value={binType} onChange={(e) => setBinType(e.target.value)} className="w-full">
                <option value="all">All</option>
                <option value="general">General</option>
                <option value="recycling">Recycling</option>
                <option value="organic">Organic</option>
              </Select>
            </div>
          </div>
        </>
      );
    }

    // Route Efficiency filters
    if (selectedMetric === 'routeEfficiency') {
      return (
        <>
          <hr className="my-6" />
          <h3 className="text-md font-semibold text-blue-700 mb-4">Route Efficiency Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Efficiency %</label>
              <Input label="" type="number" value={minEfficiency} onChange={(e) => setMinEfficiency(e.target.value)} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <Select label="" value={route} onChange={(e) => setRoute(e.target.value)} className="w-full">
                <option value="all">All Routes</option>
                <option value="route-1">Route 1</option>
                <option value="route-2">Route 2</option>
                <option value="route-3">Route 3</option>
              </Select>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Generate Reports" subtitle="Choose parameters and generate reports" />

      <div className="flex justify-center">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader title="Report Builder" subtitle="Select options to generate your report" />
          <CardContent>
            {/* 1. Report Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <Select 
                label=""
                value={reportType} 
                onChange={handleReportTypeChange}
                className="w-full md:w-auto"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </Select>
            </div>
            
            <hr className="my-6" />

            {/* 2. Date Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex flex-col gap-4 sm:flex-row">
                {renderDateRangeInput()}
              </div>
            </div>
            
            <hr className="my-6" />

            {/* 3. Select Metrics: Radio Buttons for single selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Metric</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Waste Volume */}
                <label className="inline-flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="reportMetric" 
                    value="wasteVolume"
                    checked={selectedMetric === 'wasteVolume'} 
                    onChange={handleMetricChange} 
                    className="form-radio text-blue-600" 
                  />
                  <span className="text-sm">Trucked Waste Volume</span>
                </label>
                
                {/* Missed Collections */}
                <label className="inline-flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="reportMetric" 
                    value="missedCollection"
                    checked={selectedMetric === 'missedCollection'} 
                    onChange={handleMetricChange} 
                    className="form-radio text-blue-600" 
                  />
                  <span className="text-sm">Missed Collections</span>
                </label>
                
                {/* Bin Fill Frequency */}
                <label className="inline-flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="reportMetric" 
                    value="binFill"
                    checked={selectedMetric === 'binFill'} 
                    onChange={handleMetricChange} 
                    className="form-radio text-blue-600" 
                  />
                  <span className="text-sm">Bin Fill Frequency</span>
                </label>
                
                {/* Route Efficiency */}
                <label className="inline-flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="reportMetric" 
                    value="routeEfficiency"
                    checked={selectedMetric === 'routeEfficiency'} 
                    onChange={handleMetricChange} 
                    className="form-radio text-blue-600" 
                  />
                  <span className="text-sm">Route Efficiency</span>
                </label>
              </div>
            </div>
            
            {/* ✨ 3.5. METRIC-SPECIFIC FILTERS (Conditionally rendered) */}
            {renderMetricSpecificFilters()}
            
            <hr className="my-6" />

            {/* 4. Zone Filter (optional) */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone Filter (optional)</label>
              <Select 
                label=""
                value={zone} 
                onChange={(e) => setZone(e.target.value)}
                className="w-full md:w-60"
              >
                <option value="all">All Zones</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </Select>
            </div>
            
            {/* 5. Generate Report Button */}
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