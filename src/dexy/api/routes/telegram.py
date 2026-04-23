from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException

from dexy.core.config import settings
from dexy.services.telegram import build_help_message
from dexy.usecases.telegram_bot import TelegramBotUseCase

router = APIRouter(prefix="/v1/telegram", tags=["telegram"])

usecase = TelegramBotUseCase()


@router.get("/help")
def get_telegram_help() -> dict[str, str]:
    return {"message": build_help_message()}


@router.post("/webhook")
def telegram_webhook(
    update: dict[str, Any],
    x_telegram_bot_api_secret_token: Optional[str] = Header(
        default=None,
        alias="X-Telegram-Bot-Api-Secret-Token",
    ),
) -> dict[str, Any]:
    if settings.telegram_webhook_secret and x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
        raise HTTPException(status_code=403, detail="invalid telegram webhook secret")

    return usecase.handle_update(update)
