import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { txn_date, card_id, amount_inr, category, merchant, points_earned, notes } = body;

  if (!txn_date || !card_id || !amount_inr || !category) {
    return NextResponse.json({ error: "txn_date, card_id, amount_inr, category required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("spend_log")
    .insert({ txn_date, card_id, amount_inr, category, merchant, points_earned, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ spend: data }, { status: 201 });
}

export async function GET() {
  const { data, error } = await supabase
    .from("spend_log")
    .select("*, cards(display_name, holder_id)")
    .order("txn_date", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ spend: data });
}
