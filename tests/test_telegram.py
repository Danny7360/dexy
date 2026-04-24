from fastapi.testclient import TestClient

from dexy.adapters.subscriptions import WatchSubscriptionRepository
from dexy.main import app


client = TestClient(app)
repository = WatchSubscriptionRepository()


def setup_function() -> None:
    repository.clear_all()


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


def test_telegram_watch_and_unwatch_manage_subscription_state() -> None:
    watch_update = {
        "message": {
            "chat": {"id": 123456},
            "text": "/watch 0xfe35dfb17f226a61d1f8f318990e6d27944d6002",
        }
    }

    watch_response = client.post("/v1/telegram/webhook", json=watch_update)
    assert watch_response.status_code == 200
    assert "Dexy is now watching" in watch_response.json()["reply_text"]

    subscriptions = repository.list_by_chat(123456)
    assert len(subscriptions) == 1
    assert subscriptions[0].wallet_address == "0xfe35dfb17f226a61d1f8f318990e6d27944d6002"

    unwatch_update = {
        "message": {
            "chat": {"id": 123456},
            "text": "/unwatch 0xfe35dfb17f226a61d1f8f318990e6d27944d6002",
        }
    }

    unwatch_response = client.post("/v1/telegram/webhook", json=unwatch_update)
    assert unwatch_response.status_code == 200
    assert "stopped watching" in unwatch_response.json()["reply_text"]
    assert repository.list_by_chat(123456) == []
