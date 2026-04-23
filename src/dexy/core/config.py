from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Dexy API"
    environment: str = "development"
    default_chain: str = "hyperliquid"
    enable_demo_data: bool = True
    hyperliquid_api_url: str = "https://api.hyperliquid.xyz/info"
    prototype_default_wallet: str = "0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab"
    telegram_bot_token: Optional[str] = None
    telegram_api_base: str = "https://api.telegram.org"
    telegram_webhook_secret: Optional[str] = None

    model_config = SettingsConfigDict(env_prefix="DEXY_", env_file=".env", extra="ignore")


settings = Settings()
