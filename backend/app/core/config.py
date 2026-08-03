import os
from functools import lru_cache
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CrewMind"
    environment: str = "development"

    # Explicitly read from os.environ first to ensure cloud variables are captured
    database_url: str = os.environ.get("DATABASE_URL") or f"sqlite+aiosqlite:///{BACKEND_DIR / 'crewmind.db'}"
    
    @field_validator("database_url")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v and v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        # SQLAlchemy's asyncpg dialect rejects the 'sslmode' query param
        if "?sslmode=" in v:
            v = v.split("?")[0]
            
        return v

    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-flash-latest"
    gemini_fast_model: str = "gemini-flash-latest"
    # Quotas are per-model, so when the primary model's rate limit is hit we
    # retry on this one before backing off.
    gemini_fallback_model: str = "gemini-flash-lite-latest"

    storage_dir: Path = BACKEND_DIR / "storage"
    chroma_dir: Path = BACKEND_DIR / "chroma_data"

    razorpay_key_id: str = "rzp_test_mock123"
    razorpay_key_secret: str = "mock_secret"

    github_client_id: str | None = None
    github_client_secret: str | None = None
    
    google_client_id: str | None = None
    google_client_secret: str | None = None
    
    slack_client_id: str | None = None
    slack_client_secret: str | None = None

    frontend_url: str = "http://localhost:5173"
    cors_origins: list[str] = ["http://localhost:5173", "https://crewmindd.netlify.app", "*"]

    @property
    def has_llm_key(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    settings.chroma_dir.mkdir(parents=True, exist_ok=True)
    return settings
