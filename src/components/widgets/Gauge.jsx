export default function Gauge({ value }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamped = clamp(value, 0, 2);
  const pct = (clamped / 2) * 100;
  const danger = value >= 1.2;
  return (
    <div
      className={`w-40 h-3 rounded bg-slate-700 overflow-hidden ${
        danger ? "ring-1 ring-rose-500" : ""
      }`}
    >
      <div
        className={`h-full ${danger ? "bg-rose-500" : "bg-emerald-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
