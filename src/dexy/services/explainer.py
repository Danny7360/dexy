from dexy.domain.models import AttributionSummary, RiskSummary


def build_operator_summary(risk: RiskSummary, attribution: AttributionSummary) -> str:
    return (
        f"Risk is {risk.level.upper()} ({risk.score}/100). "
        f"{risk.top_risk_driver} {attribution.one_line_summary}"
    )
