"use client";

import MetricCard from "@/components/charts/MetricCard";
import BarChart from "@/components/charts/BarChart";
import DataTable from "@/components/charts/DataTable";
import AlertBanner from "@/components/client/AlertBanner";
import DateRangePicker from "@/components/client/DateRangePicker";
import ExportButton from "@/components/client/ExportButton";
import type { MetricsResponse, GoogleAdsData, MetaAdsData, SearchConsoleData, GA4Data } from "@/lib/types";
import type { Alert } from "@/lib/types";

interface ClientDashboardProps {
  metrics: MetricsResponse;
  slug: string;
  token: string;
  dateFrom: string;
  dateTo: string;
  isPrintMode?: boolean;
}

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

// ─── Google Ads Section ────────────────────────────────────────────────────────
function GoogleAdsSection({ data }: { data: GoogleAdsData }) {
  const campaigns = data.campaigns ?? [];

  const campaignRows = campaigns.map((c) => ({
    name: c.campaign_name,
    status: c.campaign_status,
    spend: c.cost,
    roas: c.roas,
    ctr: c.ctr,
    cpa: c.cpa,
    conversions: c.conversions,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
        Google Ads
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Inversión Total" value={fmtCurrency(data.total_spend ?? 0)} />
        <MetricCard title="ROAS" value={(data.roas ?? 0).toFixed(2)} highlight={Boolean(data.roas && data.roas >= 3)} />
        <MetricCard title="CPA" value={fmtCurrency(data.cpa ?? 0)} />
        <MetricCard title="CTR Medio" value={fmtPct(data.avg_ctr ?? 0)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Impresiones" value={(data.impressions ?? 0).toLocaleString("es")} />
        <MetricCard title="Clics" value={(data.clicks ?? 0).toLocaleString("es")} />
        <MetricCard title="Conversiones" value={(data.conversions ?? 0).toLocaleString("es")} />
        <MetricCard title="Cuota Impres." value={fmtPct(data.impression_share ?? 0)} />
      </div>

      {/* Campaigns table */}
      {campaigns.length > 0 && (
        <DataTable
          title="Rendimiento por Campaña"
          data={campaignRows}
          columns={[
            { key: "name", header: "Campaña", render: (v) => <span className="font-medium text-gray-800">{String(v)}</span> },
            {
              key: "status",
              header: "Estado",
              align: "center",
              render: (v) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  v === "ENABLED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {v === "ENABLED" ? "Activa" : "Pausada"}
                </span>
              ),
            },
            { key: "spend", header: "Inversión", align: "right", sortable: true, render: (v) => fmtCurrency(Number(v)) },
            { key: "roas", header: "ROAS", align: "right", sortable: true, render: (v) => Number(v).toFixed(2) },
            { key: "ctr", header: "CTR", align: "right", sortable: true, render: (v) => fmtPct(Number(v)) },
            { key: "cpa", header: "CPA", align: "right", sortable: true, render: (v) => fmtCurrency(Number(v)) },
            { key: "conversions", header: "Conv.", align: "right", sortable: true },
          ]}
        />
      )}
    </div>
  );
}

// ─── Meta Ads Section ─────────────────────────────────────────────────────────
function MetaAdsSection({ data }: { data: MetaAdsData }) {
  const campaigns = data.campaigns ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
        Meta Ads
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Inversión Total" value={fmtCurrency(data.total_spend ?? 0)} />
        <MetricCard title="ROAS" value={(data.roas ?? 0).toFixed(2)} highlight={Boolean(data.roas && data.roas >= 3)} />
        <MetricCard title="CPM" value={fmtCurrency(data.cpm ?? 0)} />
        <MetricCard title="Frecuencia" value={(data.frequency ?? 0).toFixed(2)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Alcance" value={(data.reach ?? 0).toLocaleString("es")} />
        <MetricCard title="Impresiones" value={(data.impressions ?? 0).toLocaleString("es")} />
        <MetricCard title="Clics (Link)" value={(data.link_clicks ?? 0).toLocaleString("es")} />
        <MetricCard title="CTR (Link)" value={fmtPct(data.ctr ?? 0)} />
      </div>

      {campaigns.length > 0 && (
        <DataTable
          title="Rendimiento por Campaña"
          data={campaigns.map((c) => ({
            name: c.campaign_name,
            spend: c.spend,
            reach: c.reach,
            frequency: c.frequency,
            ctr: c.ctr,
            cpm: c.cpm,
            purchases: c.purchases,
          }))}
          columns={[
            { key: "name", header: "Campaña", render: (v) => <span className="font-medium text-gray-800 truncate max-w-xs block">{String(v)}</span> },
            { key: "spend", header: "Inversión", align: "right", sortable: true, render: (v) => fmtCurrency(Number(v)) },
            { key: "reach", header: "Alcance", align: "right", sortable: true, render: (v) => Number(v).toLocaleString("es") },
            { key: "frequency", header: "Frec.", align: "right", sortable: true, render: (v) => Number(v).toFixed(2) },
            { key: "ctr", header: "CTR", align: "right", sortable: true, render: (v) => fmtPct(Number(v)) },
            { key: "cpm", header: "CPM", align: "right", sortable: true, render: (v) => fmtCurrency(Number(v)) },
            { key: "purchases", header: "Compras", align: "right", sortable: true },
          ]}
        />
      )}
    </div>
  );
}

// ─── SEO Section ──────────────────────────────────────────────────────────────
function SEOSection({ data }: { data: SearchConsoleData }) {
  const keywords = data.top_keywords ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
        SEO — Google Search Console
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Impresiones" value={(data.total_impressions ?? 0).toLocaleString("es")} />
        <MetricCard title="Clics" value={(data.total_clicks ?? 0).toLocaleString("es")} />
        <MetricCard title="CTR Medio" value={fmtPct(data.avg_ctr ?? 0)} />
        <MetricCard title="Posición Media" value={(data.avg_position ?? 0).toFixed(1)} />
      </div>

      {data.prev_impressions !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <MetricCard
            title="Impresiones (período ant.)"
            value={(data.prev_impressions ?? 0).toLocaleString("es")}
            trend={data.prev_impressions
              ? ((data.total_impressions - data.prev_impressions) / data.prev_impressions) * 100
              : undefined}
          />
          <MetricCard
            title="Clics (período ant.)"
            value={(data.prev_clicks ?? 0).toLocaleString("es")}
            trend={data.prev_clicks
              ? ((data.total_clicks - data.prev_clicks) / data.prev_clicks) * 100
              : undefined}
          />
        </div>
      )}

      {keywords.length > 0 && (
        <DataTable
          title="Top Keywords"
          data={keywords.map((k) => ({
            query: k.query,
            impressions: k.impressions,
            clicks: k.clicks,
            ctr: k.ctr,
            position: k.position,
          }))}
          columns={[
            { key: "query", header: "Keyword", render: (v) => <span className="font-mono text-xs text-gray-700">{String(v)}</span> },
            { key: "impressions", header: "Impresiones", align: "right", sortable: true, render: (v) => Number(v).toLocaleString("es") },
            { key: "clicks", header: "Clics", align: "right", sortable: true, render: (v) => Number(v).toLocaleString("es") },
            { key: "ctr", header: "CTR", align: "right", sortable: true, render: (v) => fmtPct(Number(v)) },
            { key: "position", header: "Posición", align: "right", sortable: true, render: (v) => Number(v).toFixed(1) },
          ]}
        />
      )}
    </div>
  );
}

// ─── GA4 Section ──────────────────────────────────────────────────────────────
function GA4Section({ data }: { data: GA4Data }) {
  const channelRows = (data.channel_metrics ?? []).map((ch) => ({
    channel: ch.channel,
    sessions: ch.sessions,
    users: ch.users,
    engagement: ch.engagement_rate,
    duration: ch.avg_session_duration,
    conversions: ch.conversions,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
        Google Analytics 4
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title="Sesiones" value={(data.total_sessions ?? 0).toLocaleString("es")} />
        <MetricCard title="Usuarios" value={(data.total_users ?? 0).toLocaleString("es")} />
        <MetricCard title="Tasa Engagement" value={fmtPct(data.engagement_rate ?? 0)} highlight={Boolean(data.engagement_rate && data.engagement_rate >= 0.5)} />
        <MetricCard title="Duración Media" value={`${Math.round(data.avg_session_duration ?? 0)}s`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard title="Conversiones" value={(data.total_conversions ?? 0).toLocaleString("es")} />
        <MetricCard title="LCP (Web Vitals)" value={`${(data.lcp ?? 0).toFixed(1)}s`} />
        <MetricCard title="Tasa Rebote" value={fmtPct(data.bounce_rate ?? 0)} />
      </div>

      {channelRows.length > 0 && (
        <>
          <BarChart
            title="Sesiones por Canal"
            labels={channelRows.map((r) => r.channel)}
            datasets={[{ label: "Sesiones", data: channelRows.map((r) => r.sessions) }]}
            horizontal
            height={Math.max(200, channelRows.length * 36)}
          />

          <DataTable
            title="Rendimiento por Canal"
            data={channelRows}
            columns={[
              { key: "channel", header: "Canal", render: (v) => <span className="font-medium text-gray-800">{String(v)}</span> },
              { key: "sessions", header: "Sesiones", align: "right", sortable: true, render: (v) => Number(v).toLocaleString("es") },
              { key: "users", header: "Usuarios", align: "right", sortable: true, render: (v) => Number(v).toLocaleString("es") },
              { key: "engagement", header: "Engagement", align: "right", sortable: true, render: (v) => fmtPct(Number(v)) },
              { key: "duration", header: "Duración", align: "right", sortable: true, render: (v) => `${Math.round(Number(v))}s` },
              { key: "conversions", header: "Conv.", align: "right", sortable: true },
            ]}
          />
        </>
      )}
    </div>
  );
}

// ─── Combined Spend Overview ───────────────────────────────────────────────────
function SpendOverview({ metrics }: { metrics: MetricsResponse }) {
  const gAds = metrics.google_ads;
  const meta = metrics.meta_ads;

  if (!gAds && !meta) return null;

  const spendData = [
    gAds && { label: "Google Ads", spend: gAds.total_spend ?? 0, roas: gAds.roas ?? 0 },
    meta && { label: "Meta Ads", spend: meta.total_spend ?? 0, roas: meta.roas ?? 0 },
  ].filter(Boolean) as { label: string; spend: number; roas: number }[];

  const totalSpend = spendData.reduce((s, d) => s + d.spend, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Resumen de Inversión Publicitaria</h2>
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Invertido</p>
          <p className="text-2xl font-bold text-gray-900">{fmtCurrency(totalSpend)}</p>
        </div>
        {spendData.map((d) => (
          <div key={d.label} className="border-l border-gray-200 pl-4">
            <p className="text-xs text-gray-500">{d.label}</p>
            <p className="text-lg font-semibold text-gray-800">{fmtCurrency(d.spend)}</p>
            <p className="text-xs text-gray-400">ROAS: <span className="font-semibold text-gray-600">{d.roas.toFixed(2)}</span></p>
          </div>
        ))}
      </div>

      {spendData.length > 1 && (
        <div className="mt-4">
          <BarChart
            labels={spendData.map((d) => d.label)}
            datasets={[
              { label: "Inversión", data: spendData.map((d) => d.spend), color: "#3B82F6" },
            ]}
            yTickFormat="currency"
            height={160}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function ClientDashboard({
  metrics,
  slug,
  dateFrom,
  dateTo,
  isPrintMode = false,
}: ClientDashboardProps) {
  const alerts: Alert[] = metrics.alerts ?? [];

  return (
    <div className="space-y-8">
      {/* Header toolbar */}
      {!isPrintMode && (
        <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
          <DateRangePicker dateFrom={dateFrom} dateTo={dateTo} />
          <ExportButton slug={slug} dateFrom={dateFrom} dateTo={dateTo} />
        </div>
      )}

      {/* Date range indicator (print only) */}
      {isPrintMode && (
        <div className="text-xs text-gray-400">
          Período: <span className="font-medium text-gray-600">{dateFrom}</span> → <span className="font-medium text-gray-600">{dateTo}</span>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <section>
          <AlertBanner alerts={alerts} printMode={isPrintMode} />
        </section>
      )}

      {/* Spend overview */}
      <SpendOverview metrics={metrics} />

      {/* Google Ads */}
      {metrics.google_ads && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <GoogleAdsSection data={metrics.google_ads} />
        </section>
      )}

      {/* Meta Ads */}
      {metrics.meta_ads && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <MetaAdsSection data={metrics.meta_ads} />
        </section>
      )}

      {/* SEO */}
      {metrics.search_console && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <SEOSection data={metrics.search_console} />
        </section>
      )}

      {/* GA4 */}
      {metrics.ga4 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <GA4Section data={metrics.ga4} />
        </section>
      )}

      {/* No data fallback */}
      {!metrics.google_ads && !metrics.meta_ads && !metrics.search_console && !metrics.ga4 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No hay datos disponibles para este período.</p>
          <p className="text-gray-300 text-xs mt-1">Configure las credenciales de las fuentes de datos en el panel de administración.</p>
        </div>
      )}

      {/* Print footer */}
      {isPrintMode && (
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center">
          Generado por BI Platform · {new Date().toLocaleDateString("es")}
        </div>
      )}
    </div>
  );
}
