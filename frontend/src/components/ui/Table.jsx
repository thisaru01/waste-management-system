export function TableContainer({ children }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Table({ children }) {
  return <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>;
}

export function THead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TH({ children }) {
  return <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">{children}</th>;
}

export function TD({ children }) {
  return <td className="px-4 py-2">{children}</td>;
}
