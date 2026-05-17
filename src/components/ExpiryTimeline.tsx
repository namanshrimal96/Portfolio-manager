import { CurrencyBalance } from "@/lib/types";

interface Props {
  balances: CurrencyBalance[];
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ExpiryTimeline({ balances }: Props) {
  const withExpiry = balances.filter((b) => b.oldest_tranche_expiry && b.balance > 0);

  const buckets = [
    { label: "< 90 days", color: "bg-red-500", items: withExpiry.filter((b) => daysUntil(b.oldest_tranche_expiry!) <= 90) },
    { label: "< 180 days", color: "bg-amber-400", items: withExpiry.filter((b) => { const d = daysUntil(b.oldest_tranche_expiry!); return d > 90 && d <= 180; }) },
    { label: "< 365 days", color: "bg-yellow-300", items: withExpiry.filter((b) => { const d = daysUntil(b.oldest_tranche_expiry!); return d > 180 && d <= 365; }) },
    { label: "> 365 days", color: "bg-green-400", items: withExpiry.filter((b) => daysUntil(b.oldest_tranche_expiry!) > 365) },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Expiry Timeline</h2>
      <div className="grid grid-cols-4 gap-3">
        {buckets.map((b) => (
          <div key={b.label} className="space-y-2">
            <div className={`h-2 rounded-full ${b.color}`} />
            <p className="text-xs font-medium text-gray-600">{b.label}</p>
            {b.items.length === 0 ? (
              <p className="text-xs text-gray-400">—</p>
            ) : (
              b.items.map((i) => (
                <div key={i.balance_id} className="text-xs text-gray-700">
                  <p className="font-medium">{i.currency_code}</p>
                  <p className="text-gray-500">{i.holder_id} · {i.oldest_tranche_expiry}</p>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      {withExpiry.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No expiry dates recorded yet. Update balances to track.</p>
      )}
    </div>
  );
}
