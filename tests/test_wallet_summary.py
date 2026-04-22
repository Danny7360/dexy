from fastapi.testclient import TestClient

from dexy.main import app


client = TestClient(app)


def test_wallet_summary_contains_risk_and_attribution() -> None:
    response = client.get("/v1/wallets/0xfe35dfb17f226a61d1f8f318990e6d27944d6002/summary")
    assert response.status_code == 200

    data = response.json()

    assert data["wallet_address"] == "0xfe35dfb17f226a61d1f8f318990e6d27944d6002"
    assert data["risk"]["most_at_risk_asset"] == "SP500"
    assert "Funding" in data["costs"]["top_cost_driver"] or "Fees" in data["costs"]["top_cost_driver"]
    assert data["attribution"]["one_line_summary"]
    assert data["operator_summary"]
