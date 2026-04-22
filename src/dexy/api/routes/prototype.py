from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from dexy.core.config import settings

router = APIRouter(tags=["prototype"])


@router.get("/prototype", response_class=HTMLResponse)
def prototype() -> str:
    default_wallet = settings.prototype_default_wallet
    return f"""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dexy Prototype</title>
    <style>
      :root {{
        color-scheme: dark;
        --bg: #0a0d12;
        --panel: #121923;
        --muted: #90a3b9;
        --text: #eef5ff;
        --accent: #60d394;
        --danger: #ff7a7a;
        --warning: #ffbd59;
        --border: #223045;
      }}
      body {{
        margin: 0;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #0a0d12 0%, #0f1520 100%);
        color: var(--text);
      }}
      .wrap {{
        max-width: 1100px;
        margin: 0 auto;
        padding: 40px 20px 80px;
      }}
      .hero {{
        margin-bottom: 24px;
      }}
      .hero h1 {{
        margin: 0 0 8px;
        font-size: 32px;
      }}
      .hero p {{
        margin: 0;
        color: var(--muted);
        max-width: 760px;
        line-height: 1.55;
      }}
      .input-row {{
        display: flex;
        gap: 12px;
        margin: 24px 0;
      }}
      input {{
        flex: 1;
        background: var(--panel);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 14px 16px;
        border-radius: 14px;
        font-size: 15px;
      }}
      button {{
        background: var(--text);
        color: #0d131c;
        border: none;
        padding: 14px 18px;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
      }}
      .grid {{
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }}
      .card {{
        background: rgba(18, 25, 35, 0.92);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 18px;
      }}
      .label {{
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 10px;
      }}
      .value {{
        font-size: 28px;
        font-weight: 800;
      }}
      .good {{ color: var(--accent); }}
      .bad {{ color: var(--danger); }}
      .warn {{ color: var(--warning); }}
      .full {{
        grid-column: 1 / -1;
      }}
      .summary {{
        font-size: 18px;
        line-height: 1.6;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
      }}
      th, td {{
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid var(--border);
      }}
      th {{
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
      }}
      .footer {{
        color: var(--muted);
        margin-top: 18px;
        font-size: 13px;
      }}
      @media (max-width: 860px) {{
        .grid {{
          grid-template-columns: 1fr 1fr;
        }}
      }}
      @media (max-width: 560px) {{
        .grid {{
          grid-template-columns: 1fr;
        }}
        .input-row {{
          flex-direction: column;
        }}
      }}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="hero">
        <h1>Dexy Prototype</h1>
        <p>
          Hyperliquid-first wallet risk attribution and event alert layer.
          This prototype focuses on the first operator question: which open position is most dangerous right now, and what is eating into PnL?
        </p>
      </div>

      <div class="input-row">
        <input id="wallet" value="{default_wallet}" />
        <button onclick="loadWallet()">Load wallet</button>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Risk Level</div>
          <div id="risk-level" class="value warn">-</div>
        </div>
        <div class="card">
          <div class="label">Risk Score</div>
          <div id="risk-score" class="value">-</div>
        </div>
        <div class="card">
          <div class="label">Most At Risk</div>
          <div id="risk-asset" class="value">-</div>
        </div>
        <div class="card">
          <div class="label">Top Cost Driver</div>
          <div id="cost-driver" class="value">-</div>
        </div>

        <div class="card full">
          <div class="label">Operator Summary</div>
          <div id="operator-summary" class="summary">Loading...</div>
        </div>

        <div class="card">
          <div class="label">Unrealized PnL</div>
          <div id="unrealized-pnl" class="value">-</div>
        </div>
        <div class="card">
          <div class="label">Funding Drag</div>
          <div id="funding-drag" class="value">-</div>
        </div>
        <div class="card">
          <div class="label">Primary Driver</div>
          <div id="primary-driver" class="value">-</div>
        </div>
        <div class="card">
          <div class="label">What To Watch</div>
          <div id="watch-now" class="summary">-</div>
        </div>

        <div class="card full">
          <div class="label">Open Positions</div>
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Side</th>
                <th>Value</th>
                <th>Leverage</th>
                <th>Liq Distance</th>
                <th>UPnL</th>
                <th>Funding</th>
              </tr>
            </thead>
            <tbody id="positions"></tbody>
          </table>
          <div class="footer">Live wallet data is pulled from Hyperliquid when available; demo fallback is used for empty or unavailable wallets.</div>
        </div>
      </div>
    </div>

    <script>
      function money(n) {{
        const value = Number(n || 0);
        return new Intl.NumberFormat("en-US", {{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}).format(value);
      }}

      function pct(n) {{
        return `${{Number(n || 0).toFixed(2)}}%`;
      }}

      function setText(id, value, className) {{
        const el = document.getElementById(id);
        el.textContent = value;
        el.className = className ? `value ${{className}}` : el.className;
      }}

      async function loadWallet() {{
        const wallet = document.getElementById("wallet").value.trim();
        const res = await fetch(`/v1/wallets/${{wallet}}/summary`);
        const data = await res.json();

        setText("risk-level", data.risk.level.toUpperCase(), data.risk.level === "critical" || data.risk.level === "high" ? "bad" : data.risk.level === "medium" ? "warn" : "good");
        setText("risk-score", data.risk.score);
        setText("risk-asset", data.risk.most_at_risk_asset || "-");
        setText("cost-driver", data.costs.top_cost_driver);
        document.getElementById("operator-summary").textContent = data.operator_summary;
        setText("unrealized-pnl", money(data.costs.total_unrealized_pnl_usd), data.costs.total_unrealized_pnl_usd >= 0 ? "good" : "bad");
        setText("funding-drag", money(data.costs.total_funding_paid_usd), data.costs.total_funding_paid_usd >= 0 ? "good" : "bad");
        setText("primary-driver", data.attribution.primary_driver);
        document.getElementById("watch-now").textContent = data.risk.what_to_watch_now;

        const tbody = document.getElementById("positions");
        tbody.innerHTML = "";
        for (const position of data.positions) {{
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{position.asset}}</td>
            <td>${{position.side}}</td>
            <td>${{money(position.value_usd)}}</td>
            <td>${{position.leverage}}x / ${{position.margin_mode}}</td>
            <td>${{pct(position.liquidation_distance_pct)}}</td>
            <td class="${{position.unrealized_pnl_usd >= 0 ? "good" : "bad"}}">${{money(position.unrealized_pnl_usd)}}</td>
            <td class="${{position.funding_paid_usd >= 0 ? "good" : "bad"}}">${{money(position.funding_paid_usd)}}</td>
          `;
          tbody.appendChild(row);
        }}
      }}

      loadWallet();
    </script>
  </body>
</html>
"""
