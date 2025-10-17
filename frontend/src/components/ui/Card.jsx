export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, className = "" }) {
  return (
    <div className={`px-4 pt-4 sm:px-6 sm:pt-6 ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

export function CardContent({ className = "", children }) {
  return (
    <div className={`px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 ${className}`}>
      {children}
    </div>
  );
}
