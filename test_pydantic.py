import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    database_url: str = "sqlite"

os.environ["DATABASE_URL"] = "postgres"
s = Settings()
print("URL IS:", s.database_url)
