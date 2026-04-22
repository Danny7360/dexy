from typing import List, Literal, Optional

from pydantic import BaseModel, Field


PositionSide = Literal["long", "short"]
MarginMode = Literal["cross", "isolated"]
RiskLevel = Literal["low", "medium", "high", "critical"]


class Position(BaseModel):
    asset: str
    side: PositionSide
    size: float = Field(description="Position size in asset units.")
    entry_price: float
    mark_price: float
    value_usd: float
    leverage: float
    margin_mode: MarginMode
    unrealized_pnl_usd: float
    funding_paid_usd: float = 0
    fees_paid_usd: float = 0
    liquidation_distance_pct: Optional[float] = None


class WalletSnapshot(BaseModel):
    wallet_address: str
    chain: str = "hyperliquid"
    positions: List[Position]


class RiskSummary(BaseModel):
    level: RiskLevel
    score: int = Field(ge=0, le=100)
    most_at_risk_asset: Optional[str] = None
    top_risk_driver: str
    what_to_watch_now: str


class CostBreakdown(BaseModel):
    total_unrealized_pnl_usd: float
    total_funding_paid_usd: float
    total_fees_paid_usd: float
    top_cost_driver: str


class AttributionSummary(BaseModel):
    primary_driver: str
    secondary_driver: Optional[str] = None
    one_line_summary: str


class WalletSummary(BaseModel):
    wallet_address: str
    chain: str
    positions: List[Position]
    risk: RiskSummary
    costs: CostBreakdown
    attribution: AttributionSummary
