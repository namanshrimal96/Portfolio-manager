"use client";
import { useState } from "react";

interface CurrencyOption {
  currency_code: string;
  display_name: string;
  holder_id: string;
}

interface Props {
  currencies: CurrencyOption[];
}

export default function BalanceUpdateForm({ currencies }: Props) {
  const [selected, setSelected] = useState(
    currencies.length > 0 ? `${currencies[0].currency_code}__${currencies[0].holder_id}` : ""
  );
  const [balance, setBalance] = useState("");
  const [expiry, setExpiry] = useState("");
  const [tier, setTier] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const [currency_code, holder_id] = selected.split("__");

    try {
      const res = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency_code,
          holder_id,
          balance: Number(balance),
          oldest_tranche_expiry: expiry || undefined,
          tier: tier || undefined,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSuccess(true);
      setBalance("");
      setExpiry("");
      setTier("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-warm-border rounded-xl px-3 py-2.5 text-sm text-ink bg-white placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors";

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-6">
      <h2 className="text-sm font-semibold text-ink mb-4">Update Balance Snapshot</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Currency &amp; Holder
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={inputClass}
            >
              {currencies.map((c) => (
                <option
                  key={c.currency_code + c.holder_id}
                  value={c.currency_code + "__" + c.holder_id}
                >
                  {c.display_name} — {c.holder_id === "self" ? "Self" : "Spouse"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Current Balance (points)
            </label>
            <input
              type="number"
              required
              min={0}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="e.g. 45000"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Oldest Expiry Date{" "}
              <span className="text-ink-3 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Tier Status{" "}
              <span className="text-ink-3 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              placeholder="e.g. Silver Elite, Gold"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={loading || !balance}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#E04D00] disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Save Snapshot"}
          </button>
          {success && (
            <span className="text-emerald-600 text-sm font-medium">
              Saved! Dashboard updates in ~60s.
            </span>
          )}
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </form>
    </div>
  );
}
