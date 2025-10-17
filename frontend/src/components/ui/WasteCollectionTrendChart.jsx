import React from 'react';

export default function WasteCollectionTrendChart({ data = null, height = 260 }) {
  // data: [{ hour: '08:00', trucked: 100, binFilled: 80 }, ...]
  const sample = data || [
    { hour: '08:00', trucked: 420, binFilled: 220 },
    { hour: '09:00', trucked: 480, binFilled: 260 },
    { hour: '10:00', trucked: 540, binFilled: 300 },
    { hour: '11:00', trucked: 600, binFilled: 340 },
    { hour: '12:00', trucked: 500, binFilled: 360 },
    { hour: '13:00', trucked: 300, binFilled: 320 },
    { hour: '14:00', trucked: 340, binFilled: 380 },
    { hour: '15:00', trucked: 230, binFilled: 420 },
    { hour: '16:00', trucked: 760, binFilled: 460 },
    { hour: '17:00', trucked: 820, binFilled: 500 },
  ];

  const padding = 40;
  const w = 900;
  const h = height;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const maxKg = Math.max(...sample.map((d) => Math.max(d.trucked, d.binFilled)));

  const getPoints = (key) => sample.map((d, i) => {
    const x = padding + (i / (sample.length - 1)) * innerW;
    const y = padding + innerH - (d[key] / maxKg) * innerH;
    return `${x},${y}`;
  }).join(' ');

  const truckedPoints = getPoints('trucked');
  const binPoints = getPoints('binFilled');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg lg:col-span-full">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Waste Collection: Trucked vs Bin-filled (kg)</h2>
      <div className="overflow-auto">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
          {/* horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line key={t} x1={padding} x2={w - padding} y1={padding + t * innerH} y2={padding + t * innerH} stroke="#eee" />
          ))}

          {/* polylines */}
          <polyline fill="none" stroke="#2563eb" strokeWidth={2.5} points={truckedPoints} />
          <polyline fill="none" stroke="#f97316" strokeWidth={2.5} points={binPoints} />

          {/* x-axis labels */}
          {sample.map((d, i) => {
            const x = padding + (i / (sample.length - 1)) * innerW;
            const y = h - 10;
            return <text key={d.hour} x={x} y={y} fontSize="10" textAnchor="middle" fill="#666">{d.hour}</text>;
          })}

          {/* y-axis labels (kg) */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const kg = Math.round((1 - t) * maxKg);
            const y = padding + t * innerH;
            return <text key={t} x={8} y={y + 4} fontSize="10" fill="#666">{kg}</text>;
          })}
        </svg>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-blue-600 rounded-sm"/> Trucked Collected</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-orange-500 rounded-sm"/> Bin-filled</div>
      </div>
    </div>
  );
}
