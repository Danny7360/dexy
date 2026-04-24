from fastapi.testclient import TestClient

from dexy.adapters.subscriptions import WatchSubscriptionRepository
from dexy.main import app


client = TestClient(app)
repository = WatchSubscriptionRepository()


def setup_function() -> None:
    repository.clear_all()


def test_alert_scan_returns_triggered_alerts_for_risky_wallet() -> None:
    payload = {
        "wallets": ["0xfe35dfb17f226a61d1f8f318990e6d27944d6002"],
        "thresholds": {
            "liquidation_distance_pct": 50,
            "funding_drag_usd": 5000,
            "risk_score": 40,
        },
    }

    response = client.post("/v1/alerts/scan", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["wallets_scanned"] == 1
    assert len(data["triggered_alerts"]) >= 2
    categories = {item["category"] for item in data["triggered_alerts"]}
    assert "liquidation" in categories
    assert "risk" in categories


def test_alert_scan_can_skip_delivery_when_chat_id_missing() -> None:
    payload = {
        "wallets": ["0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab"],
    }

    response = client.post("/v1/alerts/scan", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["wallets_scanned"] == 1
    assert data["telegram_delivery"] is None


def test_subscription_run_scans_saved_wallets() -> None:
    create_response = client.post(
        "/v1/alerts/subscriptions",
        json={
            "chat_id": 123456,
            "wallet_address": "0xfe35dfb17f226a61d1f8f318990e6d27944d6002",
        },
    )
    assert create_response.status_code == 200

    run_response = client.post("/v1/alerts/subscriptions/run")
    assert run_response.status_code == 200

    data = run_response.json()
    assert data["subscriptions_scanned"] == 1
    assert len(data["triggered_alerts"]) >= 1
    assert data["telegram_deliveries"] == 0
