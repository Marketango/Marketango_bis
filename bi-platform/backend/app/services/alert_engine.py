from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class AlertSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    MEDIUM = "MEDIUM"
    ALERT = "ALERT"
    OPPORTUNITY = "OPPORTUNITY"
    SCALE = "SCALE"


@dataclass
class Alert:
    severity: AlertSeverity
    source: str
    metric: str
    message: str
    value: float
    threshold: float
    action: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "severity": self.severity.value,
            "source": self.source,
            "metric": self.metric,
            "message": self.message,
            "value": self.value,
            "threshold": self.threshold,
            "action": self.action,
        }


_SEVERITY_ORDER = {
    AlertSeverity.CRITICAL: 0,
    AlertSeverity.MEDIUM: 1,
    AlertSeverity.ALERT: 2,
    AlertSeverity.OPPORTUNITY: 3,
    AlertSeverity.SCALE: 4,
}


class AlertEngine:
    """
    Stateless alert detection engine.
    Takes normalized metrics dicts and returns sorted Alert objects.
    Phase 2 will email CRITICAL alerts; Phase 1 returns them inline in API responses.
    """

    def detect_all(
        self,
        google_ads_data: Optional[dict] = None,
        meta_ads_data: Optional[dict] = None,
        seo_data: Optional[dict] = None,
        ga4_data: Optional[dict] = None,
        target_cpa: Optional[float] = None,
    ) -> list[Alert]:
        alerts: list[Alert] = []

        if google_ads_data:
            alerts.extend(self._check_google_ads(google_ads_data, target_cpa))
        if meta_ads_data:
            alerts.extend(self._check_meta_ads(meta_ads_data, target_cpa))
        if seo_data:
            alerts.extend(self._check_seo(seo_data))
        if ga4_data:
            alerts.extend(self._check_ga4(ga4_data))
        if google_ads_data and meta_ads_data:
            alerts.extend(
                self._check_cross_source(google_ads_data, meta_ads_data, ga4_data)
            )

        # Sort: CRITICAL first
        alerts.sort(key=lambda a: _SEVERITY_ORDER.get(a.severity, 5))
        return alerts

    # ── Google Ads ─────────────────────────────────────────────────────────────

    def _check_google_ads(
        self, data: dict, target_cpa: Optional[float]
    ) -> list[Alert]:
        alerts: list[Alert] = []
        totals = data.get("totals", {})
        roas = totals.get("roas", 0.0)
        cpa = totals.get("cpa", 0.0)

        # ROAS
        if roas < 1.5:
            alerts.append(
                Alert(
                    AlertSeverity.CRITICAL,
                    "google_ads",
                    "roas",
                    f"ROAS {roas:.2f}x — campaña perdiendo dinero, pausar o revisar urgente",
                    roas,
                    1.5,
                )
            )
        elif 1.5 <= roas < 2.5:
            alerts.append(
                Alert(
                    AlertSeverity.MEDIUM,
                    "google_ads",
                    "roas",
                    f"ROAS {roas:.2f}x por debajo del umbral rentable, optimizar pujas",
                    roas,
                    2.5,
                )
            )
        elif roas > 4.0:
            alerts.append(
                Alert(
                    AlertSeverity.OPPORTUNITY,
                    "google_ads",
                    "roas",
                    f"ROAS {roas:.2f}x — zona de alto rendimiento, considerar escalar presupuesto",
                    roas,
                    4.0,
                    action="Aumentar presupuesto 20-30% en campañas top",
                )
            )

        # CPA vs target
        if target_cpa and cpa > 0:
            ratio = cpa / target_cpa
            if ratio > 1.5:
                alerts.append(
                    Alert(
                        AlertSeverity.CRITICAL,
                        "google_ads",
                        "cpa",
                        f"CPA ${cpa:.2f} es {ratio:.0%} del objetivo ${target_cpa:.2f}",
                        cpa,
                        target_cpa * 1.5,
                    )
                )
            elif 1.0 < ratio <= 1.5:
                alerts.append(
                    Alert(
                        AlertSeverity.MEDIUM,
                        "google_ads",
                        "cpa",
                        f"CPA ${cpa:.2f} supera objetivo de ${target_cpa:.2f}",
                        cpa,
                        target_cpa,
                    )
                )
            elif ratio < 0.8:
                alerts.append(
                    Alert(
                        AlertSeverity.SCALE,
                        "google_ads",
                        "cpa",
                        f"CPA ${cpa:.2f} está {ratio:.0%} del objetivo — eficiencia alta, escalar",
                        cpa,
                        target_cpa * 0.8,
                        action="Aumentar pujas o presupuesto — CPA por debajo del objetivo",
                    )
                )

        # CTR e Impression Share por campaña
        for campaign in data.get("campaigns", []):
            ctr = campaign.get("ctr", 0.0) * 100
            channel = campaign.get("channel_type", "")
            name = campaign.get("name", "unknown")
            is_pct = (campaign.get("impression_share") or 0) * 100
            is_lost_budget = (campaign.get("is_lost_budget") or 0) * 100
            is_lost_rank = (campaign.get("is_lost_rank") or 0) * 100
            camp_roas = campaign.get("roas", 0.0)

            if channel == "SEARCH" and ctr < 3.0:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "google_ads",
                        "ctr",
                        f"Search '{name}': CTR {ctr:.2f}% por debajo del 3%",
                        ctr,
                        3.0,
                        action="Revisar creatividades y relevancia de keywords",
                    )
                )
            elif channel == "DISPLAY" and ctr < 0.3:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "google_ads",
                        "ctr",
                        f"Display '{name}': CTR {ctr:.2f}% por debajo del 0.3%",
                        ctr,
                        0.3,
                    )
                )

            # Impression Share oportunidades
            if is_pct < 40 and camp_roas > 2.5:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "google_ads",
                        "impression_share",
                        f"'{name}': IS {is_pct:.0f}% con buen ROAS — hay demanda disponible",
                        is_pct,
                        40.0,
                        action="Aumentar presupuesto, la demanda supera lo capturado",
                    )
                )
            if is_lost_budget > 30:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "google_ads",
                        "is_lost_budget",
                        f"'{name}': {is_lost_budget:.0f}% IS perdido por presupuesto en horario pico",
                        is_lost_budget,
                        30.0,
                    )
                )
            if is_lost_rank > 40:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "google_ads",
                        "is_lost_rank",
                        f"'{name}': {is_lost_rank:.0f}% IS perdido por ranking — mejorar Quality Score",
                        is_lost_rank,
                        40.0,
                    )
                )

        return alerts

    # ── Meta Ads ───────────────────────────────────────────────────────────────

    def _check_meta_ads(
        self, data: dict, target_cpa: Optional[float]
    ) -> list[Alert]:
        alerts: list[Alert] = []

        for campaign in data.get("campaigns", []):
            name = campaign.get("name", "unknown")
            frequency = campaign.get("frequency", 0.0)
            ctr = campaign.get("ctr", 0.0) * 100
            camp_cpa = campaign.get("cpa", 0.0)

            # Ad fatigue
            if frequency > 5.0:
                alerts.append(
                    Alert(
                        AlertSeverity.CRITICAL,
                        "meta_ads",
                        "frequency",
                        f"'{name}': frecuencia {frequency:.1f} — saturación severa",
                        frequency,
                        5.0,
                        action="Rotar creatividades inmediatamente o ampliar audiencia",
                    )
                )
            elif frequency > 3.0:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "meta_ads",
                        "frequency",
                        f"'{name}': frecuencia {frequency:.1f} — posible fatiga de audiencia",
                        frequency,
                        3.0,
                        action="Considerar rotar creatividades",
                    )
                )

            # CTR
            if ctr < 1.0:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "meta_ads",
                        "ctr",
                        f"'{name}': CTR {ctr:.2f}% por debajo del 1%",
                        ctr,
                        1.0,
                        action="Revisar creatividad o segmentación",
                    )
                )

        # Totals ROAS
        totals = data.get("totals", {})
        meta_roas = totals.get("roas", 0.0)
        if meta_roas < 1.5 and totals.get("spend", 0) > 0:
            alerts.append(
                Alert(
                    AlertSeverity.CRITICAL,
                    "meta_ads",
                    "roas",
                    f"ROAS Meta {meta_roas:.2f}x — campañas por debajo del umbral rentable",
                    meta_roas,
                    1.5,
                )
            )

        return alerts

    # ── SEO ────────────────────────────────────────────────────────────────────

    def _check_seo(self, data: dict) -> list[Alert]:
        alerts: list[Alert] = []
        keywords = data.get("keywords", [])

        for kw in keywords:
            position = kw.get("position", 0.0)
            impressions = kw.get("impressions", 0)
            ctr = kw.get("ctr", 0.0) * 100
            query = kw.get("query", "")

            # Low Hanging Fruit Tier 1
            if 11 <= position <= 20 and impressions >= 500 and ctr < 3.0:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "seo",
                        "lhf_tier1",
                        f"LHF T1: '{query}' en pos {position:.0f} — {impressions} impresiones, CTR {ctr:.1f}%",
                        position,
                        20.0,
                        action="Optimizar title tag y meta description para este término",
                    )
                )
            # Low Hanging Fruit Tier 2
            elif 11 <= position <= 20 and impressions >= 200 and ctr < 2.0:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "seo",
                        "lhf_tier2",
                        f"LHF T2: '{query}' en pos {position:.0f} — {impressions} impresiones",
                        position,
                        20.0,
                    )
                )
            # Top 3 Opportunity
            elif 4 <= position <= 10 and impressions >= 1000 and ctr < 5.0:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "seo",
                        "top3_opportunity",
                        f"Oportunidad Top3: '{query}' en pos {position:.0f} con {impressions} impresiones",
                        position,
                        10.0,
                        action="Mejorar title tag, agregar enlazado interno",
                    )
                )

            # Position 1-3 with low CTR
            if position <= 3 and ctr < 10.0 and impressions >= 100:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "seo",
                        "low_ctr_top3",
                        f"'{query}' en pos {position:.0f} con CTR {ctr:.1f}% — optimizar snippet",
                        ctr,
                        10.0,
                        action="Revisar title y meta description, posible featured snippet de competidor",
                    )
                )

        # WoW impression drop
        total_impressions = data.get("totals", {}).get("impressions", 0)
        prev_impressions = data.get("prev_total_impressions", 0)
        if prev_impressions > 0 and total_impressions > 0:
            wow_change = (total_impressions - prev_impressions) / prev_impressions
            if wow_change < -0.4:
                alerts.append(
                    Alert(
                        AlertSeverity.CRITICAL,
                        "seo",
                        "impression_drop",
                        f"Impresiones cayeron {abs(wow_change):.0%} — posible penalización o desindexación",
                        wow_change,
                        -0.4,
                        action="Revisar Google Search Console para errores de cobertura",
                    )
                )
            elif wow_change < -0.2:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "seo",
                        "impression_drop",
                        f"Impresiones cayeron {abs(wow_change):.0%} respecto al período anterior",
                        wow_change,
                        -0.2,
                    )
                )

        return alerts

    # ── GA4 ────────────────────────────────────────────────────────────────────

    def _check_ga4(self, data: dict) -> list[Alert]:
        alerts: list[Alert] = []
        totals = data.get("totals", {})

        engagement_rate = totals.get("engagement_rate", 0.0) * 100
        avg_duration = totals.get("avg_session_duration", 0.0)
        form_submits = data.get("form_submit_events", 0)
        events = data.get("events", {})

        # Engagement rate
        if engagement_rate < 25:
            alerts.append(
                Alert(
                    AlertSeverity.CRITICAL,
                    "ga4",
                    "engagement_rate",
                    f"Engagement rate {engagement_rate:.1f}% — usuarios no interactúan con el contenido",
                    engagement_rate,
                    25.0,
                    action="Revisar velocidad de carga y relevancia del contenido",
                )
            )
        elif engagement_rate < 40:
            alerts.append(
                Alert(
                    AlertSeverity.ALERT,
                    "ga4",
                    "engagement_rate",
                    f"Engagement rate {engagement_rate:.1f}% por debajo del 40%",
                    engagement_rate,
                    40.0,
                )
            )

        # Session duration
        if avg_duration < 15:
            alerts.append(
                Alert(
                    AlertSeverity.CRITICAL,
                    "ga4",
                    "session_duration",
                    f"Duración media {avg_duration:.0f}s en landing pages — posible problema de UX",
                    avg_duration,
                    15.0,
                )
            )
        elif avg_duration < 30:
            alerts.append(
                Alert(
                    AlertSeverity.ALERT,
                    "ga4",
                    "session_duration",
                    f"Duración media {avg_duration:.0f}s — contenido no retiene al usuario",
                    avg_duration,
                    30.0,
                )
            )

        # Tracking disconnect: form submits exist but no ad conversions recorded
        ad_conversion_events = events.get("conversion", 0) + events.get(
            "ads_conversion", 0
        )
        if form_submits > 0 and ad_conversion_events == 0:
            alerts.append(
                Alert(
                    AlertSeverity.CRITICAL,
                    "ga4",
                    "tracking_disconnect",
                    "form_submit detectado en GA4 pero 0 conversiones en Ads — desconexión de tracking",
                    0.0,
                    1.0,
                    action="Verificar tag de conversión en página de gracias",
                )
            )

        # Scroll depth CRO alerts
        scroll_50 = events.get("scroll_50", 0)
        scroll_75 = events.get("scroll_75", 0)
        total_sessions = totals.get("sessions", 1)

        if total_sessions > 0:
            scroll_50_rate = scroll_50 / total_sessions
            scroll_75_rate = scroll_75 / total_sessions
            conversions = totals.get("conversions", 0)
            conv_rate = conversions / total_sessions

            if scroll_50_rate < 0.3:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "ga4",
                        "scroll_depth_cro",
                        f"Solo {scroll_50_rate:.0%} de usuarios llegan al 50% del scroll",
                        scroll_50_rate,
                        0.3,
                        action="Mover CTA principal arriba del fold",
                    )
                )
            elif scroll_75_rate > 0.6 and conv_rate < 0.01:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "ga4",
                        "cro_form_ineffective",
                        f"{scroll_75_rate:.0%} llegan al 75% del scroll pero conversión es {conv_rate:.1%}",
                        conv_rate,
                        0.01,
                        action="El formulario o CTA al final no es efectivo — simplificar o reposicionar",
                    )
                )

        return alerts

    # ── Cross-source ───────────────────────────────────────────────────────────

    def _check_cross_source(
        self,
        google_data: dict,
        meta_data: dict,
        ga4_data: Optional[dict],
    ) -> list[Alert]:
        alerts: list[Alert] = []

        g_roas = google_data.get("totals", {}).get("roas", 0.0)
        m_roas = meta_data.get("totals", {}).get("roas", 0.0)
        m_spend = meta_data.get("totals", {}).get("spend", 0.0)

        if m_roas > 0 and m_spend > 0:
            ratio = g_roas / m_roas
            if ratio >= 2.0:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "cross_source",
                        "budget_reallocation",
                        f"Google ROAS {g_roas:.1f}x vs Meta {m_roas:.1f}x — reasignar 25% del presupuesto",
                        ratio,
                        2.0,
                        action=f"Mover ~${m_spend * 0.25:.0f} de Meta a Google Search",
                    )
                )
            elif ratio >= 1.5:
                alerts.append(
                    Alert(
                        AlertSeverity.OPPORTUNITY,
                        "cross_source",
                        "budget_reallocation",
                        f"Google ROAS {g_roas:.1f}x vs Meta {m_roas:.1f}x — considerar mover 15%",
                        ratio,
                        1.5,
                        action=f"Considerar mover ~${m_spend * 0.15:.0f} de Meta a Google",
                    )
                )

        # Last-click attribution warning
        if ga4_data:
            channels = ga4_data.get("channels", [])
            total_conv = sum(c.get("conversions", 0) for c in channels)
            organic_conv = sum(
                c.get("conversions", 0)
                for c in channels
                if "organic" in c.get("channel", "").lower()
            )
            if total_conv > 0 and organic_conv / total_conv > 0.4:
                alerts.append(
                    Alert(
                        AlertSeverity.ALERT,
                        "cross_source",
                        "attribution",
                        f"El canal orgánico aporta {organic_conv / total_conv:.0%} de conversiones asistidas",
                        organic_conv / total_conv,
                        0.4,
                        action="El ROAS last-click de Ads puede estar sobreestimado — revisar atribución multi-touch",
                    )
                )

        # Landing page friction: high Ads CTR + low GA4 conversion
        g_ctr = google_data.get("totals", {}).get("ctr", 0.0)
        ga4_conv_rate = 0.0
        if ga4_data:
            t = ga4_data.get("totals", {})
            sessions = t.get("sessions", 1)
            ga4_conv_rate = t.get("conversions", 0) / sessions if sessions > 0 else 0.0

        if g_ctr > 0.05 and ga4_conv_rate < 0.01:
            alerts.append(
                Alert(
                    AlertSeverity.ALERT,
                    "cross_source",
                    "landing_page_friction",
                    f"CTR Ads {g_ctr:.1%} alto pero conversión en GA4 {ga4_conv_rate:.1%} — Fricción en Landing Page",
                    ga4_conv_rate,
                    0.01,
                    action="Revisar velocidad de carga, relevancia del mensaje y claridad del CTA",
                )
            )

        return alerts


alert_engine = AlertEngine()
