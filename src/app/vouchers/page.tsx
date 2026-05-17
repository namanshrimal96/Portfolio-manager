import { supabase } from "@/lib/supabase";
import { Voucher, Card } from "@/lib/types";

export const revalidate = 60;

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function urgencyBadge(v: Voucher) {
  if (!v.expiry_date) return null;
  const d = daysUntil(v.expiry_date);
  if (d <= 30) return { label: `Expires in ${d}d`, cls: "bg-red-50 text-red-700" };
  if (d <= 60) return { label: `Expires in ${d}d`, cls: "bg-[#FFF8EC] text-[#92600A]" };
  if (d <= 180) return { label: `${d}d left`, cls: "bg-brand-light text-brand" };
  return { label: `${d}d left`, cls: "bg-emerald-50 text-emerald-700" };
}

export default async function VouchersPage() {
  const [{ data: vouchers }, { data: cards }] = await Promise.all([
    supabase.from("vouchers").select("*").order("expiry_date", { ascending: true }),
    supabase.from("cards").select("card_id, display_name, holder_id"),
  ]);

  const cardMap: Record<string, Card> = {};
  for (const c of (cards ?? []) as Card[]) {
    cardMap[c.card_id] = c;
  }

  const active = (vouchers ?? []).filter((v: Voucher) => !v.redeemed);
  const redeemed = (vouchers ?? []).filter((v: Voucher) => v.redeemed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Vouchers</h1>
        <p className="text-sm text-ink-3 mt-0.5">Sorted by expiry — oldest first</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink-2">Active ({active.length})</p>
        {active.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-border p-8 text-center text-ink-3 text-sm">
            No active vouchers. They appear here once linked to a milestone.
          </div>
        ) : (
          active.map((v: Voucher) => {
            const badge = urgencyBadge(v);
            const card = v.source_card_id ? cardMap[v.source_card_id] : null;
            return (
              <div
                key={v.voucher_id}
                className="bg-white rounded-2xl border border-warm-border p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink">{v.voucher_type.replace(/_/g, " ")}</p>
                    {badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {v.description && <p className="text-sm text-ink-2">{v.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-ink-3">
                    {card && <span>{card.display_name} ({card.holder_id})</span>}
                    {v.issued_date && (
                      <>
                        <span>·</span>
                        <span>Issued {v.issued_date}</span>
                      </>
                    )}
                    {v.expiry_date && (
                      <>
                        <span>·</span>
                        <span>Expires {v.expiry_date}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {v.face_value_inr && (
                    <p className="font-semibold text-ink">{fmt(v.face_value_inr)}</p>
                  )}
                  {v.effective_value_inr && v.effective_value_inr !== v.face_value_inr && (
                    <p className="text-xs text-ink-3">~{fmt(v.effective_value_inr)} effective</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {redeemed.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-3">Redeemed ({redeemed.length})</p>
          {redeemed.map((v: Voucher) => {
            const card = v.source_card_id ? cardMap[v.source_card_id] : null;
            return (
              <div
                key={v.voucher_id}
                className="bg-cream rounded-2xl border border-warm-border p-4 flex items-center justify-between opacity-60"
              >
                <div>
                  <p className="text-sm font-medium text-ink-2 line-through">
                    {v.voucher_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-ink-3">
                    {card?.display_name} · Redeemed {v.redeemed_date}
                    {v.redeemed_against && ` · ${v.redeemed_against}`}
                  </p>
                </div>
                {v.face_value_inr && (
                  <p className="text-sm text-ink-2">{fmt(v.face_value_inr)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
