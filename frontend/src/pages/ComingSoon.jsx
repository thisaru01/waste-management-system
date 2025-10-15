export default function ComingSoon({ title = 'Coming Soon' }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">This section is under construction. Features will be available here soon.</p>
    </div>
  );
}
