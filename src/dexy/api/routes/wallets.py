from fastapi import APIRouter

from dexy.domain.models import WalletSummary
from dexy.usecases.wallet_summary import WalletSummaryUseCase

router = APIRouter(prefix="/v1/wallets", tags=["wallets"])

usecase = WalletSummaryUseCase()


@router.get("/{wallet_address}/summary", response_model=WalletSummary)
def get_wallet_summary(wallet_address: str) -> WalletSummary:
    return usecase.execute(wallet_address=wallet_address)
