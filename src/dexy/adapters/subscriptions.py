from __future__ import annotations

import os
import sqlite3
from typing import List, Optional

from dexy.core.config import settings
from dexy.domain.models import AlertThresholds, WatchSubscription


class WatchSubscriptionRepository:
    def __init__(self, db_path: Optional[str] = None) -> None:
        self.db_path = db_path or settings.subscriptions_db_path
        self._ensure_ready()

    def list_all(self) -> List[WatchSubscription]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT chat_id, wallet_address, label, liq_threshold, funding_threshold, risk_threshold
                FROM watch_subscriptions
                ORDER BY chat_id, wallet_address
                """
            ).fetchall()
        return [self._row_to_subscription(row) for row in rows]

    def list_by_chat(self, chat_id: int) -> List[WatchSubscription]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT chat_id, wallet_address, label, liq_threshold, funding_threshold, risk_threshold
                FROM watch_subscriptions
                WHERE chat_id = ?
                ORDER BY wallet_address
                """,
                (chat_id,),
            ).fetchall()
        return [self._row_to_subscription(row) for row in rows]

    def upsert(self, subscription: WatchSubscription) -> WatchSubscription:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO watch_subscriptions (
                    chat_id, wallet_address, label, liq_threshold, funding_threshold, risk_threshold
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(chat_id, wallet_address) DO UPDATE SET
                    label = excluded.label,
                    liq_threshold = excluded.liq_threshold,
                    funding_threshold = excluded.funding_threshold,
                    risk_threshold = excluded.risk_threshold
                """,
                (
                    subscription.chat_id,
                    subscription.wallet_address.lower(),
                    subscription.label,
                    subscription.thresholds.liquidation_distance_pct,
                    subscription.thresholds.funding_drag_usd,
                    subscription.thresholds.risk_score,
                ),
            )
        return subscription

    def delete(self, chat_id: int, wallet_address: str) -> bool:
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM watch_subscriptions WHERE chat_id = ? AND wallet_address = ?",
                (chat_id, wallet_address.lower()),
            )
            return cursor.rowcount > 0

    def clear_all(self) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM watch_subscriptions")

    def _ensure_ready(self) -> None:
        directory = os.path.dirname(self.db_path)
        if directory:
            os.makedirs(directory, exist_ok=True)

        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS watch_subscriptions (
                    chat_id INTEGER NOT NULL,
                    wallet_address TEXT NOT NULL,
                    label TEXT,
                    liq_threshold REAL NOT NULL,
                    funding_threshold REAL NOT NULL,
                    risk_threshold INTEGER NOT NULL,
                    PRIMARY KEY (chat_id, wallet_address)
                )
                """
            )

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def _row_to_subscription(row: sqlite3.Row) -> WatchSubscription:
        return WatchSubscription(
            chat_id=int(row["chat_id"]),
            wallet_address=row["wallet_address"],
            label=row["label"],
            thresholds=AlertThresholds(
                liquidation_distance_pct=float(row["liq_threshold"]),
                funding_drag_usd=float(row["funding_threshold"]),
                risk_score=int(row["risk_threshold"]),
            ),
        )
