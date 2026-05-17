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

  // Card-year spend: sum from anniversary_date to now (approximate with calendar year if no date)
  const spendByCard: Record<string, number> = {};
  const cardMap: Record<string, Card> = Object.fromEntries(
    (cards ?? []).map((c: Card) => [c.card_id, c] as [string, Card])
  );
  for (const s of spendLogs ?? []) {
    const card = cardMap[s.card_id];
    const since = card?.anniversary_date ?? `${new Date().getFullYear()}-01-01`;
    if (s.txn_date >= since) {
      spendByCard[s.card_id] = (spendByCard[s.card_id] ?? 0) + s.amount_inr;
    }
  }

  const staleThreshold = 90;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cards</h1>
        <p className="text-sm text-gray-500 mt-1">Card-year spend, milestones, and fee waivers</p>
      </div>

      {(cards ?? []).length === 0 && (
        <p className="text-gray-500 text-sm">No cards found. Check your Supabase connection.</p>
      )}

      {(cards ?? []).map((card: Card) => {
        const spend = spendByCard[card.card_id] ?? 0;
        const rates = ratesMap[card.card_id] ?? [];
        const cms = milestonesMap[card.card_id] ?? [];
        const staleRates = rates.filter((r) => daysSince(r.last_verified) > staleThreshold);

        return (
          <div key={card.card_id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{card.display_name}</h2>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span className="capitalize">{card.holder_id}</span>
                  <span>·</span>
                  <span>{card.issuer} {card.network}</span>
                  {card.annual_fee_inr && <><span>·</span><span>₹{card.annual_fee_inr.toLocaleString("en-IN")}/yr</span></>}
                  {card.ltf && <span className="bg-green-100 text-green-700 px-1.5 rounded">LTF</span>}
                </div>
              </div>
              {staleRates.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
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
                <p className="text-xs text-gray-400">No milestones configured for this card.</p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Earn Rates</p>
              <div className="flex flex-wrap gap-2">
                {rates.slice(0, 8).map((r) => (
                  <span
                    key={r.rate_id}
                    className={`text-xs px-2 py-1 rounded-full ${
                      r.excluded
                        ? "bg-gray-100 text-gray-400 line-through"
                        : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    {r.category.replace(/_/g, " ")}:{" "}
                    {r.excluded ? "0" : `${r.points_per_100_inr}/₹100`} {r.currency_code}
                  </span>
                ))}
                {rates.length > 8 && (
                  <span className="text-xs text-gray-400">+{rates.length - 8} more</span>
                )}
              </div>
            </div>

            <div className="flex gap-4 text-xs text-gray-500">
              <span>Anniversary: {card.anniversary_date ?? "Not set"}</span>
              <span>Card-year spend: ₹{spend.toLocaleString("en-IN")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
