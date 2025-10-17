export function TableContainer({ children, className = "", ...props }) {
  return (
    <div className={`overflow-x-auto ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Table({ children, className = "", ...props }) {
  return (
    <table
      className={`min-w-full divide-y divide-gray-200 text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function THead({ children, className = "", ...props }) {
  return (
    <thead className={`bg-gray-50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TBody({ children, className = "", ...props }) {
  return (
    <tbody className={`divide-y divide-gray-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TH({ children, className = "", ...props }) {
  return (
    <th
      scope="col"
      className={`px-4 py-2 text-left font-semibold text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({ children, className = "", ...props }) {
  return (
    <td className={`px-4 py-2 ${className}`} {...props}>
      {children}
    </td>
  );
}
