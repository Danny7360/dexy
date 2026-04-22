from typing import Any, Dict, List, Optional

import httpx

from dexy.core.config import settings
from dexy.domain.models import Position, WalletSnapshot


class HyperliquidAdapter:
    """
    Official Hyperliquid read adapter with demo fallback.

    We use live public wallet state when available, and fall back to a
    deterministic demo snapshot when the wallet is empty or the request fails.
    """

    def __init__(
        self,
        api_url: Optional[str] = None,
        enable_demo_fallback: Optional[bool] = None,
    ) -> None:
        self.api_url = api_url or settings.hyperliquid_api_url
        self.enable_demo_fallback = (
            settings.enable_demo_data if enable_demo_fallback is None else enable_demo_fallback
        )

    def get_wallet_snapshot(self, wallet_address: str) -> WalletSnapshot:
        try:
            snapshot = self._fetch_live_snapshot(wallet_address=wallet_address)
            if snapshot.positions:
                return snapshot
        except Exception:
            if not self.enable_demo_fallback:
                raise

        if self.enable_demo_fallback:
            return self._build_demo_snapshot(wallet_address=wallet_address)

        return WalletSnapshot(wallet_address=wallet_address, positions=[])

    def _fetch_live_snapshot(self, wallet_address: str) -> WalletSnapshot:
        payload = {"type": "clearinghouseState", "user": wallet_address}

        with httpx.Client(timeout=15.0) as client:
            response = client.post(self.api_url, json=payload)
            response.raise_for_status()
            data = response.json()

        positions = [self._parse_position(item) for item in data.get("assetPositions", [])]
        return WalletSnapshot(wallet_address=wallet_address, positions=positions)

    def _parse_position(self, item: Dict[str, Any]) -> Position:
        position = item["position"]
        size = float(position["szi"])
        side = "long" if size >= 0 else "short"
        quantity = abs(size)
        value_usd = float(position["positionValue"])
        mark_price = value_usd / quantity if quantity else float(position["entryPx"])
        liq_px = float(position["liquidationPx"])

        return Position(
            asset=position["coin"],
            side=side,
            size=quantity,
            entry_price=float(position["entryPx"]),
            mark_price=mark_price,
            value_usd=value_usd,
            leverage=float(position["leverage"]["value"]),
            margin_mode="cross" if position["leverage"]["type"] == "cross" else "isolated",
            unrealized_pnl_usd=float(position["unrealizedPnl"]),
            funding_paid_usd=-float(position["cumFunding"]["sinceOpen"]),
            fees_paid_usd=0,
            liquidation_distance_pct=self._liquidation_distance_pct(mark_price=mark_price, liq_px=liq_px),
        )

    @staticmethod
    def _liquidation_distance_pct(mark_price: float, liq_px: float) -> float:
        if mark_price <= 0:
            return 0
        return round(abs(mark_price - liq_px) / mark_price * 100, 2)

    @staticmethod
    def _build_demo_snapshot(wallet_address: str) -> WalletSnapshot:
        demo_positions: List[Position] = [
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
