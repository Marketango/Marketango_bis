import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate agency user and return JWT."""
    result = await db.execute(
        select(User).where(User.email == request.email, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        tenant_id=user.tenant_id,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role.value,
        tenant_id=user.tenant_id,
    )


@router.get("/me")
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(__import__("app.middleware.jwt_auth", fromlist=["require_agency_user"]).require_agency_user),
):
    """Return current authenticated user info."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
        "tenant_id": current_user.tenant_id,
    }
