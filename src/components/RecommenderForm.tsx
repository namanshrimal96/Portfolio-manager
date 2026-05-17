"use client";
import { useState } from "react";
import { CATEGORIES, RecommendationResult } from "@/lib/types";

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function RecommenderForm() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [merchant, setMerchant] = useState("");
  const [results, setResults] = useState<RecommendationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_inr: Number(amount), category, merchant }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResults(data.results);
    } catch {
      setError("Something went wrong. Check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  }

  const eligible = results?.filter((r) => !r.is_excluded) ?? [];
  const excluded = results?.filter((r) => r.is_excluded) ?? [];
  const medals = ["🥇", "🥈", "🥉"];

  const inputClass =
    "w-full border border-warm-border rounded-xl px-3 py-2.5 text-sm text-ink bg-white placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:border-brand transition-colors";

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-warm-border p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">Amount (₹)</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Merchant{" "}
              <span className="text-ink-3 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !amount}
          className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#E04D00] disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Computing…" : "Get Recommendation"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {results && (
        <div className="space-y-3">
          {eligible.map((r, i) => (
            <div
              key={r.card_id}
              className={`bg-white rounded-2xl border p-5 ${
                i === 0 ? "border-brand" : "border-warm-border"
              }`}
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{medals[i] ?? "•"}</span>
                    <span className="font-semibold text-ink">{r.card_name}</span>
                    <span className="text-xs text-ink-3 capitalize">{r.holder_id}</span>
                    {r.stale_rate_warning && (
                      <span className="bg-[#FFF8EC] text-[#92600A] text-xs px-2 py-0.5 rounded-lg">
                        ⚠ Rates unverified &gt;90d
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-ink">{fmt(r.expected_value_inr)}</p>
                  <p className="text-xs text-ink-3">{r.return_rate.toFixed(1)}% return</p>
                </div>
              </div>
              <ul className="space-y-1 mb-3">
                {r.reasoning.map((line, j) => (
                  <li key={j} className="text-sm text-ink-2 flex gap-2">
                    <span className="text-ink-3 mt-0.5 shrink-0">·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {(r.milestone_bonus > 0 || r.fee_waiver_bonus > 0) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {r.base_value > 0 && (
                    <span className="bg-cream text-ink-2 border border-warm-border px-2 py-1 rounded-lg">
                      Base {fmt(r.base_value)}
                    </span>
                  )}
                  {r.milestone_bonus > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                      Milestone +{fmt(r.milestone_bonus)}
                    </span>
                  )}
                  {r.fee_waiver_bonus > 0 && (
                    <span className="bg-brand-light text-brand px-2 py-1 rounded-lg">
                      Fee waiver +{fmt(r.fee_waiver_bonus)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {excluded.length > 0 && (
            <div className="bg-cream rounded-2xl border border-warm-border p-4">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">
                Excluded cards
              </p>
              <ul className="space-y-1">
                {excluded.map((r) => (
                  <li key={r.card_id} className="text-sm text-ink-2">
                    <span className="font-medium text-ink">{r.card_name}</span> —{" "}
                    {r.exclusion_reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
