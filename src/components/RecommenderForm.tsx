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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Merchant (optional)</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !amount}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Computing…" : "Get Recommendation"}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>

      {results && (
        <div className="space-y-3">
          {eligible.map((r, i) => (
            <div key={r.card_id} className={`bg-white rounded-xl border p-5 ${i === 0 ? "border-indigo-300 shadow-sm" : "border-gray-200"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-lg mr-2">{medals[i] ?? "•"}</span>
                  <span className="font-semibold text-gray-900">{r.card_name}</span>
                  <span className="ml-2 text-xs text-gray-500">{r.holder_id}</span>
                  {r.stale_rate_warning && (
                    <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">⚠ Rates unverified &gt;90d</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{fmt(r.expected_value_inr)}</p>
                  <p className="text-xs text-gray-500">{r.return_rate.toFixed(1)}% return</p>
                </div>
              </div>
              <ul className="space-y-1">
                {r.reasoning.map((line, j) => (
                  <li key={j} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {(r.milestone_bonus > 0 || r.fee_waiver_bonus > 0) && (
                <div className="mt-3 flex gap-3 text-xs">
                  {r.base_value > 0 && <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Base {fmt(r.base_value)}</span>}
                  {r.milestone_bonus > 0 && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Milestone +{fmt(r.milestone_bonus)}</span>}
                  {r.fee_waiver_bonus > 0 && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Fee waiver +{fmt(r.fee_waiver_bonus)}</span>}
                </div>
              )}
            </div>
          ))}

          {excluded.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Excluded cards</p>
              <ul className="space-y-1">
                {excluded.map((r) => (
                  <li key={r.card_id} className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{r.card_name}</span> — {r.exclusion_reason}
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
