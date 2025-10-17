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
    Organic: '#16a34a',
    Recyclable: '#0ea5e9',
    Hazardous: '#ef4444',
    Other: '#a3a3a3',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-medium text-gray-900">Today's waste by type</h3>
      <div className="mt-3">
        <div className="h-6 w-full rounded overflow-hidden bg-gray-100">
          <div className="relative h-full">
            {bars.map((b) => (
              <div
                key={b.type}
                title={`${b.type}: ${b.kg} kg`}
                style={{ left: `${b.x}%`, width: `${b.w}%` }}
                className="absolute top-0 h-full"
              >
                <div style={{ background: colors[b.type] || colors.Other, width: '100%', height: '100%' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sample.map((s) => (
            <div key={s.type} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3" style={{ background: colors[s.type] || colors.Other }} />
              <div className="text-sm">
                <div className="font-medium text-gray-800">{s.type}</div>
                <div className="text-xs text-gray-500">{s.kg} kg ({((s.kg / total) * 100).toFixed(0)}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
