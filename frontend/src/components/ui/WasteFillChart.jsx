export default function WasteFillChart({ data = null }) {
  const sample = data || [
    { bin: 'BIN-102', fill: 48 },
    { bin: 'BIN-017', fill: 35 },
    { bin: 'BIN-221', fill: 32 },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-medium text-gray-900">Bin Fill Analysis</h3>
      <div className="mt-3 space-y-2">
        {sample.map((s) => (
          <div key={s.bin} className="flex items-center justify-between">
            <div className="font-medium text-gray-800">{s.bin}</div>
            <div className="text-sm text-gray-600">{s.fill}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
