from fastapi import APIRouter

from dexy.domain.models import AlertScanRequest, AlertScanResponse
from dexy.usecases.alert_scan import AlertScanUseCase

router = APIRouter(prefix="/v1/alerts", tags=["alerts"])

usecase = AlertScanUseCase()


@router.post("/scan", response_model=AlertScanResponse)
def scan_alerts(request: AlertScanRequest) -> AlertScanResponse:
    return usecase.execute(request)
