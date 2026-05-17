import { supabase } from "@/lib/supabase";
import { Card, EarnRate, Milestone } from "@/lib/types";
import MilestoneBar from "@/components/MilestoneBar";

export const revalidate = 60;

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function CardsPage() {
  const [{ data: cards }, { data: earnRates }, { data: milestones }, { data: spendLogs }] =
    await Promise.all([
      supabase.from("cards").select("*").eq("active", true).order("holder_id"),
      supabase.from("earn_rates").select("*"),
      supabase.from("milestones").select("*"),
      supabase.from("spend_log").select("card_id, amount_inr, txn_date"),
    ]);

  const ratesMap: Record<string, EarnRate[]> = {};
  for (const r of (earnRates ?? []) as EarnRate[]) {
    (ratesMap[r.card_id] ??= []).push(r);
  }

  const milestonesMap: Record<string, Milestone[]> = {};
  for (const m of (milestones ?? []) as Milestone[]) {
    (milestonesMap[m.card_id] ??= []).push(m);
  }

  const spendByCard: Record<string, number> = {};
  const cardMap: Record<string, Card> = {};
  for (const c of (cards ?? []) as Card[]) {
    cardMap[c.card_id] = c;
  }
  for (const s of spendLogs ?? []) {
    const card = cardMap[s.card_id];
    const since = card?.anniversary_date ?? `${new Date().getFullYear()}-01-01`;
    if (s.txn_date >= since) {
      spendByCard[s.card_id] = (spendByCard[s.card_id] ?? 0) + s.amount_inr;
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cards</h1>
        <p className="text-sm text-ink-3 mt-0.5">Card-year spend, milestones, and fee waivers</p>
      </div>

      {(cards ?? []).length === 0 && (
        <p className="text-ink-3 text-sm">No cards found. Check your Supabase connection.</p>
      )}

      {(cards ?? []).map((card: Card) => {
        const spend = spendByCard[card.card_id] ?? 0;
        const rates = ratesMap[card.card_id] ?? [];
        const cms = milestonesMap[card.card_id] ?? [];
        const staleRates = rates.filter((r) => daysSince(r.last_verified) > 90);

        return (
          <div key={card.card_id} className="bg-white rounded-2xl border border-warm-border p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">{card.display_name}</h2>
                <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                  <span className="text-xs capitalize text-ink-2">{card.holder_id}</span>
                  <span className="text-ink-3 text-xs">·</span>
                  <span className="text-xs text-ink-2">{card.issuer} {card.network}</span>
                  {card.annual_fee_inr && (
                    <>
                      <span className="text-ink-3 text-xs">·</span>
                      <span className="text-xs text-ink-2">₹{card.annual_fee_inr.toLocaleString("en-IN")}/yr</span>
                    </>
                  )}
                  {card.ltf && (
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium">
                      LTF
                    </span>
                  )}
                </div>
              </div>
              {staleRates.length > 0 && (
                <span className="text-xs bg-[#FFF8EC] text-[#92600A] border border-[#F0D9A0] px-2.5 py-1 rounded-lg whitespace-nowrap">
                  ⚠ {staleRates.length} rate{staleRates.length > 1 ? "s" : ""} unverified &gt;90d
                </span>
              )}
            </div>

            <div className="space-y-3">
              {card.fee_waiver_spend_inr && !card.ltf && (
                <MilestoneBar
                  label="Annual Fee Waiver"
                  current={spend}
                  target={card.fee_waiver_spend_inr}
                  achieved={spend >= card.fee_waiver_spend_inr}
                />
              )}
              {cms.map((m) => (
                <MilestoneBar
                  key={m.milestone_id}
                  label={m.benefit_description}
                  current={spend}
                  target={m.threshold_inr}
                  achieved={m.achieved}
                />
              ))}
              {cms.length === 0 && !card.fee_waiver_spend_inr && (
                <p className="text-xs text-ink-3">No milestones configured for this card.</p>
              )}
            </div>

            <div className="pt-4 border-t border-warm-border">
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-2">
                Earn Rates
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rates.slice(0, 8).map((r) => (
                  <span
                    key={r.rate_id}
                    className={`text-xs px-2 py-1 rounded-lg ${
                      r.excluded
                        ? "bg-warm-border text-ink-3 line-through"
                        : "bg-brand-light text-brand"
                    }`}
                  >
                    {r.category.replace(/_/g, " ")}:{" "}
                    {r.excluded ? "0" : `${r.points_per_100_inr}/₹100`} {r.currency_code}
                  </span>
                ))}
                {rates.length > 8 && (
                  <span className="text-xs text-ink-3 py-1">+{rates.length - 8} more</span>
                )}
              </div>
            </div>

            <div className="flex gap-5 text-xs text-ink-3">
              <span>Anniversary: {card.anniversary_date ?? "Not set"}</span>
              <span>Card-year spend: ₹{spend.toLocaleString("en-IN")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
