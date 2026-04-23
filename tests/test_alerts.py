from fastapi.testclient import TestClient

from dexy.main import app


client = TestClient(app)


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
