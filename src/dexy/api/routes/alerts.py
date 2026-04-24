from fastapi import APIRouter, Query

from dexy.adapters.subscriptions import WatchSubscriptionRepository
from dexy.domain.models import (
    AlertScanRequest,
    AlertScanResponse,
    SubscriptionRunResponse,
    WatchSubscription,
    WatchSubscriptionCreate,
)
from dexy.usecases.alert_scan import AlertScanUseCase
from dexy.usecases.subscription_alert_run import SubscriptionAlertRunUseCase

router = APIRouter(prefix="/v1/alerts", tags=["alerts"])

usecase = AlertScanUseCase()
subscription_repository = WatchSubscriptionRepository()
subscription_runner = SubscriptionAlertRunUseCase(subscription_repository=subscription_repository)


@router.post("/scan", response_model=AlertScanResponse)
def scan_alerts(request: AlertScanRequest) -> AlertScanResponse:
    return usecase.execute(request)


@router.get("/subscriptions", response_model=list[WatchSubscription])
def list_subscriptions(chat_id: int = Query(...)) -> list[WatchSubscription]:
    return subscription_repository.list_by_chat(chat_id)


@router.post("/subscriptions", response_model=WatchSubscription)
def create_subscription(request: WatchSubscriptionCreate) -> WatchSubscription:
    return subscription_repository.upsert(
        WatchSubscription(
            chat_id=request.chat_id,
            wallet_address=request.wallet_address,
            label=request.label,
            thresholds=request.thresholds,
        )
    )


@router.delete("/subscriptions")
def delete_subscription(chat_id: int = Query(...), wallet_address: str = Query(...)) -> dict[str, bool]:
    deleted = subscription_repository.delete(chat_id=chat_id, wallet_address=wallet_address)
    return {"deleted": deleted}


@router.post("/subscriptions/run", response_model=SubscriptionRunResponse)
def run_subscription_alerts() -> SubscriptionRunResponse:
    return subscription_runner.execute()
