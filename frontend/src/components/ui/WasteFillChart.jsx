// WasteFillChart.jsx

export default function WasteFillChart({ data = null }) {
  // Use a higher fill percentage in sample data to demonstrate the bars
  const sample = data || [
    { bin: 'BIN-102 (Organic)', fill: 92, color: 'bg-red-500' }, // High fill needs attention
    { bin: 'BIN-017 (Recycling)', fill: 78, color: 'bg-yellow-500' },
    { bin: 'BIN-221 (General)', fill: 45, color: 'bg-green-500' },
    { bin: 'BIN-040 (General)', fill: 65, color: 'bg-yellow-500' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Bin Fill Analysis</h3>
      <div className="space-y-4">
        {sample.map((s) => (
          <div key={s.bin}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="font-medium text-gray-800">{s.bin}</div>
              <div className="font-bold text-gray-900">{s.fill}%</div>
            </div>
            {/* Visual Bar Chart Representation */}
            <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${s.color}`} 
                    style={{ width: `${s.fill}%` }}
                ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}