from __future__ import annotations

from typing import Any, Dict, Optional

from dexy.adapters.telegram import TelegramBotClient
from dexy.services.telegram import (
    build_help_message,
    build_watch_placeholder,
    extract_wallet_argument,
    format_risk_summary,
    format_wallet_summary,
    parse_command,
)
from dexy.usecases.wallet_summary import WalletSummaryUseCase


class TelegramBotUseCase:
    def __init__(
        self,
        wallet_usecase: Optional[WalletSummaryUseCase] = None,
        telegram_client: Optional[TelegramBotClient] = None,
    ) -> None:
        self.wallet_usecase = wallet_usecase or WalletSummaryUseCase()
        self.telegram_client = telegram_client or TelegramBotClient()

    def handle_update(self, update: Dict[str, Any]) -> Dict[str, Any]:
        message = update.get("message") or {}
        chat = message.get("chat") or {}
        text = message.get("text") or ""
        chat_id = chat.get("id")

        if not text or not chat_id:
            return {"ok": True, "handled": False, "reason": "unsupported update payload"}

        reply_text = self.build_reply(text=text)
        delivery = self.telegram_client.send_message(chat_id=int(chat_id), text=reply_text)
        return {"ok": True, "handled": True, "reply_text": reply_text, "delivery": delivery}

    def build_reply(self, text: str) -> str:
        command, args = parse_command(text)
        wallet_address = extract_wallet_argument(args)

        if command in {"start", "help"}:
            return build_help_message()

        if command == "unknown":
            return "\n".join(
                [
                    "Dexy did not understand that command.",
                    build_help_message(),
                ]
            )

        if not wallet_address:
            return "\n".join(
                [
                    "Please include a Hyperliquid wallet address.",
                    build_help_message(),
                ]
            )

        if command == "watch":
            return build_watch_placeholder(wallet_address)

        summary = self.wallet_usecase.execute(wallet_address=wallet_address)

        if command == "risk":
            return format_risk_summary(summary)

        return format_wallet_summary(summary)
