interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "blue" | "green" | "yellow" | "red";
}

const colorMap = {
  default: "bg-white border-gray-200",
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  yellow: "bg-yellow-50 border-yellow-200",
  red: "bg-red-50 border-red-200",
};

const valueColorMap = {
  default: "text-gray-900",
  blue: "text-blue-700",
  green: "text-green-700",
  yellow: "text-yellow-700",
  red: "text-red-700",
};

export default function StatCard({
  label,
  value,
  sub,
  color = "default",
}: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${valueColorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
