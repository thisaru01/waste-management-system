// WasteFillChart.jsx

// Helper function to determine the color class based on the fill percentage
const getFillColor = (fill) => {
  if (fill >= 80) {
    return 'bg-red-500'; // High fill, needs attention
  } else if (fill >= 60) {
    return 'bg-yellow-500'; // Medium fill, nearing capacity
  } else {
    return 'bg-green-500'; // Low fill, operating normally
  }
};

export default function WasteFillChart({ data = null }) {
  // --- UPDATED SAMPLE DATA TO USE LOCATION ZONES ---
  const sampleData = data || [
    { bin: 'North Zone', fill: 92 },   // High fill in North
    { bin: 'East Zone', fill: 78 },    // Medium-high fill in East
    { bin: 'West Zone', fill: 45 },    // Low fill in West
    { bin: 'South Zone', fill: 65 },   // Medium fill in South
    { bin: 'Central Zone', fill: 20 }, // Very low fill in Central
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🗺️ Zone Bin Fill Analysis
      </h3>
      
      <div className="space-y-6">
        {sampleData.map((s) => {
          const fillColorClass = getFillColor(s.fill);

          return (
            <div 
              key={s.bin} 
              className="mx-auto max-w-4xl p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors duration-200 cursor-default"
            >
              
              {/* Bin Info and Percentage */}
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="font-semibold text-gray-700 text-base">{s.bin}</div>
                <div className={`font-extrabold text-lg ${fillColorClass.replace('bg', 'text')}`}>
                  {s.fill}%
                </div>
              </div>
              
              {/* Visual Bar Chart Representation */}
              <div 
                className="h-3 w-full rounded-full bg-zinc-200"
                role="progressbar"
                aria-valuenow={s.fill}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${s.bin} fill level`}
              >
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${fillColorClass}`} 
                  style={{ width: `${s.fill}%` }}
                ></div>
              </div>

            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-xs text-center text-gray-500">
        Fill levels above **80%** are highlighted in red, indicating immediate collection is required in that zone.
      </div>
    </div>
  );
}