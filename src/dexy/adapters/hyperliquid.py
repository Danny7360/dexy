from dexy.domain.models import Position, WalletSnapshot


class HyperliquidAdapter:
    """
    Placeholder adapter.

    Phase 1 uses deterministic demo snapshots so the API, frontend, and alert
    logic can be built before wiring real Hyperliquid reads.
    """

    def get_wallet_snapshot(self, wallet_address: str) -> WalletSnapshot:
        demo_positions = [
            Position(
                asset="SP500",
                side="short",
                size=2730.224,
                entry_price=6972.036,
                mark_price=7104.85,
                value_usd=19_400_000,
                leverage=18.0,
                margin_mode="isolated",
                unrealized_pnl_usd=-362_746.06,
                funding_paid_usd=-52_277.06,
                fees_paid_usd=-1_240.00,
                liquidation_distance_pct=43,
            )
        ]
        return WalletSnapshot(wallet_address=wallet_address, positions=demo_positions)
