from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Dexy API"
    environment: str = "development"
    default_chain: str = "hyperliquid"
    enable_demo_data: bool = True

    model_config = SettingsConfigDict(env_prefix="DEXY_", env_file=".env", extra="ignore")


settings = Settings()
