import RecommenderForm from "@/components/RecommenderForm";

export default function RecommenderPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Best Card Recommender</h1>
        <p className="text-sm text-ink-3 mt-0.5">
          Uses floor values per currency when no redemption target is specified. Verify stale rates before acting.
        </p>
      </div>
      <RecommenderForm />
    </div>
  );
}
