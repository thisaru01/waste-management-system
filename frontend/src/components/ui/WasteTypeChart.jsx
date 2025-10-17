// WasteTypeChart.jsx

export default function WasteTypeChart({ data = null }) {
    // data: array of { type: 'Organic'|'Recyclable'|'Hazardous', kg: number }
    const sample = data || [
        { type: 'Organic', kg: 980 },
        { type: 'Recyclable', kg: 780 },
        { type: 'Hazardous', kg: 120 },
        { type: 'Other', kg: 200 },
    ];
    
    // Calculate total for percentage in the legend
    const total = sample.reduce((s, i) => s + i.kg, 0);

    const colors = {
        Organic: '#16a34a', // Green
        Recyclable: '#0ea5e9', // Blue
        Hazardous: '#ef4444', // Red
        Other: '#a3a3a3', // Gray
    };

    // --- Bar Chart Logic ---
    // increased width/height and left padding to make the chart longer and centered
    const chartWidth = 700; // Total SVG width (increased)
    const chartHeight = 260; // Total SVG height (increased)
    // Padding: left for Y-axis labels, right for value labels/space, bottom for X-axis labels
    const padding = { top: 20, right: 40, bottom: 40, left: 140 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Max value for the x-axis, with a small buffer for spacing the label outside the bar
    const maxKg = Math.max(...sample.map(s => s.kg)) * 1.1;

    // Scale function for x-axis: maps kg value to pixel position
    const xScale = (kg) => (kg / maxKg) * innerWidth + padding.left;

    // Bar dimensions
    const barSpacing = 10; // Vertical space between bars
    const barCount = sample.length;
    // Calculate bar height: total vertical space minus total spacing, divided by number of bars
    const totalVerticalSpacing = barSpacing * (barCount + 1);
    const barHeight = (innerHeight - totalVerticalSpacing) / barCount;

    const bars = sample.map((s, index) => {
        const y = padding.top + barSpacing + index * (barHeight + barSpacing);
        const x = padding.left;
        const width = xScale(s.kg) - padding.left;
        const height = barHeight;
        return { 
            ...s, 
            x, 
            y, 
            width, 
            height, 
            percent: ((s.kg / total) * 100).toFixed(1)
        };
    });

    // X-axis Ticks for visual context
    const xTicks = [0, maxKg * 0.25, maxKg * 0.5, maxKg * 0.75, maxKg];
    const xTickPositions = xTicks.map(xScale);
    // --- End Bar Chart Logic ---

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Today's Waste Composition</h3>
            
            <div className="flex flex-col gap-4 items-center">
                <svg className="mx-auto max-w-full" width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    
                    {/* X-axis Line (Base) */}
                    <line 
                        x1={padding.left} 
                        y1={chartHeight - padding.bottom} 
                        x2={chartWidth - padding.right} 
                        y2={chartHeight - padding.bottom} 
                        stroke="#e5e7eb" 
                        strokeWidth="1" 
                    />

                    {/* X-axis Ticks (Grid lines for context) */}
                    {xTicks.slice(1, -1).map((tick, index) => (
                        <line 
                            key={index} 
                            x1={xTickPositions[index+1]} 
                            y1={padding.top} 
                            x2={xTickPositions[index+1]} 
                            y2={chartHeight - padding.bottom} 
                            stroke="#f3f4f6" 
                            strokeWidth="1" 
                            strokeDasharray="2,2"
                        />
                    ))}
                    
                    {/* Bars */}
                    <g>
                        {bars.map((b) => (
                            <rect 
                                key={b.type}
                                x={b.x}
                                y={b.y}
                                width={b.width}
                                height={b.height}
                                fill={colors[b.type] || colors.Other}
                                rx="2" // Rounded corners
                            />
                        ))}
                    </g>

                    {/* Y-axis Labels (Waste Type) and Bar Value Labels (kg) */}
                    <g>
                        {bars.map((b) => (
                            <g key={b.type}>
                                {/* Y-axis label (Waste Type) */}
                                <text 
                                    x={padding.left - 10} 
                                    y={b.y + b.height / 2 + 4} // Center vertically
                                    fontSize="12" 
                                    textAnchor="end" 
                                    fill="#333"
                                    fontWeight="500"
                                >
                                    {b.type}
                                </text>
                                
                                {/* Bar value label (kg) - placed outside the bar end */}
                                <text 
                                    x={b.x + b.width + 5} 
                                    y={b.y + b.height / 2 + 4} // Center vertically
                                    fontSize="12" 
                                    textAnchor="start" 
                                    fill="#333"
                                >
                                    {b.kg} kg
                                </text>
                            </g>
                        ))}
                    </g>

                    {/* X-axis Labels (Min and Max kg) */}
                    <text x={padding.left} y={chartHeight - padding.bottom + 18} fontSize="10" textAnchor="start" fill="#555">
                        0 kg
                    </text>
                    <text x={chartWidth - padding.right} y={chartHeight - padding.bottom + 18} fontSize="10" textAnchor="end" fill="#555">
                        {Math.round(maxKg / 10) * 10} kg 
                    </text>
                    
                </svg>

                {/* Legend (Kept, now shows both kg and percentage) */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100"> 
                    {sample.map((s) => (
                        <div key={s.type} className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colors[s.type] || colors.Other }} />
                            <div>
                                <div className="text-sm font-semibold text-gray-800">{s.type}</div>
                                <div className="text-xs text-gray-500">{s.kg} kg ({((s.kg / total) * 100).toFixed(1)}%)</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}