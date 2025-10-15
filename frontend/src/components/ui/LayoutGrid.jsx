export default function LayoutGrid({ left, right, rightAside = null, className = '' }) {
  return (
    <div className={`grid grid-cols-1 xl:grid-cols-12 gap-6 ${className}`}>
      <div className="xl:col-span-8 space-y-6">{left}</div>
      <div className="xl:col-span-4 space-y-6">{right || rightAside}</div>
    </div>
  );
}
