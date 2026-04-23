from __future__ import annotations

from typing import List, Optional

from dexy.adapters.telegram import TelegramBotClient
from dexy.domain.models import AlertEvent, AlertScanRequest, AlertScanResponse, WalletSummary
from dexy.services.alerts import evaluate_wallet_alerts
from dexy.services.telegram import format_alert_scan_message
from dexy.usecases.wallet_summary import WalletSummaryUseCase


class AlertScanUseCase:
    def __init__(
        self,
        wallet_usecase: Optional[WalletSummaryUseCase] = None,
        telegram_client: Optional[TelegramBotClient] = None,
    ) -> None:
        self.wallet_usecase = wallet_usecase or WalletSummaryUseCase()
        self.telegram_client = telegram_client or TelegramBotClient()

    def execute(self, request: AlertScanRequest) -> AlertScanResponse:
        summaries: List[WalletSummary] = []
        alerts: List[AlertEvent] = []

        for wallet in request.wallets:
            summary = self.wallet_usecase.execute(wallet_address=wallet)
            summaries.append(summary)
            alerts.extend(evaluate_wallet_alerts(summary, request.thresholds))

        telegram_delivery = None
        if request.telegram_chat_id and alerts:
            telegram_delivery = self.telegram_client.send_message(
                chat_id=request.telegram_chat_id,
                text=format_alert_scan_message(alerts, summaries),
            )

        return AlertScanResponse(
            wallets_scanned=len(request.wallets),
            triggered_alerts=alerts,
            telegram_delivery=telegram_delivery,
        )
