from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = "postgresql://b2b2h_user:password@localhost:5432/b2b2h_db"
    secret_key: str = "change-this-secret-key-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    github_api_url: str = "https://api.github.com"
    github_token: str = ""

    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://b2-b2-h.vercel.app"
    app_name: str = "B2B2H"
    debug: bool = False

    # Email / SMTP Configuration
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_tls: bool = True
    smtp_ssl: bool = False
    emails_from_email: str = ""
    emails_from_name: str = "B2B2H"
    frontend_url: str = "https://b2-b2-h.vercel.app"
    password_reset_token_expire_minutes: int = 30
    password_reset_cooldown_seconds: int = 60

    @model_validator(mode="after")
    def validate_production_smtp(self) -> "Settings":
        if self.app_env.strip().lower() == "production":
            missing = []
            if not self.smtp_host or not self.smtp_host.strip():
                missing.append("SMTP_HOST")
            if not self.smtp_port:
                missing.append("SMTP_PORT")
            if not self.emails_from_email or not self.emails_from_email.strip():
                missing.append("EMAILS_FROM_EMAIL")
            if missing:
                raise ValueError(
                    f"Production email configuration validation failed: missing {', '.join(missing)}. "
                    "Valid SMTP configuration is mandatory when APP_ENV=production."
                )
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()