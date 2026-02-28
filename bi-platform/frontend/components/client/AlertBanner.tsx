import type { Alert } from "@/lib/types";

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🚨",
    label: "CRÍTICO",
    labelColor: "text-red-700",
    textColor: "text-red-800",
    dotColor: "bg-red-500",
  },
  high: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "⚠️",
    label: "ALTO",
    labelColor: "text-orange-700",
    textColor: "text-orange-800",
    dotColor: "bg-orange-500",
  },
  medium: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "📊",
    label: "MEDIO",
    labelColor: "text-yellow-700",
    textColor: "text-yellow-800",
    dotColor: "bg-yellow-500",
  },
  alert: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "💡",
    label: "ALERTA",
    labelColor: "text-amber-700",
    textColor: "text-amber-800",
    dotColor: "bg-amber-500",
  },
  opportunity: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "✨",
    label: "OPORTUNIDAD",
    labelColor: "text-blue-700",
    textColor: "text-blue-800",
    dotColor: "bg-blue-500",
  },
  scale: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "🚀",
    label: "ESCALAR",
    labelColor: "text-green-700",
    textColor: "text-green-800",
    dotColor: "bg-green-500",
  },
  info: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "ℹ️",
    label: "INFO",
    labelColor: "text-gray-600",
    textColor: "text-gray-700",
    dotColor: "bg-gray-400",
  },
} as const;

type SeverityKey = keyof typeof SEVERITY_CONFIG;

const SOURCE_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  search_console: "SEO",
  ga4: "GA4",
  cross: "Multi-canal",
};

interface AlertBannerProps {
  alerts: Alert[];
  printMode?: boolean;
}

export default function AlertBanner({ alerts, printMode = false }: AlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  const getConfig = (severity: string): typeof SEVERITY_CONFIG[SeverityKey] => {
    return SEVERITY_CONFIG[(severity as SeverityKey)] ?? SEVERITY_CONFIG.info;
  };

  // Group by severity order
  const order = ["critical", "high", "medium", "alert", "opportunity", "scale", "info"];
  const sorted = [...alerts].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );

  if (printMode) {
    return (
      <div className="space-y-2">
        {sorted.map((alert, i) => {
          const cfg = getConfig(alert.severity);
          return (
            <div key={i} className={`flex items-start gap-3 rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2`}>
              <span className="text-base leading-none mt-0.5">{cfg.icon}</span>
              <div>
                <span className={`text-xs font-bold ${cfg.labelColor} mr-1.5`}>{cfg.label}</span>
                <span className={`text-xs font-medium ${cfg.labelColor}`}>
                  {SOURCE_LABELS[alert.source] ?? alert.source}
                </span>
                <p className={`text-xs ${cfg.textColor} mt-0.5`}>{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Alertas Activas</h2>
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          {alerts.length}
        </span>
      </div>
      {sorted.map((alert, i) => {
        const cfg = getConfig(alert.severity);
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}
          >
            <span className="text-lg leading-none mt-0.5 shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold ${cfg.labelColor} tracking-wide`}>
                  {cfg.label}
                </span>
                <span className={`text-xs font-medium ${cfg.labelColor} opacity-70`}>
                  · {SOURCE_LABELS[alert.source] ?? alert.source}
                </span>
                {alert.metric && (
                  <span className="text-xs text-gray-400 font-mono">{alert.metric}</span>
                )}
              </div>
              <p className={`text-sm ${cfg.textColor} mt-0.5`}>{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
