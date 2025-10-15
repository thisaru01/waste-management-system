export function Card({ className = '', children }) {
  return <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle }) {
  return (
    <div className="px-6 pt-6">
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

export function CardContent({ className = '', children }) {
  return <div className={`px-6 pb-6 pt-4 ${className}`}>{children}</div>;
}
