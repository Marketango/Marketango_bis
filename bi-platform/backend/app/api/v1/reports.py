import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.jwt_auth import require_agency_user
from app.models.client import Client
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{client_id}", response_model=List[ReportResponse])
async def list_reports(
    client_id: str,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_client(client_id, current_user.tenant_id, db)
    result = await db.execute(
        select(Report)
        .where(Report.client_id == client_id)
        .order_by(Report.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{client_id}", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    client_id: str,
    payload: ReportCreate,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_client(client_id, current_user.tenant_id, db)
    report = Report(
        client_id=client_id,
        title=payload.title,
        date_from=payload.date_from,
        date_to=payload.date_to,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


@router.patch("/{client_id}/{report_id}", response_model=ReportResponse)
async def update_report(
    client_id: str,
    report_id: str,
    payload: ReportUpdate,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_client(client_id, current_user.tenant_id, db)
    report = await _get_report(report_id, client_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(report, field, value)

    await db.flush()
    await db.refresh(report)
    return report


@router.delete("/{client_id}/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    client_id: str,
    report_id: str,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_client(client_id, current_user.tenant_id, db)
    report = await _get_report(report_id, client_id, db)
    await db.delete(report)


async def _verify_client(client_id: str, tenant_id: str, db: AsyncSession) -> None:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.tenant_id == tenant_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")


async def _get_report(report_id: str, client_id: str, db: AsyncSession) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.client_id == client_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report
