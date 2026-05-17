import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { computeRecommendations } from "@/lib/recommender";
import { Card, EarnRate, Milestone } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { amount_inr, category } = await req.json();

  if (!amount_inr || !category) {
    return NextResponse.json({ error: "amount_inr and category are required" }, { status: 400 });
  }

  const [{ data: cards }, { data: earnRates }, { data: milestones }, { data: spendLogs }] =
    await Promise.all([
      supabase.from("cards").select("*").eq("active", true),
      supabase.from("earn_rates").select("*"),
      supabase.from("milestones").select("*").eq("achieved", false),
      supabase.from("spend_log").select("card_id, amount_inr, txn_date"),
    ]);

  const earnRatesMap: Record<string, EarnRate[]> = {};
  for (const r of (earnRates ?? []) as EarnRate[]) {
    (earnRatesMap[r.card_id] ??= []).push(r);
  }

  const milestonesMap: Record<string, Milestone[]> = {};
  for (const m of (milestones ?? []) as Milestone[]) {
    (milestonesMap[m.card_id] ??= []).push(m);
  }

  const cardMap: Record<string, Card> = Object.fromEntries(
    (cards ?? []).map((c: Card) => [c.card_id, c] as [string, Card])
  );

  const cardYearSpendMap: Record<string, number> = {};
  for (const s of spendLogs ?? []) {
    const card = cardMap[s.card_id];
    const since = card?.anniversary_date ?? `${new Date().getFullYear()}-01-01`;
    if (s.txn_date >= since) {
      cardYearSpendMap[s.card_id] = (cardYearSpendMap[s.card_id] ?? 0) + s.amount_inr;
    }
  }

  const results = computeRecommendations(
    amount_inr,
    category,
    (cards ?? []) as Card[],
    earnRatesMap,
    milestonesMap,
    cardYearSpendMap
  );

  return NextResponse.json({ results });
}
