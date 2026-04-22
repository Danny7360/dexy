const DEFAULT_WALLET = "0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab";
const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function pct(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function liquidationDistancePct(markPrice, liquidationPx) {
  const mark = Number(markPrice || 0);
  const liq = Number(liquidationPx || 0);
  if (!mark) return 0;
  return Number((Math.abs(mark - liq) / mark * 100).toFixed(2));
}

function parsePosition(item) {
  const p = item.position;
  const rawSize = Number(p.szi);
  const size = Math.abs(rawSize);
  const valueUsd = Number(p.positionValue);
  const markPrice = size ? valueUsd / size : Number(p.entryPx);

  return {
    asset: p.coin,
    side: rawSize >= 0 ? "long" : "short",
    size,
    entry_price: Number(p.entryPx),
    mark_price: markPrice,
    value_usd: valueUsd,
    leverage: Number(p.leverage.value),
    margin_mode: p.leverage.type === "cross" ? "cross" : "isolated",
    unrealized_pnl_usd: Number(p.unrealizedPnl),
    funding_paid_usd: -Number(p.cumFunding?.sinceOpen || 0),
    fees_paid_usd: 0,
    liquidation_distance_pct: liquidationDistancePct(markPrice, p.liquidationPx),
  };
}

function riskSummary(positions) {
  if (!positions.length) {
    return {
      level: "low",
      score: 5,
      most_at_risk_asset: null,
      top_risk_driver: "No open positions",
      what_to_watch_now: "No active perp exposure.",
    };
  }

  const riskiest = [...positions].sort((a, b) => {
    const aScore = a.leverage * 100 - (a.liquidation_distance_pct ?? 100);
    const bScore = b.leverage * 100 - (b.liquidation_distance_pct ?? 100);
    return bScore - aScore;
  })[0];

  const liqDistance = riskiest.liquidation_distance_pct ?? 100;
  const score = Math.min(100, Math.round(riskiest.leverage * 2 + Math.max(0, 50 - liqDistance)));

  let level = "low";
  if (liqDistance <= 10 || riskiest.leverage >= 25) level = "critical";
  else if (liqDistance <= 25 || riskiest.leverage >= 15) level = "high";
  else if (liqDistance <= 50 || riskiest.leverage >= 8) level = "medium";

  return {
    level,
    score,
    most_at_risk_asset: riskiest.asset,
    top_risk_driver: `${riskiest.asset} ${riskiest.side} exposure is running at ${riskiest.leverage.toFixed(1)}x with ${liqDistance}% liquidation distance.`,
    what_to_watch_now: `Watch ${riskiest.asset} liquidation distance and leverage compression before adding more size.`,
  };
}

function costBreakdown(positions) {
  const totalUnrealized = positions.reduce((sum, p) => sum + Number(p.unrealized_pnl_usd || 0), 0);
  const totalFunding = positions.reduce((sum, p) => sum + Number(p.funding_paid_usd || 0), 0);
  const totalFees = positions.reduce((sum, p) => sum + Number(p.fees_paid_usd || 0), 0);

  return {
    total_unrealized_pnl_usd: totalUnrealized,
    total_funding_paid_usd: totalFunding,
    total_fees_paid_usd: totalFees,
    top_cost_driver: Math.abs(totalFees) > Math.abs(totalFunding) ? "Fees drag" : "Funding drag",
  };
}

function attributionSummary(positions, costs) {
  if (!positions.length) {
    return {
      primary_driver: "No active positions",
      secondary_driver: null,
      one_line_summary: "No open perp positions to attribute.",
    };
  }

  const main = [...positions].sort((a, b) => Math.abs(b.value_usd) - Math.abs(a.value_usd))[0];
  const primary = main.unrealized_pnl_usd >= 0 ? "Direction is favorable" : "Direction is unfavorable";
  const secondary = costs.total_funding_paid_usd < 0 ? "Funding is eating into returns" : null;

  const oneLine =
    main.unrealized_pnl_usd >= 0
      ? `${main.asset} ${main.side} exposure is profitable, but carrying costs are reducing realized edge.`
      : `${main.asset} ${main.side} exposure is losing money from directional pressure, with leverage and carrying costs amplifying the drawdown.`;

  return {
    primary_driver: primary,
    secondary_driver: secondary,
    one_line_summary: oneLine,
  };
}

function buildSummary(wallet, positions) {
  const risk = riskSummary(positions);
  const costs = costBreakdown(positions);
  const attribution = attributionSummary(positions, costs);
  return {
    wallet_address: wallet,
    chain: "hyperliquid",
    positions,
    risk,
    costs,
    attribution,
    operator_summary: `Risk is ${risk.level.toUpperCase()} (${risk.score}/100). ${risk.top_risk_driver} ${attribution.one_line_summary}`,
  };
}

async function getWalletSummary(wallet) {
  const response = await fetch(HL_INFO_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "clearinghouseState", user: wallet }),
  });
  const data = await response.json();
  const positions = (data.assetPositions || []).map(parsePosition);
  return buildSummary(wallet, positions);
}

function html() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dexy Prototype</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0a0d12;
        --panel: #121923;
        --muted: #90a3b9;
        --text: #eef5ff;
        --accent: #60d394;
        --danger: #ff7a7a;
        --warning: #ffbd59;
        --border: #223045;
      }
      body {
        margin: 0;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #0a0d12 0%, #0f1520 100%);
        color: var(--text);
      }
      .wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 40px 20px 80px;
      }
      .hero h1 { margin: 0 0 8px; font-size: 32px; }
      .hero p { margin: 0; color: var(--muted); max-width: 760px; line-height: 1.55; }
      .input-row { display: flex; gap: 12px; margin: 24px 0; }
      input {
        flex: 1; background: var(--panel); border: 1px solid var(--border); color: var(--text);
        padding: 14px 16px; border-radius: 14px; font-size: 15px;
      }
      button {
        background: var(--text); color: #0d131c; border: none; padding: 14px 18px;
        border-radius: 14px; font-weight: 700; cursor: pointer;
      }
      .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
      .card { background: rgba(18, 25, 35, 0.92); border: 1px solid var(--border); border-radius: 18px; padding: 18px; }
      .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
      .value { font-size: 28px; font-weight: 800; }
      .good { color: var(--accent); } .bad { color: var(--danger); } .warn { color: var(--warning); }
      .full { grid-column: 1 / -1; }
      .summary { font-size: 18px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid var(--border); }
      th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
      .footer { color: var(--muted); margin-top: 18px; font-size: 13px; }
      @media (max-width: 860px) { .grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } .input-row { flex-direction: column; } }
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
        <input id="wallet" value="${DEFAULT_WALLET}" />
        <button onclick="loadWallet()">Load wallet</button>
      </div>

      <div class="grid">
        <div class="card"><div class="label">Risk Level</div><div id="risk-level" class="value warn">-</div></div>
        <div class="card"><div class="label">Risk Score</div><div id="risk-score" class="value">-</div></div>
        <div class="card"><div class="label">Most At Risk</div><div id="risk-asset" class="value">-</div></div>
        <div class="card"><div class="label">Top Cost Driver</div><div id="cost-driver" class="value">-</div></div>
        <div class="card full"><div class="label">Operator Summary</div><div id="operator-summary" class="summary">Loading...</div></div>
        <div class="card"><div class="label">Unrealized PnL</div><div id="unrealized-pnl" class="value">-</div></div>
        <div class="card"><div class="label">Funding Drag</div><div id="funding-drag" class="value">-</div></div>
        <div class="card"><div class="label">Primary Driver</div><div id="primary-driver" class="value">-</div></div>
        <div class="card"><div class="label">What To Watch</div><div id="watch-now" class="summary">-</div></div>
        <div class="card full">
          <div class="label">Open Positions</div>
          <table>
            <thead><tr><th>Asset</th><th>Side</th><th>Value</th><th>Leverage</th><th>Liq Distance</th><th>UPnL</th><th>Funding</th></tr></thead>
            <tbody id="positions"></tbody>
          </table>
          <div class="footer">This is the Cloudflare-hosted prototype layer for Dexy.</div>
        </div>
      </div>
    </div>
    <script>
      function setText(id, value, cls) {
        const el = document.getElementById(id);
        el.textContent = value;
        if (cls) el.className = "value " + cls;
      }

      async function loadWallet() {
        const wallet = document.getElementById("wallet").value.trim();
        const res = await fetch("/api/wallet?address=" + encodeURIComponent(wallet));
        const data = await res.json();

        setText("risk-level", data.risk.level.toUpperCase(), data.risk.level === "critical" || data.risk.level === "high" ? "bad" : data.risk.level === "medium" ? "warn" : "good");
        setText("risk-score", data.risk.score);
        setText("risk-asset", data.risk.most_at_risk_asset || "-");
        setText("cost-driver", data.costs.top_cost_driver);
        document.getElementById("operator-summary").textContent = data.operator_summary;
        setText("unrealized-pnl", ${money.toString()}(data.costs.total_unrealized_pnl_usd), data.costs.total_unrealized_pnl_usd >= 0 ? "good" : "bad");
        setText("funding-drag", ${money.toString()}(data.costs.total_funding_paid_usd), data.costs.total_funding_paid_usd >= 0 ? "good" : "bad");
        setText("primary-driver", data.attribution.primary_driver);
        document.getElementById("watch-now").textContent = data.risk.what_to_watch_now;

        const tbody = document.getElementById("positions");
        tbody.innerHTML = "";
        for (const position of data.positions) {
          const row = document.createElement("tr");
          row.innerHTML = "<td>" + position.asset + "</td>" +
            "<td>" + position.side + "</td>" +
            "<td>" + ${money.toString()}(position.value_usd) + "</td>" +
            "<td>" + position.leverage + "x / " + position.margin_mode + "</td>" +
            "<td>" + ${pct.toString()}(position.liquidation_distance_pct) + "</td>" +
            "<td class='" + (position.unrealized_pnl_usd >= 0 ? "good" : "bad") + "'>" + ${money.toString()}(position.unrealized_pnl_usd) + "</td>" +
            "<td class='" + (position.funding_paid_usd >= 0 ? "good" : "bad") + "'>" + ${money.toString()}(position.funding_paid_usd) + "</td>";
          tbody.appendChild(row);
        }
      }
      loadWallet();
    </script>
  </body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/wallet") {
      const wallet = url.searchParams.get("address") || DEFAULT_WALLET;
      const summary = await getWalletSummary(wallet);
      return Response.json(summary);
    }

    return new Response(html(), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
