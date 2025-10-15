export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`mb-6 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {title && <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>}
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
