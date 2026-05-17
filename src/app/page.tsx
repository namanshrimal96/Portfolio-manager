import { supabase } from "@/lib/supabase";
import { CurrencyBalance, Currency, Voucher } from "@/lib/types";
import ExpiryTimeline from "@/components/ExpiryTimeline";
import BalanceUpdateForm from "@/components/BalanceUpdateForm";

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

  const currencyMap: Record<string, Currency> = {};
  for (const c of (currencies ?? []) as Currency[]) {
    currencyMap[c.currency_code] = c;
  }

  const totalValue = (balances ?? []).reduce((sum: number, b: CurrencyBalance) => {
    const c = currencyMap[b.currency_code];
    return sum + b.balance * (c?.floor_value_per_point ?? 0);
  }, 0);

  const expiringVouchers = (vouchers ?? []).filter(
    (v: Voucher) => v.expiry_date && daysUntil(v.expiry_date) <= 60
  );

  const activeCurrencies = (balances ?? []).filter((b: CurrencyBalance) => b.balance > 0).length;

  const sortedBalances = [...(balances ?? [])].sort((a: CurrencyBalance, b: CurrencyBalance) => {
    const aVal = a.balance * (currencyMap[a.currency_code]?.floor_value_per_point ?? 0);
    const bVal = b.balance * (currencyMap[b.currency_code]?.floor_value_per_point ?? 0);
    return bVal - aVal;
  });

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Portfolio Overview</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            Floor valuation · {dateStr}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-ink">{fmt(totalValue)}</p>
          <p className="text-xs text-ink-3 mt-0.5">
            {activeCurrencies} active currencies · {(cards ?? []).length} cards
          </p>
        </div>
      </div>

      {expiringVouchers.length > 0 && (
        <div className="bg-[#FFF8EC] border border-[#F0D9A0] rounded-xl px-4 py-3 text-sm text-[#92600A] flex items-center gap-2">
          <span>⚠</span>
          <span>
            {expiringVouchers.length} voucher{expiringVouchers.length > 1 ? "s" : ""} expiring
            within 60 days — check the Vouchers tab.
          </span>
        </div>
      )}

      <ExpiryTimeline balances={(balances ?? []) as CurrencyBalance[]} />

      <div className="bg-white rounded-2xl border border-warm-border overflow-hidden">
        <div className="px-5 py-4 border-b border-warm-border">
          <h2 className="text-sm font-semibold text-ink">Currency Balances</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-medium text-ink-3 uppercase tracking-wide border-b border-warm-border">
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
                <td colSpan={5} className="px-5 py-10 text-center text-ink-3 text-sm">
                  No balances recorded yet. Add your first snapshot in Supabase.
                </td>
              </tr>
            ) : (
              sortedBalances.map((b: CurrencyBalance) => {
                const floorVal = b.balance * (currencyMap[b.currency_code]?.floor_value_per_point ?? 0);
                const expiry = b.oldest_tranche_expiry;
                const expDays = expiry ? daysUntil(expiry) : null;
                return (
                  <tr
                    key={b.balance_id}
                    className="border-b border-warm-border last:border-0 hover:bg-cream transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{b.currency_code}</p>
                      <p className="text-[11px] text-ink-3">{currencyMap[b.currency_code]?.program}</p>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-ink-2">{b.holder_id}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-ink">
                      {b.balance.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-ink">{fmt(floorVal)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {expiry ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            expDays! <= 90
                              ? "bg-red-50 text-red-700"
                              : expDays! <= 180
                              ? "bg-[#FFF8EC] text-[#92600A]"
                              : "bg-cream text-ink-2"
                          }`}
                        >
                          {expiry}
                        </span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <BalanceUpdateForm
        currencies={sortedBalances.map((b: CurrencyBalance) => ({
          currency_code: b.currency_code,
          display_name: currencyMap[b.currency_code]?.display_name ?? b.currency_code,
          holder_id: b.holder_id,
        }))}
      />
    </div>
  );
}
