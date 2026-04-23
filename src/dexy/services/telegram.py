from __future__ import annotations

import re
from typing import List, Literal, Optional

from dexy.domain.models import Position, WalletSummary


CommandName = Literal["start", "help", "wallet", "risk", "watch", "unknown"]

ADDRESS_PATTERN = re.compile(r"0x[a-fA-F0-9]{40}")


def parse_command(text: str) -> tuple[CommandName, list[str]]:
    raw = (text or "").strip()
    if not raw:
        return "unknown", []

    parts = raw.split()
    command = parts[0].lower().split("@")[0]
    args = parts[1:]

    mapping: dict[str, CommandName] = {
        "/start": "start",
        "/help": "help",
        "/wallet": "wallet",
        "/risk": "risk",
        "/watch": "watch",
    }
    return mapping.get(command, "unknown"), args


def extract_wallet_argument(args: List[str]) -> Optional[str]:
    for value in args:
        if ADDRESS_PATTERN.fullmatch(value.strip()):
            return value.strip()
    return None


def build_help_message() -> str:
    return "\n".join(
        [
            "Dexy bot commands",
            "",
            "/wallet <address>  Full wallet risk + carry readout",
            "/risk <address>    Compact risk triage summary",
            "/watch <address>   Watchlist command placeholder",
            "/help              Show commands",
            "",
            "Example:",
            "/wallet 0xfe35dfb17f226a61d1f8f318990e6d27944d6002",
        ]
    )


def format_wallet_summary(summary: WalletSummary) -> str:
    lines = [
        "Dexy wallet readout",
        f"Wallet: {summary.wallet_address}",
        f"Risk: {summary.risk.level.upper()} ({summary.risk.score}/100)",
        f"Most at risk: {summary.risk.most_at_risk_asset or 'n/a'}",
        f"Top cost driver: {summary.costs.top_cost_driver}",
        f"Funding drag: {_format_usd(summary.costs.total_funding_paid_usd)}",
        f"Unrealized PnL: {_format_usd(summary.costs.total_unrealized_pnl_usd)}",
        f"What to watch: {summary.risk.what_to_watch_now}",
        "",
        summary.operator_summary,
    ]

    positions = _sorted_positions(summary.positions)[:3]
    if positions:
        lines.extend(["", "Top positions:"])
        for position in positions:
            lines.append(_format_position_line(position))

    return "\n".join(lines)


def format_risk_summary(summary: WalletSummary) -> str:
    return "\n".join(
        [
            "Dexy risk triage",
            f"Wallet: {summary.wallet_address}",
            f"Risk: {summary.risk.level.upper()} ({summary.risk.score}/100)",
            f"Most at risk: {summary.risk.most_at_risk_asset or 'n/a'}",
            f"Top driver: {summary.risk.top_risk_driver}",
            f"What to watch: {summary.risk.what_to_watch_now}",
            f"Funding drag: {_format_usd(summary.costs.total_funding_paid_usd)}",
        ]
    )


def build_watch_placeholder(wallet_address: str) -> str:
    return "\n".join(
        [
            f"Watchlist capture noted for {wallet_address}.",
            "Persistent Telegram alerts are the next step; this MVP currently supports command-based reads.",
        ]
    )


def _sorted_positions(positions: list[Position]) -> list[Position]:
    return sorted(positions, key=lambda position: position.value_usd, reverse=True)


def _format_position_line(position: Position) -> str:
    liquidation = (
        f"{position.liquidation_distance_pct:.2f}% liq"
        if position.liquidation_distance_pct is not None
        else "liq n/a"
    )
    return (
        f"- {position.asset} {position.side} | {_format_usd(position.value_usd)} | "
        f"{position.leverage:.1f}x {position.margin_mode} | {liquidation} | "
        f"UPNL {_format_usd(position.unrealized_pnl_usd)} | funding {_format_usd(position.funding_paid_usd)}"
    )


def _format_usd(value: float) -> str:
    sign = "-" if value < 0 else ""
    return f"{sign}${abs(value):,.0f}"
