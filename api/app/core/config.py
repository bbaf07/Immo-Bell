from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration lue depuis l'environnement (jamais de secret dans le code)."""

    model_config = SettingsConfigDict(env_prefix="IMMOBELL_", env_file=".env", extra="ignore")

    env: str = "dev"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str | None = None  # sqlite:///immobell.db (ou postgresql+psycopg://… plus tard)
    max_page_size: int = 100
    staff_token: str | None = None  # jeton provisoire du personnel ; vide = routes protégées fermées
    session_secret: str | None = None  # obligatoire hors dev : openssl rand -hex 32
    smtp_host: str | None = None  # vide = les e-mails sont écrits dans les logs (développement)
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "Immo Bell <no-reply@immobell.cm>"
    site_url: str = "https://immobell.cm"

    # assistant IA (Awa) : désactivé tant que la clé n'est pas fournie
    anthropic_api_key: str | None = None
    assistant_model: str = "claude-sonnet-5-5"
    assistant_rate_per_minute: int = 12


@lru_cache
def get_settings() -> Settings:
    return Settings()
