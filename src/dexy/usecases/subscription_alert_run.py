from __future__ import annotations

from typing import List, Optional

from dexy.adapters.subscriptions import WatchSubscriptionRepository
from dexy.adapters.telegram import TelegramBotClient
from dexy.domain.models import AlertEvent, SubscriptionRunResponse
from dexy.services.alerts import evaluate_wallet_alerts
from dexy.services.telegram import format_alert_scan_message
from dexy.usecases.wallet_summary import WalletSummaryUseCase


class SubscriptionAlertRunUseCase:
    def __init__(
        self,
        wallet_usecase: Optional[WalletSummaryUseCase] = None,
        telegram_client: Optional[TelegramBotClient] = None,
        subscription_repository: Optional[WatchSubscriptionRepository] = None,
    ) -> None:
        self.wallet_usecase = wallet_usecase or WalletSummaryUseCase()
        self.telegram_client = telegram_client or TelegramBotClient()
        self.subscription_repository = subscription_repository or WatchSubscriptionRepository()

    def execute(self) -> SubscriptionRunResponse:
        subscriptions = self.subscription_repository.list_all()
        all_alerts: List[AlertEvent] = []
        deliveries = 0

        for subscription in subscriptions:
            summary = self.wallet_usecase.execute(subscription.wallet_address)
            alerts = evaluate_wallet_alerts(summary, subscription.thresholds)
            if not alerts:
                continue

            all_alerts.extend(alerts)
            delivery = self.telegram_client.send_message(
                chat_id=subscription.chat_id,
                text=format_alert_scan_message(alerts, [summary]),
            )
            if delivery.get("ok") and not delivery.get("skipped"):
                deliveries += 1

        return SubscriptionRunResponse(
            subscriptions_scanned=len(subscriptions),
            triggered_alerts=all_alerts,
            telegram_deliveries=deliveries,
        )
