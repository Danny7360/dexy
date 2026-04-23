from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from dexy.core.config import settings


class TelegramBotClient:
    def __init__(
        self,
        bot_token: Optional[str] = None,
        api_base: Optional[str] = None,
    ) -> None:
        self.bot_token = bot_token or settings.telegram_bot_token
        self.api_base = api_base or settings.telegram_api_base

    @property
    def configured(self) -> bool:
        return bool(self.bot_token)

    def send_message(self, chat_id: int, text: str) -> Dict[str, Any]:
        if not self.configured:
            return {"ok": True, "skipped": True, "reason": "telegram bot token not configured"}

        url = f"{self.api_base}/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "disable_web_page_preview": True,
        }

        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
