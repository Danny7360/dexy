from dexy.domain.models import AttributionSummary, CostBreakdown, WalletSnapshot


def build_cost_breakdown(snapshot: WalletSnapshot) -> CostBreakdown:
    total_unrealized = sum(position.unrealized_pnl_usd for position in snapshot.positions)
    total_funding = sum(position.funding_paid_usd for position in snapshot.positions)
    total_fees = sum(position.fees_paid_usd for position in snapshot.positions)

    top_cost_driver = "Funding drag"
    if abs(total_fees) > abs(total_funding):
        top_cost_driver = "Fees drag"

    return CostBreakdown(
        total_unrealized_pnl_usd=total_unrealized,
        total_funding_paid_usd=total_funding,
        total_fees_paid_usd=total_fees,
        top_cost_driver=top_cost_driver,
    )


def build_attribution_summary(snapshot: WalletSnapshot, costs: CostBreakdown) -> AttributionSummary:
    if not snapshot.positions:
        return AttributionSummary(
            primary_driver="No active positions",
            one_line_summary="No open perp positions to attribute.",
        )

    main_position = max(snapshot.positions, key=lambda position: abs(position.value_usd))
    direction_driver = (
        "Direction is favorable"
        if main_position.unrealized_pnl_usd >= 0
        else "Direction is unfavorable"
    )
    carry_driver = "Funding is eating into returns" if costs.total_funding_paid_usd < 0 else None

    if main_position.unrealized_pnl_usd < 0:
        one_line = (
            f"{main_position.asset} {main_position.side} exposure is losing money from directional "
            "pressure, with leverage and carrying costs amplifying the drawdown."
        )
    else:
        one_line = (
            f"{main_position.asset} {main_position.side} exposure is profitable, but carrying costs "
            "are reducing realized edge."
        )

    return AttributionSummary(
        primary_driver=direction_driver,
        secondary_driver=carry_driver,
        one_line_summary=one_line,
    )
