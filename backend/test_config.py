import os
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

os.environ["DATABASE_URL"] = "postgres://user:pass@host/db?sslmode=require"

class Settings(BaseSettings):
    database_url: str = os.environ.get("DATABASE_URL")
    
    @field_validator("database_url")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v and v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        if "?sslmode=" in v:
            v = v.split("?")[0]
            
        return v

s = Settings()
print("URL:", s.database_url)
