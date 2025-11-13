export default function Panel({ title, onClose, children }) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <div className="panel-title">{title}</div>
        {onClose && (
          <button className="btn-outline" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
