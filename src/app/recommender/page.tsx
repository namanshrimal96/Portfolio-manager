import RecommenderForm from "@/components/RecommenderForm";

export default function RecommenderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Best Card Recommender</h1>
        <p className="text-sm text-gray-500 mt-1">
          Uses floor values per currency when no redemption target is specified. Verify stale rates before acting.
        </p>
      </div>
      <RecommenderForm />
    </div>
  );
}
