// WasteTypeChart.jsx

export default function WasteTypeChart({ data = null }) {
  // data: array of { type: 'Organic'|'Recyclable'|'Hazardous', kg: number }
  const sample = data || [
    { type: 'Organic', kg: 980 },
    { type: 'Recyclable', kg: 780 },
    { type: 'Hazardous', kg: 120 },
    { type: 'Other', kg: 200 },
  ];
  const total = sample.reduce((s, i) => s + i.kg, 0);

  // compute cumulative positions for stacked bar
  let x = 0;
  const bars = sample.map((s) => {
    const w = (s.kg / total) * 100;
    const item = { ...s, x, w };
    x += w;
    return item;
  });

  const colors = {
    Organic: '#16a34a', // Green
    Recyclable: '#0ea5e9', // Blue
    Hazardous: '#ef4444', // Red
    Other: '#a3a3a3', // Gray
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Waste Composition</h3>
      <div className="mt-3">
        {/* Total Weight Display */}
        <div className="mb-4 text-center">
            <span className="text-4xl font-bold text-gray-900">{total.toLocaleString()}</span>
            <span className="text-xl font-medium text-gray-600 ml-1">kg Total</span>
        </div>

        {/* Stacked Bar (Visual Chart) */}
        <div className="h-8 w-full rounded-lg overflow-hidden bg-gray-100 shadow-inner">
          <div className="relative h-full">
            {bars.map((b) => (
              <div
                key={b.type}
                title={`${b.type}: ${b.kg} kg`}
                style={{ left: `${b.x}%`, width: `${b.w}%`, background: colors[b.type] || colors.Other }}
                className="absolute top-0 h-full transition-all duration-500"
              />
            ))}
          </div>
        </div>

        {/* Legend and Details */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sample.map((s) => (
            <div key={s.type} className="flex items-start gap-2">
              <span className="inline-block h-3 w-3 mt-1 flex-shrink-0 rounded-sm" style={{ background: colors[s.type] || colors.Other }} />
              <div className="text-sm">
                <div className="font-semibold text-gray-800">{s.type}</div>
                <div className="text-xs text-gray-500">{s.kg} kg <span className="font-bold">({((s.kg / total) * 100).toFixed(0)}%)</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}