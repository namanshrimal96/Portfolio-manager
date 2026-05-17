interface MilestoneBarProps {
  label: string;
  current: number;
  target: number;
  achieved?: boolean;
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function MilestoneBar({ label, current, target, achieved }: MilestoneBarProps) {
  const pct = Math.min(100, (current / target) * 100);
  const barColor = achieved
    ? "bg-emerald-500"
    : pct >= 80
    ? "bg-amber-500"
    : "bg-brand";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-ink-2">
        <span>{label}</span>
        <span>
          {fmt(current)} / {fmt(target)}
          {achieved && <span className="ml-1 text-emerald-600">✓</span>}
        </span>
      </div>
      <div className="h-1.5 bg-warm-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
