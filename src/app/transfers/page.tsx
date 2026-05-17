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

function Bar({
  used,
  cap,
  label,
  variant = "primary",
}: {
  used: number;
  cap: number;
  label: string;
  variant?: "primary" | "a" | "b";
}) {
  const pct = Math.min(100, cap > 0 ? (used / cap) * 100 : 0);
  const barColor =
    pct >= 90
      ? "bg-red-500"
      : variant === "a"
      ? "bg-brand"
      : variant === "b"
      ? "bg-[#FF8C55]"
      : "bg-ink-2";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-ink-2">
        <span>{label}</span>
        <span>
          {fmt(used)} / {fmt(cap)} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1.5 bg-warm-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} ${pct >= 90 ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function TransfersPage() {
  const currentYear = new Date().getFullYear();
  const [{ data: partners }, { data: usageRows }] = await Promise.all([
    supabase.from("transfer_partners").select("*").eq("active", true),
    supabase.from("ytd_transfer_usage").select("*").eq("year", currentYear),
  ]);

  const usageMap: Record<string, number> = {};
  for (const row of usageRows ?? []) {
    const key = `${row.source_currency}__${row.group_tag ?? "null"}`;
    usageMap[key] = (usageMap[key] ?? 0) + Number(row.total_transferred);
  }

  const byCurrency: Record<string, TransferPartner[]> = {};
  for (const p of (partners ?? []) as TransferPartner[]) {
    (byCurrency[p.source_currency] ??= []).push(p);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Transfer Caps</h1>
        <p className="text-sm text-ink-3 mt-0.5">
          Calendar year {currentYear} · Resets Jan 1 · {daysUntilJan1()} days until reset
        </p>
      </div>

      {Object.entries(byCurrency).map(([currency, ps]) => {
        const groupA = usageMap[`${currency}__A`] ?? 0;
        const groupB = usageMap[`${currency}__B`] ?? 0;
        const totalUsed = groupA + groupB;
        const partner = ps[0];
        const totalCap = partner.annual_cap_total ?? 0;
        const capA = partner.annual_cap_group_a ?? 0;
        const capB = partner.annual_cap_group_b ?? 0;
        const isStale = ps.some((p) => {
          const days = Math.floor(
            (Date.now() - new Date(p.last_verified).getTime()) / (1000 * 60 * 60 * 24)
          );
          return days > 90;
        });

        return (
          <div key={currency} className="bg-white rounded-2xl border border-warm-border p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink">{currency}</h2>
              <p className="text-xs text-ink-3 mt-1">
                {ps
                  .map(
                    (p) =>
                      `${p.target_currency} (${p.ratio_source}:${p.ratio_target}${p.group_tag ? ` · Group ${p.group_tag}` : ""})`
                  )
                  .join(" · ")}
              </p>
            </div>

            <div className="space-y-3">
              {totalCap > 0 && (
                <Bar used={totalUsed} cap={totalCap} label="Total Cap" variant="primary" />
              )}
              {capA > 0 && <Bar used={groupA} cap={capA} label="Group A" variant="a" />}
              {capB > 0 && <Bar used={groupB} cap={capB} label="Group B" variant="b" />}
            </div>

            <div className="pt-4 border-t border-warm-border">
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-2">
                Partners
              </p>
              <div className="space-y-2">
                {ps.map((p) => (
                  <div key={p.transfer_id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-ink">{p.target_currency}</span>
                    <span className="text-ink-3">→</span>
                    <span className="text-ink-2">
                      {p.ratio_source}:{p.ratio_target}
                    </span>
                    {p.group_tag && (
                      <span className="text-xs bg-cream text-ink-2 border border-warm-border px-1.5 py-0.5 rounded-md">
                        Group {p.group_tag}
                      </span>
                    )}
                    {p.per_transfer_fee_inr && (
                      <span className="text-xs text-ink-3">₹{p.per_transfer_fee_inr}/transfer</span>
                    )}
                    {p.min_transfer_units && (
                      <span className="text-xs text-ink-3">
                        min {p.min_transfer_units.toLocaleString("en-IN")} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isStale && (
              <div className="bg-[#FFF8EC] border border-[#F0D9A0] rounded-xl px-4 py-2.5 text-xs text-[#92600A]">
                ⚠ Partner details unverified &gt;90 days. Confirm ratios and caps before transferring.
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(byCurrency).length === 0 && (
        <div className="bg-white rounded-2xl border border-warm-border p-8 text-center text-ink-3 text-sm">
          No transfer partners found. Check your Supabase connection.
        </div>
      )}
    </div>
  );
}
