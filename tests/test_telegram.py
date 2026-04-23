from fastapi.testclient import TestClient

from dexy.main import app


client = TestClient(app)


def test_telegram_help_route_returns_commands() -> None:
    response = client.get("/v1/telegram/help")
    assert response.status_code == 200
    assert "/wallet <address>" in response.json()["message"]


def test_telegram_webhook_returns_wallet_summary_preview_without_bot_token() -> None:
    update = {
        "message": {
            "chat": {"id": 123456},
            "text": "/risk 0xfe35dfb17f226a61d1f8f318990e6d27944d6002",
        }
    }

    response = client.post("/v1/telegram/webhook", json=update)
    assert response.status_code == 200

    data = response.json()
    assert data["handled"] is True
    assert "Dexy risk triage" in data["reply_text"]
    assert data["delivery"]["skipped"] is True


def test_telegram_webhook_prompts_for_wallet_when_missing() -> None:
    update = {
        "message": {
            "chat": {"id": 123456},
            "text": "/wallet",
        }
    }

    response = client.post("/v1/telegram/webhook", json=update)
    assert response.status_code == 200
    assert "Please include a Hyperliquid wallet address." in response.json()["reply_text"]
