from fastapi import APIRouter
from app.api.v1 import auth, clients, credentials, metrics, reports, export

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(clients.router)
api_router.include_router(credentials.router)
api_router.include_router(metrics.router)
api_router.include_router(reports.router)
api_router.include_router(export.router)
