// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: "agency_admin" | "agency_viewer";
  tenant_id: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  sector?: string;
  target_cpa?: number;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientToken {
  id: string;
  client_id: string;
  token: string;
  expires_at?: string;
  is_revoked: boolean;
  created_at: string;
  dashboard_url: string;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export interface Alert {
  severity: "critical" | "high" | "medium" | "alert" | "opportunity" | "scale" | "info";
  source: string;
  metric: string;
  message: string;
  value?: number;
  threshold?: number;
  action?: string;
}

// ── Google Ads ────────────────────────────────────────────────────────────────

export interface GoogleAdsCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_status: "ENABLED" | "PAUSED" | "REMOVED";
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversion_value: number;
  ctr: number;
  cpa: number;
  roas: number;
}

export interface GoogleAdsData {
  total_spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpa: number;
  avg_ctr: number;
  impression_share: number;
  campaigns: GoogleAdsCampaign[];
}

// ── Meta Ads ──────────────────────────────────────────────────────────────────

export interface MetaAdsCampaign {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
  frequency: number;
  ctr: number;
  cpm: number;
  purchases: number;
  purchase_value: number;
  roas: number;
}

export interface MetaAdsData {
  total_spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
  frequency: number;
  ctr: number;
  cpm: number;
  roas: number;
  campaigns: MetaAdsCampaign[];
}

// ── Search Console ────────────────────────────────────────────────────────────

export interface SearchConsoleKeyword {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleData {
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_position: number;
  prev_impressions: number;
  prev_clicks: number;
  top_keywords: SearchConsoleKeyword[];
}

// ── GA4 ───────────────────────────────────────────────────────────────────────

export interface GA4Channel {
  channel: string;
  sessions: number;
  users: number;
  engagement_rate: number;
  avg_session_duration: number;
  conversions: number;
}

export interface GA4Data {
  total_sessions: number;
  total_users: number;
  engagement_rate: number;
  avg_session_duration: number;
  total_conversions: number;
  bounce_rate: number;
  lcp: number;
  channel_metrics: GA4Channel[];
  events: Record<string, number>;
}

// ── Combined Metrics Response ─────────────────────────────────────────────────

export interface MetricsResponse {
  client_id: string;
  date_from: string;
  date_to: string;
  google_ads?: GoogleAdsData;
  meta_ads?: MetaAdsData;
  search_console?: SearchConsoleData;
  ga4?: GA4Data;
  alerts: Alert[];
  from_cache: boolean;
}

// ── Report ────────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  client_id: string;
  title: string;
  date_from: string;
  date_to: string;
  layout_config?: Record<string, unknown>;
  ai_insights?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
