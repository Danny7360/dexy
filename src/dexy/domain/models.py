from typing import List, Literal, Optional

from pydantic import BaseModel, Field


PositionSide = Literal["long", "short"]
MarginMode = Literal["cross", "isolated"]
RiskLevel = Literal["low", "medium", "high", "critical"]
AlertSeverity = Literal["medium", "high", "critical"]


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
    operator_summary: str


class AlertThresholds(BaseModel):
    liquidation_distance_pct: float = Field(default=25, gt=0)
    funding_drag_usd: float = Field(default=5000, gt=0)
    risk_score: int = Field(default=60, ge=0, le=100)


class AlertEvent(BaseModel):
    wallet_address: str
    severity: AlertSeverity
    category: str
    title: str
    body: str
    asset: Optional[str] = None


class AlertScanRequest(BaseModel):
    wallets: List[str]
    thresholds: AlertThresholds = Field(default_factory=AlertThresholds)
    telegram_chat_id: Optional[int] = None


class AlertScanResponse(BaseModel):
    wallets_scanned: int
    triggered_alerts: List[AlertEvent]
    telegram_delivery: Optional[dict] = None


class WatchSubscription(BaseModel):
    chat_id: int
    wallet_address: str
    label: Optional[str] = None
    thresholds: AlertThresholds = Field(default_factory=AlertThresholds)


class WatchSubscriptionCreate(BaseModel):
    chat_id: int
    wallet_address: str
    label: Optional[str] = None
    thresholds: AlertThresholds = Field(default_factory=AlertThresholds)


class WatchSubscriptionDelete(BaseModel):
    chat_id: int
    wallet_address: str


class SubscriptionRunResponse(BaseModel):
    subscriptions_scanned: int
    triggered_alerts: List[AlertEvent]
    telegram_deliveries: int
