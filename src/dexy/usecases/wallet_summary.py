from typing import Optional

from dexy.adapters.hyperliquid import HyperliquidAdapter
from dexy.domain.models import WalletSummary
from dexy.services.attribution import build_attribution_summary, build_cost_breakdown
from dexy.services.risk import build_risk_summary


class WalletSummaryUseCase:
    def __init__(self, adapter: Optional[HyperliquidAdapter] = None) -> None:
        self.adapter = adapter or HyperliquidAdapter()

    def execute(self, wallet_address: str) -> WalletSummary:
        snapshot = self.adapter.get_wallet_snapshot(wallet_address=wallet_address)
        risk = build_risk_summary(snapshot)
        costs = build_cost_breakdown(snapshot)
        attribution = build_attribution_summary(snapshot, costs)

        return WalletSummary(
            wallet_address=snapshot.wallet_address,
            chain=snapshot.chain,
            positions=snapshot.positions,
            risk=risk,
            costs=costs,
            attribution=attribution,
        )
