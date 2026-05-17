interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "warning" | "danger" | "success";
}

const accentClasses = {
  default: "bg-white border-gray-200",
  warning: "bg-amber-50 border-amber-200",
  danger: "bg-red-50 border-red-200",
  success: "bg-green-50 border-green-200",
};

export default function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${accentClasses[accent]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
