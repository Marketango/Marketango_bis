import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.middleware.client_token import require_client_token
from app.models.client import Client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["export"])


@router.get("/pdf/{client_slug}")
async def export_pdf(
    client_slug: str,
    date_from: str,
    date_to: str,
    token: str = Query(..., description="Client UUID access token"),
    client: Client = Depends(require_client_token),
):
    """
    Generate a PDF of the client dashboard by calling the Puppeteer PDF service.
    The PDF service renders the live dashboard URL and returns a PDF binary.
    """
    dashboard_url = (
        f"https://marketango.co/cliente/{client.slug}"
        f"?token={token}&date_from={date_from}&date_to={date_to}&print=true"
    )

    try:
        async with httpx.AsyncClient(timeout=90.0) as http:
            response = await http.post(
                f"{settings.PDF_SERVICE_URL}/generate",
                json={
                    "url": dashboard_url,
                    "options": {
                        "format": "A4",
                        "landscape": True,
                        "printBackground": True,
                        "margin": {
                            "top": "10mm",
                            "bottom": "10mm",
                            "left": "10mm",
                            "right": "10mm",
                        },
                    },
                },
            )
            response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="PDF generation timed out")
    except httpx.HTTPStatusError as exc:
        logger.error(f"PDF service error: {exc.response.text}")
        raise HTTPException(status_code=502, detail="PDF service returned an error")

    filename = f"informe-{client.slug}-{date_from}-{date_to}.pdf"
    return StreamingResponse(
        iter([response.content]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
