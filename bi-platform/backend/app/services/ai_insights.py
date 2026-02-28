"""
AI Insights Service — Phase 2 stub.

This module will generate executive summaries and recommendations
using the Claude API (claude-sonnet-4-20250514).

Phase 1: Returns a placeholder response.
Phase 2: Full implementation with structured prompt and JSON output.
"""

import asyncio
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Phase 2 output schema
OUTPUT_SCHEMA = {
    "resumen_ejecutivo": "string (150 words)",
    "logros_mes": ["string"],
    "alertas_prioritarias": ["string"],
    "recomendaciones": [
        {"accion": "string", "impacto_esperado": "string", "urgencia": "alta|media|baja"}
    ],
    "propuesta_presupuesto": "string with concrete percentages",
}


def build_insight_prompt(
    metrics: dict,
    alerts: list,
    client_name: str,
    client_sector: str,
    target_cpa: Optional[float],
    period_current: str,
    period_previous: str,
    total_spend: float,
) -> dict:
    """Build the structured prompt data to send to Claude API."""
    return {
        "periodo": {"actual": period_current, "anterior": period_previous},
        "cliente": {
            "nombre": client_name,
            "sector": client_sector,
            "objetivo_cpa": target_cpa,
        },
        "metricas": {
            "google_ads": metrics.get("google_ads"),
            "meta_ads": metrics.get("meta_ads"),
            "seo": metrics.get("search_console"),
            "ga4": metrics.get("ga4"),
        },
        "alertas_detectadas": alerts,
        "presupuesto_total": total_spend,
    }


async def generate_insights(prompt_data: dict) -> dict:
    """
    Phase 2: Send structured metrics to Claude API and return insights.
    Phase 1: Returns placeholder.
    """
    try:
        from anthropic import Anthropic
        from app.core.config import settings

        if not settings.ANTHROPIC_API_KEY:
            return _placeholder_insights()

        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        system_prompt = (
            "Eres un analista senior de marketing digital para una agencia. "
            "Analiza los datos y genera recomendaciones precisas y accionables en español. "
            "Responde ÚNICAMENTE con JSON válido en el formato especificado. "
            "No incluyas texto fuera del JSON."
        )

        user_message = (
            f"Analiza estos datos de marketing y genera el informe ejecutivo:\n\n"
            f"{json.dumps(prompt_data, ensure_ascii=False, indent=2)}\n\n"
            f"Formato de respuesta esperado:\n{json.dumps(OUTPUT_SCHEMA, ensure_ascii=False, indent=2)}"
        )

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            ),
        )

        return json.loads(response.content[0].text)

    except Exception as exc:
        logger.error(f"AI insights generation failed: {exc}")
        return _placeholder_insights()


def _placeholder_insights() -> dict:
    return {
        "resumen_ejecutivo": "Análisis de IA no disponible en esta versión. Configure ANTHROPIC_API_KEY para habilitar.",
        "logros_mes": [],
        "alertas_prioritarias": [],
        "recomendaciones": [],
        "propuesta_presupuesto": "Disponible en Phase 2",
    }
