import React from 'react';

// Simple SVG line chart for two series: 'kg' and 'hours'
export default function KgVsHoursChart({ data = null, height = 220 }) {
    // data: [{ hour: '00:00', kg: 120, hours: 8 }, ...]
    const sample = data || [
        { hour: '00:00', kg: 50, hours: 2 },
        { hour: '02:00', kg: 80, hours: 3 },
        { hour: '04:00', kg: 120, hours: 5 },
        { hour: '06:00', kg: 260, hours: 8 },
        { hour: '08:00', kg: 400, hours: 10 },
        { hour: '10:00', kg: 480, hours: 12 },
        { hour: '12:00', kg: 540, hours: 13 },
        { hour: '14:00', kg: 600, hours: 14 },
        { hour: '16:00', kg: 700, hours: 15 },
        { hour: '18:00', kg: 680, hours: 14 },
        { hour: '20:00', kg: 520, hours: 11 },
        { hour: '22:00', kg: 300, hours: 7 },
    ];

    const padding = 30;
    const w = 900;
    const h = height;
    const innerW = w - padding * 2;
    const innerH = h - padding * 2;

    // Use 'kg' instead of 'trucked'
    const maxKg = Math.max(...sample.map((d) => d.kg));
    const maxHours = Math.max(...sample.map((d) => d.hours));

    // Calculate points for 'kg'
    const pointsKg = sample.map((d, i) => {
        const x = padding + (i / (sample.length - 1)) * innerW;
        const y = padding + innerH - (d.kg / maxKg) * innerH;
        return `${x},${y}`;
    }).join(' ');

    // Calculate points for 'hours' (remains the same)
    const pointsHours = sample.map((d, i) => {
        const x = padding + (i / (sample.length - 1)) * innerW;
        const y = padding + innerH - (d.hours / maxHours) * innerH;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg lg:col-span-full">
            {/* Updated chart title */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cumulative Kilograms (kg) vs Operating Hours by Time</h2>
            <div className="overflow-auto">
                <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
                    {/* grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <line key={t} x1={padding} x2={w - padding} y1={padding + t * innerH} y2={padding + t * innerH} stroke="#eee" />
                    ))}

                    {/* kg polyline (formerly trucked) */}
                    <polyline fill="none" stroke="#0ea5e9" strokeWidth={2} points={pointsKg} />
                    {/* hours polyline (remains the same color/style) */}
                    <polyline fill="none" stroke="#16a34a" strokeWidth={2} points={pointsHours} />

                    {/* points labels (hours) */}
                    {sample.map((d, i) => {
                        const x = padding + (i / (sample.length - 1)) * innerW;
                        const y = h - 8;
                        return <text key={d.hour} x={x} y={y} fontSize="10" textAnchor="middle" fill="#666">{d.hour}</text>;
                    })}
                </svg>
            </div>
            {/* Updated legend */}
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-sky-500 rounded-sm"/> Kilograms (kg)</div>
                <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-green-500 rounded-sm"/> Hours</div>
            </div>
        </div>
    );
}