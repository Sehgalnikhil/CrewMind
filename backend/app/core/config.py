from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CrewMind"
    environment: str = "development"

    database_url: str = f"sqlite+aiosqlite:///{BACKEND_DIR / 'crewmind.db'}"

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

    cors_origins: list[str] = ["http://localhost:5173"]

    @property
    def has_llm_key(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    settings.chroma_dir.mkdir(parents=True, exist_ok=True)
    return settings
