from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = "postgresql://b2b2h_user:password@localhost:5432/b2b2h_db"
    secret_key: str = "change-this-secret-key-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    github_api_url: str = "https://api.github.com"
    github_token: str = ""

    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    app_name: str = "B2B2H"
    debug: bool = False

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()