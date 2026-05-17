import { supabase } from "@/lib/supabase";
import { CurrencyBalance, Currency, Voucher } from "@/lib/types";
import StatCard from "@/components/StatCard";
import ExpiryTimeline from "@/components/ExpiryTimeline";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export const revalidate = 60;

export default async function DashboardPage() {
  const [{ data: balances }, { data: currencies }, { data: vouchers }, { data: cards }] =
    await Promise.all([
      supabase.from("current_balances").select("*"),
      supabase.from("currencies").select("*"),
      supabase.from("vouchers").select("*").eq("redeemed", false),
      supabase.from("cards").select("*").eq("active", true),
    ]);

  const currencyMap = Object.fromEntries(
    (currencies ?? []).map((c: Currency) => [c.currency_code, c] as [string, Currency])
  );

  const totalValue = (balances ?? []).reduce((sum: number, b: CurrencyBalance) => {
    const c = currencyMap[b.currency_code];
    return sum + b.balance * (c?.floor_value_per_point ?? 0);
  }, 0);

  const expiringVouchers = (vouchers ?? []).filter(
    (v: Voucher) => v.expiry_date && daysUntil(v.expiry_date) <= 60
  );

  const sortedBalances = [...(balances ?? [])].sort((a: CurrencyBalance, b: CurrencyBalance) => {
    const aVal = a.balance * (currencyMap[a.currency_code]?.floor_value_per_point ?? 0);
    const bVal = b.balance * (currencyMap[b.currency_code]?.floor_value_per_point ?? 0);
    return bVal - aVal;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conservative floor values · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Portfolio Value" value={fmt(totalValue)} sub="floor valuation" />
        <StatCard label="Active Currencies" value={String((balances ?? []).filter((b: CurrencyBalance) => b.balance > 0).length)} />
        <StatCard label="Active Cards" value={String((cards ?? []).length)} />
        <StatCard
          label="Vouchers Expiring <60d"
          value={String(expiringVouchers.length)}
          accent={expiringVouchers.length > 0 ? "danger" : "default"}
          sub={expiringVouchers.length > 0 ? "action required" : "all clear"}
        />
      </div>

      <ExpiryTimeline balances={balances ?? []} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Currency Balances</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left px-5 py-3">Currency</th>
              <th className="text-left px-5 py-3">Holder</th>
              <th className="text-right px-5 py-3">Balance</th>
              <th className="text-right px-5 py-3">Floor Value</th>
              <th className="text-right px-5 py-3">Oldest Expiry</th>
            </tr>
          </thead>
          <tbody>
            {sortedBalances.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                  No balances recorded yet. Add your first snapshot below.
                </td>
              </tr>
            ) : (
              sortedBalances.map((b: CurrencyBalance) => {
                const floorVal = b.balance * (currencyMap[b.currency_code]?.floor_value_per_point ?? 0);
                const expiry = b.oldest_tranche_expiry;
                const expDays = expiry ? daysUntil(expiry) : null;
                return (
                  <tr key={b.balance_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{b.currency_code}</p>
                      <p className="text-xs text-gray-400">{currencyMap[b.currency_code]?.program}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-600">{b.holder_id}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900">
                      {b.balance.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{fmt(floorVal)}</td>
                    <td className="px-5 py-3 text-right">
                      {expiry ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          expDays! <= 90 ? "bg-red-100 text-red-700" :
                          expDays! <= 180 ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {expiry}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
