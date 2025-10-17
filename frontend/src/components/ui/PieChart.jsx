import React from 'react';

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy}`;
}

export default function PieChart({ data = [], size = 160, innerRadius = 40 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  return (
    <div className="flex items-start gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {data.map((d, i) => {
          const start = angle;
          const sliceAngle = (d.value / total) * 360;
          const end = angle + sliceAngle;
          const path = describeArc(cx, cy, r, start, end);
          angle += sliceAngle;
          return <path key={i} d={path} fill={d.color} stroke="white" strokeWidth="1" />;
        })}
        {/* inner circle to create donut */}
        <circle cx={cx} cy={cy} r={innerRadius} fill="#fff" />
      </svg>

      <div className="flex flex-col text-sm">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3" style={{ background: d.color }} />
            <span className="text-gray-700">{d.label}</span>
            <span className="ml-2 text-gray-500">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
