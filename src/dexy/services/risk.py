from dexy.domain.models import RiskSummary, WalletSnapshot


def build_risk_summary(snapshot: WalletSnapshot) -> RiskSummary:
    if not snapshot.positions:
        return RiskSummary(
            level="low",
            score=5,
            most_at_risk_asset=None,
            top_risk_driver="No open positions",
            what_to_watch_now="No active perp exposure.",
        )

    riskiest = max(
        snapshot.positions,
        key=lambda position: (
            position.leverage,
            -(position.liquidation_distance_pct or 100),
            abs(position.unrealized_pnl_usd),
        ),
    )

    liq_distance = riskiest.liquidation_distance_pct or 100
    score = int(min(100, riskiest.leverage * 2 + max(0, 50 - liq_distance)))

    if liq_distance <= 10 or riskiest.leverage >= 25:
        level = "critical"
    elif liq_distance <= 25 or riskiest.leverage >= 15:
        level = "high"
    elif liq_distance <= 50 or riskiest.leverage >= 8:
        level = "medium"
    else:
        level = "low"

    return RiskSummary(
        level=level,
        score=score,
        most_at_risk_asset=riskiest.asset,
        top_risk_driver=(
            f"{riskiest.asset} {riskiest.side} exposure is running at "
            f"{riskiest.leverage:.1f}x with {liq_distance:.0f}% liquidation distance."
        ),
        what_to_watch_now=(
            f"Watch {riskiest.asset} liquidation distance and leverage compression before "
            "adding more size."
        ),
    )
