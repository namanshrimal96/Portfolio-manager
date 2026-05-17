import { CurrencyBalance } from "@/lib/types";

interface Props {
  balances: CurrencyBalance[];
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const buckets = [
  { label: "< 90 days", dot: "bg-red-500", filter: (d: number) => d <= 90 },
  { label: "90–180 days", dot: "bg-amber-400", filter: (d: number) => d > 90 && d <= 180 },
  { label: "180–365 days", dot: "bg-brand", filter: (d: number) => d > 180 && d <= 365 },
  { label: "> 365 days", dot: "bg-emerald-400", filter: (d: number) => d > 365 },
];

export default function ExpiryTimeline({ balances }: Props) {
  const withExpiry = balances.filter((b) => b.oldest_tranche_expiry && b.balance > 0);

  if (withExpiry.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-warm-border p-5">
        <h2 className="text-sm font-semibold text-ink mb-2">Expiry Timeline</h2>
        <p className="text-xs text-ink-3">No expiry dates recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-5">
      <h2 className="text-sm font-semibold text-ink mb-4">Expiry Timeline</h2>
      <div className="grid grid-cols-4 gap-4">
        {buckets.map((b) => {
          const items = withExpiry.filter((i) => b.filter(daysUntil(i.oldest_tranche_expiry!)));
          return (
            <div key={b.label} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${b.dot}`} />
                <p className="text-[11px] font-medium text-ink-2">{b.label}</p>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-ink-3">—</p>
              ) : (
                items.map((i) => (
                  <div key={i.balance_id} className="text-xs">
                    <p className="font-medium text-ink">{i.currency_code}</p>
                    <p className="text-ink-3">{i.holder_id} · {i.oldest_tranche_expiry}</p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
