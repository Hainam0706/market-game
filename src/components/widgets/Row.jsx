export default function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="opacity-80 text-sm">{label}</div>
      <div className="text-right">{children}</div>
    </div>
  );
}
