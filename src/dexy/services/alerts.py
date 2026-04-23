from __future__ import annotations

from typing import List, Optional

from dexy.domain.models import AlertEvent, AlertThresholds, Position, WalletSummary


def evaluate_wallet_alerts(summary: WalletSummary, thresholds: AlertThresholds) -> List[AlertEvent]:
    alerts: List[AlertEvent] = []

    liq_breach = _most_urgent_liquidation_position(summary.positions, thresholds.liquidation_distance_pct)
    if liq_breach is not None:
        severity = "critical" if (liq_breach.liquidation_distance_pct or 100) <= thresholds.liquidation_distance_pct / 2 else "high"
        alerts.append(
            AlertEvent(
                wallet_address=summary.wallet_address,
                severity=severity,
                category="liquidation",
                title=f"{liq_breach.asset} is nearing the liquidation threshold",
                body=(
                    f"{liq_breach.asset} {liq_breach.side} is down to "
                    f"{liq_breach.liquidation_distance_pct:.2f}% liquidation distance at "
                    f"{liq_breach.leverage:.1f}x {liq_breach.margin_mode}."
                ),
                asset=liq_breach.asset,
            )
        )

    if abs(summary.costs.total_funding_paid_usd) >= thresholds.funding_drag_usd:
        alerts.append(
            AlertEvent(
                wallet_address=summary.wallet_address,
                severity="medium",
                category="funding",
                title="Funding drag is becoming material",
                body=(
                    f"Carry costs have reached {abs(summary.costs.total_funding_paid_usd):,.0f} USD "
                    f"and are reducing realized edge."
                ),
                asset=summary.risk.most_at_risk_asset,
            )
        )

    if summary.risk.score >= thresholds.risk_score:
        severity = "critical" if summary.risk.score >= 85 else "high"
        alerts.append(
            AlertEvent(
                wallet_address=summary.wallet_address,
                severity=severity,
                category="risk",
                title=f"Wallet risk score is {summary.risk.score}/100",
                body=summary.risk.top_risk_driver,
                asset=summary.risk.most_at_risk_asset,
            )
        )

    return _dedupe_and_sort(alerts)


def _most_urgent_liquidation_position(
    positions: List[Position],
    liquidation_distance_threshold: float,
) -> Optional[Position]:
    in_range = [
        position
        for position in positions
        if position.liquidation_distance_pct is not None
        and position.liquidation_distance_pct <= liquidation_distance_threshold
    ]
    if not in_range:
        return None
    return min(in_range, key=lambda position: position.liquidation_distance_pct or 100)


def _dedupe_and_sort(alerts: List[AlertEvent]) -> List[AlertEvent]:
    severity_rank = {"critical": 0, "high": 1, "medium": 2}
    seen: set[tuple[str, str, str]] = set()
    unique: List[AlertEvent] = []
    for alert in alerts:
        key = (alert.wallet_address.lower(), alert.category, alert.asset or "")
        if key in seen:
            continue
        seen.add(key)
        unique.append(alert)

    return sorted(unique, key=lambda alert: (severity_rank[alert.severity], alert.wallet_address, alert.category))
