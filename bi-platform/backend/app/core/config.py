from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "BI Platform"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://bi_user:password@postgres:5432/bi_platform"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_TTL: int = 14400  # 4 hours in seconds

    # Security
    SECRET_KEY: str = "changeme-generate-with-openssl-rand-hex-64"
    AES_ENCRYPTION_KEY: str = "changeme-generate-with-openssl-rand-hex-32"  # 64 hex chars = 32 bytes
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8 hours

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    # Meta OAuth
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_REDIRECT_URI: str = ""

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # PDF Service
    PDF_SERVICE_URL: str = "http://pdf-service:3001"

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: str = "https://marketango.co"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def aes_key_bytes(self) -> bytes:
        """AES key as 32 bytes from hex string (64 hex chars)."""
        return bytes.fromhex(self.AES_ENCRYPTION_KEY)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
