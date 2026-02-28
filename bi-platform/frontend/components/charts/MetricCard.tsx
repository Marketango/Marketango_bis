interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage change vs previous period
  format?: "currency" | "percent" | "number" | "decimal";
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
}

function formatValue(value: string | number, format?: string, prefix?: string, suffix?: string): string {
  if (typeof value === "string") return value;

  let formatted: string;
  switch (format) {
    case "currency":
      formatted = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
      break;
    case "percent":
      formatted = `${value.toFixed(2)}%`;
      break;
    case "decimal":
      formatted = value.toFixed(2);
      break;
    case "number":
    default:
      formatted = new Intl.NumberFormat("es-CO").format(value);
  }

  return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  format,
  prefix,
  suffix,
  highlight = false,
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <div className={`rounded-xl border p-4 ${
      highlight
        ? "border-blue-200 bg-blue-50"
        : "border-gray-200 bg-white"
    } shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
      <p className={`mt-1.5 text-2xl font-bold ${highlight ? "text-blue-700" : "text-gray-900"}`}>
        {formatValue(value, format, prefix, suffix)}
      </p>

      {(subtitle || trend !== undefined) && (
        <div className="mt-1.5 flex items-center gap-2">
          {trend !== undefined && (
            <span className={`inline-flex items-center text-xs font-medium ${
              trendPositive ? "text-green-600" : trendNegative ? "text-red-500" : "text-gray-400"
            }`}>
              {trendPositive ? "▲" : trendNegative ? "▼" : "—"}
              {" "}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-gray-400">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
