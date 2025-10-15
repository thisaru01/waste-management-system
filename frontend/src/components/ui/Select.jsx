export default function Select({ label, helper, className = '', children, ...props }) {
  return (
    <label className="block">
      {label && (
        <div className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </div>
      )}
      <select
        className={`mt-1 block w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        {...props}
      >
        {children}
      </select>
      {helper && <div className="mt-1 text-xs text-gray-500">{helper}</div>}
    </label>
  );
}
