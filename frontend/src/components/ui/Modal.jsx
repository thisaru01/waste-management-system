export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="p-5">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3 border-t bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
