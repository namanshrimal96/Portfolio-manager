import { supabase } from "@/lib/supabase";
import { Voucher, Card } from "@/lib/types";

export const revalidate = 60;

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function VouchersPage() {
  const [{ data: vouchers }, { data: cards }] = await Promise.all([
    supabase.from("vouchers").select("*").order("expiry_date", { ascending: true }),
    supabase.from("cards").select("card_id, display_name, holder_id"),
  ]);

  const cardMap: Record<string, Card> = Object.fromEntries(
    (cards ?? []).map((c: Card) => [c.card_id, c] as [string, Card])
  );

  const active = (vouchers ?? []).filter((v: Voucher) => !v.redeemed);
  const redeemed = (vouchers ?? []).filter((v: Voucher) => v.redeemed);

  function urgencyBadge(v: Voucher) {
    if (!v.expiry_date) return null;
    const d = daysUntil(v.expiry_date);
    if (d <= 30) return { label: `Expires in ${d}d`, cls: "bg-red-100 text-red-700" };
    if (d <= 60) return { label: `Expires in ${d}d`, cls: "bg-amber-100 text-amber-700" };
    if (d <= 180) return { label: `${d}d left`, cls: "bg-yellow-100 text-yellow-700" };
    return { label: `${d}d left`, cls: "bg-green-100 text-green-700" };
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
        <p className="text-sm text-gray-500 mt-1">Sorted by expiry — oldest first</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Active ({active.length})</h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No active vouchers. They appear here once linked to a milestone.
          </div>
        ) : (
          active.map((v: Voucher) => {
            const badge = urgencyBadge(v);
            const card = v.source_card_id ? cardMap[v.source_card_id] : null;
            return (
              <div key={v.voucher_id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{v.voucher_type.replace(/_/g, " ")}</p>
                    {badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {v.description && <p className="text-sm text-gray-600">{v.description}</p>}
                  <div className="flex gap-3 text-xs text-gray-500">
                    {card && <span>{card.display_name} ({card.holder_id})</span>}
                    {v.issued_date && <><span>·</span><span>Issued {v.issued_date}</span></>}
                    {v.expiry_date && <><span>·</span><span>Expires {v.expiry_date}</span></>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {v.face_value_inr && (
                    <p className="font-semibold text-gray-900">{fmt(v.face_value_inr)}</p>
                  )}
                  {v.effective_value_inr && v.effective_value_inr !== v.face_value_inr && (
                    <p className="text-xs text-gray-500">~{fmt(v.effective_value_inr)} effective</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {redeemed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500">Redeemed ({redeemed.length})</h2>
          {redeemed.map((v: Voucher) => {
            const card = v.source_card_id ? cardMap[v.source_card_id] : null;
            return (
              <div key={v.voucher_id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-medium text-gray-700 line-through">{v.voucher_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-400">
                    {card?.display_name} · Redeemed {v.redeemed_date}
                    {v.redeemed_against && ` · ${v.redeemed_against}`}
                  </p>
                </div>
                {v.face_value_inr && (
                  <p className="text-sm text-gray-500">{fmt(v.face_value_inr)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
