from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="OpenCoWork Backend")
    app_version: str = Field(default="0.1.0")
    debug: bool = Field(default=False)

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    database_url: str = Field(default="sqlite:///./opencowork.db")

    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    secret_key: str = Field(default="change-this-secret-key-in-production")

    # External services
    executor_manager_url: str = Field(
        default="http://localhost:8001", alias="EXECUTOR_MANAGER_URL"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
