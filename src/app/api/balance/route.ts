import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    currency_code, holder_id, balance,
    tier, tier_valid_until, oldest_tranche_expiry,
    ytd_earned, ytd_redeemed, notes,
  } = body;

  if (!currency_code || !holder_id || balance === undefined) {
    return NextResponse.json({ error: "currency_code, holder_id, balance required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("currency_balances")
    .insert({
      currency_code, holder_id, balance,
      tier, tier_valid_until, oldest_tranche_expiry,
      ytd_earned: ytd_earned ?? 0,
      ytd_redeemed: ytd_redeemed ?? 0,
      snapshot_date: new Date().toISOString().split("T")[0],
      notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ balance: data }, { status: 201 });
}
