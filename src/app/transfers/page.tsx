import { supabase } from "@/lib/supabase";
import { TransferPartner } from "@/lib/types";

export const revalidate = 60;

function fmt(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function daysUntilJan1() {
  const now = new Date();
  const nextJan1 = new Date(now.getFullYear() + 1, 0, 1);
  return Math.ceil((nextJan1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function TransfersPage() {
  const currentYear = new Date().getFullYear();
  const [{ data: partners }, { data: usageRows }] = await Promise.all([
    supabase.from("transfer_partners").select("*").eq("active", true),
    supabase.from("ytd_transfer_usage").select("*").eq("year", currentYear),
  ]);

  // Index usage by source_currency + group_tag
  const usageMap: Record<string, number> = {};
  for (const row of usageRows ?? []) {
    const key = `${row.source_currency}__${row.group_tag ?? "null"}`;
    usageMap[key] = (usageMap[key] ?? 0) + Number(row.total_transferred);
  }

  // Group partners by source_currency
  const byCurrency: Record<string, TransferPartner[]> = {};
  for (const p of (partners ?? []) as TransferPartner[]) {
    (byCurrency[p.source_currency] ??= []).push(p);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Caps</h1>
        <p className="text-sm text-gray-500 mt-1">
          Calendar year {currentYear} · Resets Jan 1 · {daysUntilJan1()} days until reset
        </p>
      </div>

      {Object.entries(byCurrency).map(([currency, ps]) => {
        const groupA = usageMap[`${currency}__A`] ?? 0;
        const groupB = usageMap[`${currency}__B`] ?? 0;
        const totalUsed = groupA + groupB;
        const partner = ps[0];
        const totalCap = partner.annual_cap_total;
        const capA = partner.annual_cap_group_a;
        const capB = partner.annual_cap_group_b;

        function Bar({ used, cap, label, color }: { used: number; cap: number; label: string; color: string }) {
          const pct = Math.min(100, cap > 0 ? (used / cap) * 100 : 0);
          return (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{label}</span>
                <span>{fmt(used)} / {fmt(cap)} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} ${pct >= 90 ? "animate-pulse" : ""}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        }

        return (
          <div key={currency} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{currency}</h2>
              <p className="text-xs text-gray-500 mt-1">
                Partners: {ps.map((p) => `${p.target_currency} (${p.ratio_source}:${p.ratio_target}${p.group_tag ? ` · Group ${p.group_tag}` : ""})`).join(" · ")}
              </p>
            </div>

            <div className="space-y-3">
              {totalCap && <Bar used={totalUsed} cap={totalCap} label="Total Cap" color="bg-indigo-500" />}
              {capA && <Bar used={groupA} cap={capA} label="Group A" color="bg-blue-400" />}
              {capB && <Bar used={groupB} cap={capB} label="Group B" color="bg-violet-400" />}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Partners</p>
              <div className="space-y-2">
                {ps.map((p) => (
                  <div key={p.transfer_id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-gray-800">{p.target_currency}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-600">{p.ratio_source}:{p.ratio_target}</span>
                    {p.group_tag && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Group {p.group_tag}</span>}
                    {p.per_transfer_fee_inr && <span className="text-xs text-gray-400">₹{p.per_transfer_fee_inr}/transfer</span>}
                    {p.min_transfer_units && <span className="text-xs text-gray-400">min {p.min_transfer_units.toLocaleString("en-IN")} pts</span>}
                  </div>
                ))}
              </div>
            </div>

            {ps.some((p) => {
              const days = Math.floor((Date.now() - new Date(p.last_verified).getTime()) / (1000 * 60 * 60 * 24));
              return days > 90;
            }) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
                ⚠ Partner details unverified &gt;90 days. Confirm ratios and caps before transferring.
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(byCurrency).length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          No transfer partners found. Check your Supabase connection.
        </div>
      )}
    </div>
  );
}
