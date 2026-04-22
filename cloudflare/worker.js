const DEFAULT_WALLET = "0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab";
const HL_INFO_URL = "https://api.hyperliquid.xyz/info";
const WATCHLIST = [
  { label: "Long concentration", address: "0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab" },
  { label: "Single-position wallet", address: "0xec326a384ae965647d87e1f85db46d2efa15ae82" },
  { label: "Risky short demo", address: "0xfe35dfb17f226a61d1f8f318990e6d27944d6002" },
];

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

function buildAlertState(summary) {
  const alerts = [];
  const mostDangerous = [...summary.positions].sort(
    (a, b) => (a.liquidation_distance_pct ?? 100) - (b.liquidation_distance_pct ?? 100),
  )[0];

  if (!summary.positions.length) {
    alerts.push({
      level: "low",
      title: "No active perp exposure",
      body: "This wallet currently has no open positions. Alerting should stay quiet until new exposure appears.",
    });
    return alerts;
  }

  if ((mostDangerous?.liquidation_distance_pct ?? 100) <= 25) {
    alerts.push({
      level: "high",
      title: "Liquidation distance is compressing",
      body: `${mostDangerous.asset} is within ${pct(
        mostDangerous.liquidation_distance_pct,
      )} of its liquidation boundary.`,
    });
  }

  if (summary.costs.total_funding_paid_usd < -5000) {
    alerts.push({
      level: "medium",
      title: "Funding drag is material",
      body: `Carry costs have already removed ${money(
        Math.abs(summary.costs.total_funding_paid_usd),
      )} from this wallet's edge.`,
    });
  }

  if (summary.risk.score >= 60) {
    alerts.push({
      level: "high",
      title: "Risk score needs operator attention",
      body: `Current risk score is ${summary.risk.score}/100, driven by leverage concentration and wallet-level exposure.`,
    });
  }

  if (!alerts.length) {
    alerts.push({
      level: "low",
      title: "No urgent wallet alerts",
      body: "Exposure is live, but no immediate risk trigger is firing right now.",
    });
  }

  return alerts;
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
        color-scheme: light;
        --bg: #f3eadf;
        --bg-soft: #f8f1e7;
        --panel: rgba(255, 250, 244, 0.84);
        --panel-strong: #fff8ef;
        --text: #241712;
        --muted: #7f6758;
        --accent: #a2492f;
        --accent-deep: #6f2915;
        --warm: #c28a45;
        --line: rgba(110, 73, 53, 0.16);
        --shadow: 0 20px 60px rgba(88, 53, 33, 0.08);
        --danger: #b1412e;
        --warning: #b97a2d;
        --good: #7b5630;
      }
      body {
        margin: 0;
        font-family: "Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(162, 73, 47, 0.14), transparent 28%),
          radial-gradient(circle at 85% 20%, rgba(194, 138, 69, 0.12), transparent 24%),
          linear-gradient(180deg, #f7efe4 0%, #f0e4d6 100%);
        color: var(--text);
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 36px 20px 88px;
      }
      .hero-shell {
        display: grid;
        grid-template-columns: 1.55fr 0.95fr;
        gap: 18px;
        align-items: stretch;
        margin-bottom: 22px;
      }
      .hero-card,
      .note-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(12px);
      }
      .hero-card {
        padding: 30px 30px 26px;
      }
      .note-card {
        padding: 22px 22px 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(162, 73, 47, 0.08);
        color: var(--accent-deep);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .hero h1 {
        margin: 18px 0 12px;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        font-size: 48px;
        line-height: 0.96;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
        max-width: 720px;
        line-height: 1.62;
        font-size: 16px;
      }
      .hero-grid {
        margin-top: 22px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .hero-stat {
        padding: 14px 14px 15px;
        border-radius: 18px;
        background: rgba(255, 248, 239, 0.78);
        border: 1px solid rgba(110, 73, 53, 0.1);
      }
      .hero-stat .kicker {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
      }
      .hero-stat .big {
        font-size: 24px;
        font-weight: 800;
        color: var(--accent-deep);
      }
      .note-card h2 {
        margin: 0 0 14px;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        font-size: 28px;
        line-height: 1.02;
      }
      .note-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.62;
      }
      .note-card ul {
        margin: 18px 0 0;
        padding-left: 18px;
        color: var(--text);
        line-height: 1.8;
      }
      .input-row {
        display: flex;
        gap: 12px;
        margin: 0 0 22px;
      }
      .input-row.compare {
        margin-top: 12px;
        margin-bottom: 26px;
      }
      input {
        flex: 1;
        background: rgba(255, 250, 244, 0.92);
        border: 1px solid var(--line);
        color: var(--text);
        padding: 16px 18px;
        border-radius: 18px;
        font-size: 15px;
        box-shadow: var(--shadow);
      }
      input:focus { outline: 2px solid rgba(162, 73, 47, 0.18); outline-offset: 1px; }
      button {
        background: linear-gradient(180deg, #a2492f 0%, #8f3922 100%);
        color: #fff8f0;
        border: none;
        padding: 16px 20px;
        border-radius: 18px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 12px 32px rgba(143, 57, 34, 0.24);
      }
      .ghost-btn {
        background: transparent;
        color: var(--accent-deep);
        border: 1px solid rgba(110, 73, 53, 0.18);
        box-shadow: none;
      }
      .watchlist {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 0 0 20px;
      }
      .watchlist-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin: 8px 0 14px;
      }
      .watchlist-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .watchlist-meta {
        color: var(--muted);
        font-size: 13px;
        margin: 0 0 12px;
      }
      .watch-chip {
        border: 1px solid rgba(110, 73, 53, 0.14);
        background: rgba(255, 248, 239, 0.8);
        color: var(--accent-deep);
        padding: 10px 12px;
        border-radius: 999px;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
      }
      .watch-chip.active {
        background: linear-gradient(180deg, rgba(162, 73, 47, 0.12), rgba(162, 73, 47, 0.04));
        border-color: rgba(162, 73, 47, 0.28);
      }
      .watch-chip .sub {
        color: var(--muted);
        font-size: 12px;
      }
      .watch-chip strong {
        display: block;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 3px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 18px 18px 20px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(12px);
      }
      .label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 12px;
      }
      .value {
        font-family: "SF Pro Display", "Inter", sans-serif;
        font-size: 30px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .good { color: var(--good); }
      .bad { color: var(--danger); }
      .warn { color: var(--warning); }
      .full { grid-column: 1 / -1; }
      .summary {
        font-size: 18px;
        line-height: 1.65;
        color: #35231a;
        max-width: 960px;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        margin: 18px 0 10px;
      }
      .section-head h3 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        font-size: 28px;
        line-height: 1.05;
      }
      .section-head p {
        margin: 0;
        color: var(--muted);
        max-width: 700px;
      }
      .status-banner {
        display: none;
        margin: 0 0 16px;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(110, 73, 53, 0.12);
        background: rgba(255, 248, 239, 0.7);
        color: var(--muted);
      }
      .status-banner.error {
        display: block;
        background: rgba(177, 65, 46, 0.08);
        color: var(--danger);
      }
      .status-banner.loading {
        display: block;
        color: var(--accent-deep);
      }
      .card.note-band {
        background: linear-gradient(135deg, rgba(162, 73, 47, 0.06), rgba(194, 138, 69, 0.08));
      }
      .settings-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .settings-grid label {
        display: block;
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
      }
      .settings-grid input {
        width: 100%;
        box-sizing: border-box;
      }
      .alert-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .alert-summary {
        margin: 0 0 14px;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(110, 73, 53, 0.1);
        background: rgba(255, 248, 239, 0.72);
        color: var(--muted);
      }
      .alert-card {
        border-radius: 22px;
        padding: 18px 18px 16px;
        border: 1px solid rgba(110, 73, 53, 0.1);
        background: rgba(255, 248, 239, 0.75);
      }
      .alert-card.high { background: rgba(177, 65, 46, 0.08); }
      .alert-card.medium { background: rgba(185, 122, 45, 0.08); }
      .alert-card.low { background: rgba(123, 86, 48, 0.05); }
      .alert-kicker {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .alert-title {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 800;
      }
      .alert-body {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .compare-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .compare-summary {
        margin-top: 12px;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(110, 73, 53, 0.1);
        background: rgba(255, 248, 239, 0.72);
        color: var(--muted);
        line-height: 1.65;
      }
      .compare-card {
        background: rgba(255, 248, 239, 0.72);
        border: 1px solid rgba(110, 73, 53, 0.12);
        border-radius: 24px;
        padding: 18px;
      }
      .compare-card h4 {
        margin: 0 0 12px;
        font-size: 20px;
      }
      .compare-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .compare-pill {
        padding: 12px;
        border-radius: 16px;
        background: rgba(255,255,255,0.45);
        border: 1px solid rgba(110, 73, 53, 0.08);
      }
      .compare-pill .k {
        font-size: 11px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
      }
      .compare-pill .v {
        font-size: 20px;
        font-weight: 800;
      }
      .narrative-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 16px;
      }
      .bullet-stack {
        display: grid;
        gap: 12px;
      }
      .bullet {
        padding: 16px 18px;
        border-radius: 20px;
        border: 1px solid rgba(110, 73, 53, 0.12);
        background: rgba(255, 248, 239, 0.7);
      }
      .bullet strong {
        display: block;
        margin-bottom: 6px;
        font-size: 15px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 15px;
      }
      th, td {
        text-align: left;
        padding: 14px 10px;
        border-bottom: 1px solid rgba(110, 73, 53, 0.12);
      }
      th {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      tbody tr:hover {
        background: rgba(162, 73, 47, 0.04);
      }
      .footer {
        color: var(--muted);
        margin-top: 18px;
        font-size: 13px;
      }
      @media (max-width: 980px) {
        .hero-shell,
        .grid,
        .compare-grid,
        .narrative-grid,
        .settings-grid,
        .alert-list {
          grid-template-columns: 1fr 1fr;
        }
        .hero-card {
          grid-column: 1 / -1;
        }
      }
      @media (max-width: 640px) {
        .hero-shell,
        .grid,
        .compare-grid,
        .narrative-grid,
        .settings-grid,
        .alert-list {
          grid-template-columns: 1fr;
        }
        .hero h1 {
          font-size: 40px;
        }
        .hero-grid {
          grid-template-columns: 1fr;
        }
        .input-row {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="hero-shell">
        <div class="hero hero-card">
          <div class="eyebrow">Hyperliquid-first operator console</div>
          <h1>Know which position can hurt you first.</h1>
          <p>
            Dexy turns public but hard-to-read wallet exposure into an operator-grade readout:
            what is most dangerous right now, what is quietly draining returns, and what deserves attention before the next move.
          </p>
          <div class="hero-grid">
            <div class="hero-stat">
              <div class="kicker">Primary use</div>
              <div class="big">Risk triage</div>
            </div>
            <div class="hero-stat">
              <div class="kicker">Secondary use</div>
              <div class="big">PnL attribution</div>
            </div>
            <div class="hero-stat">
              <div class="kicker">Surface</div>
              <div class="big">Wallet-first</div>
            </div>
          </div>
        </div>

        <div class="note-card">
          <div>
            <h2>Built for people already in the market.</h2>
            <p>
              Not a signal feed. Not a copy-trading toy. This prototype answers the operator question:
              “What should I look at first before this position becomes expensive?”
            </p>
          </div>
          <ul>
            <li>Wallet-level risk ranking</li>
            <li>Funding and carry drag visibility</li>
            <li>Action-first summary, not raw dashboards</li>
          </ul>
        </div>
      </div>

      <div class="input-row">
        <input id="wallet" value="${DEFAULT_WALLET}" />
        <button onclick="loadWallet()">Inspect wallet</button>
        <button class="ghost-btn" onclick="addCurrentWalletToWatchlist()">Save wallet</button>
      </div>

      <div class="status-banner" id="status-banner"></div>

      <div class="watchlist-toolbar">
        <div class="label" style="margin: 0;">Watchlist</div>
        <div class="watchlist-actions">
          <button class="ghost-btn" onclick="resetWatchlist()">Reset defaults</button>
        </div>
      </div>
      <div class="watchlist-meta" id="watchlist-meta">Loading saved wallets…</div>
      <div class="watchlist" id="watchlist"></div>

      <div class="grid">
        <div class="card"><div class="label">Risk Level</div><div id="risk-level" class="value warn">-</div></div>
        <div class="card"><div class="label">Risk Score</div><div id="risk-score" class="value">-</div></div>
        <div class="card"><div class="label">Most At Risk</div><div id="risk-asset" class="value">-</div></div>
        <div class="card"><div class="label">Top Cost Driver</div><div id="cost-driver" class="value">-</div></div>
        <div class="card full note-band"><div class="label">Operator Summary</div><div id="operator-summary" class="summary">Loading...</div></div>
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

      <div class="section-head">
        <h3>Alert State</h3>
        <p>Not another noisy dashboard. These are the operator-grade reasons this wallet deserves attention right now.</p>
      </div>
      <div class="alert-summary" id="alert-summary">Loading alert thresholds…</div>
      <div class="card" style="margin-bottom: 14px;">
        <div class="label">Alert Thresholds</div>
        <div class="settings-grid">
          <div>
            <label for="setting-liq">Liquidation distance %</label>
            <input id="setting-liq" type="number" min="1" step="1" />
          </div>
          <div>
            <label for="setting-funding">Funding drag USD</label>
            <input id="setting-funding" type="number" min="100" step="100" />
          </div>
          <div>
            <label for="setting-risk">Risk score</label>
            <input id="setting-risk" type="number" min="1" max="100" step="1" />
          </div>
        </div>
      </div>
      <div class="alert-list" id="alerts"></div>

      <div class="section-head">
        <h3>Wallet Compare</h3>
        <p>Borrowing the best part of trader explorer products: fast side-by-side context, but tuned for risk and carry instead of voyeuristic PnL scrolling.</p>
      </div>
      <div class="input-row compare">
        <input id="compare-a" value="${WATCHLIST[0].address}" />
        <input id="compare-b" value="${WATCHLIST[1].address}" />
        <button class="ghost-btn" onclick="loadCompare()">Compare wallets</button>
      </div>
      <div class="compare-grid" id="compare"></div>
      <div class="compare-summary" id="compare-summary"></div>

      <div class="section-head">
        <h3>Investor Demo Narrative</h3>
        <p>The point of Dexy is not “AI explains wallets.” The point is turning public but hard-to-operate Hyperliquid state into a repeatable operator workflow.</p>
      </div>
      <div class="narrative-grid">
        <div class="card">
          <div class="label">What this page proves</div>
          <div class="bullet-stack">
            <div class="bullet">
              <strong>1. Public wallet data can be made operator-readable.</strong>
              Dexy compresses leverage, liquidation distance, funding drag, and attribution into one action-first surface.
            </div>
            <div class="bullet">
              <strong>2. The wedge is not alpha, but risk interpretation.</strong>
              We are not telling users what to buy. We are showing where they can get hurt and what is quietly draining edge.
            </div>
            <div class="bullet">
              <strong>3. The natural next step is workflow.</strong>
              Once watchlists, compares, and alerts exist, the product can grow into Telegram triggers, API delivery, and later paid operator tooling.
            </div>
          </div>
        </div>
        <div class="card note-band">
          <div class="label">Comparable product cues</div>
          <div class="bullet-stack">
            <div class="bullet">
              <strong>Hyperdash</strong>
              Strong on terminal density and trader exploration. We borrow fast wallet surfacing, but keep the presentation calmer and more thesis-driven.
            </div>
            <div class="bullet">
              <strong>trade[XYZ] Ghost Mode</strong>
              Great on watchlists and trader observation. We borrow the watchlist behavior, but shift the goal from spectating to triaging risk.
            </div>
            <div class="bullet">
              <strong>Nansen Portfolio</strong>
              Strong on clean information density. We borrow the “portfolio clarity” instinct, but focus narrowly on perp risk and carry.
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>
      const DEFAULT_WATCHLIST = ${JSON.stringify(WATCHLIST)};
      const WATCHLIST_KEY = "dexy.watchlist.v1";
      const SETTINGS_KEY = "dexy.alertSettings.v1";
      const DEFAULT_ALERT_SETTINGS = {
        liqThreshold: 25,
        fundingThreshold: 5000,
        riskThreshold: 60,
      };

      function watchButtonHtml(label, value, cls) {
        return "<div class='compare-pill'><div class='k'>" + label + "</div><div class='v " + (cls || "") + "'>" + value + "</div></div>";
      }

      function showStatus(message, type) {
        const el = document.getElementById("status-banner");
        el.textContent = message || "";
        el.className = "status-banner" + (type ? " " + type : "");
        if (!message) {
          el.style.display = "none";
        } else {
          el.style.display = "block";
        }
      }

      function setText(id, value, cls) {
        const el = document.getElementById(id);
        el.textContent = value;
        if (cls) el.className = "value " + cls;
      }

      function getWatchlist() {
        try {
          const stored = localStorage.getItem(WATCHLIST_KEY);
          if (!stored) return DEFAULT_WATCHLIST;
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_WATCHLIST;
        } catch {
          return DEFAULT_WATCHLIST;
        }
      }

      function saveWatchlist(items) {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
      }

      function renderWatchlist(activeAddress) {
        const root = document.getElementById("watchlist");
        const meta = document.getElementById("watchlist-meta");
        const items = getWatchlist();
        meta.textContent = items.length + " saved wallets ready for operator triage.";
        root.innerHTML = items.map((item, index) =>
          "<button class='watch-chip " + (item.address === activeAddress ? "active" : "") + "' onclick=\"selectWatch('" + item.address + "')\">" +
            "<strong>" + item.label + "</strong>" +
            "<div class='sub'>" + item.address.slice(0, 10) + "...</div>" +
          "</button>"
        ).join("");
      }

      function addCurrentWalletToWatchlist() {
        const wallet = document.getElementById("wallet").value.trim();
        if (!wallet) return;
        const items = getWatchlist();
        if (items.find((item) => item.address.toLowerCase() === wallet.toLowerCase())) {
          showStatus("Wallet already exists in watchlist.", "loading");
          setTimeout(() => showStatus("", ""), 1500);
          return;
        }
        items.unshift({
          label: "Saved wallet " + (items.length + 1),
          address: wallet,
        });
        saveWatchlist(items.slice(0, 8));
        renderWatchlist(wallet);
        showStatus("Wallet saved to watchlist.", "loading");
        setTimeout(() => showStatus("", ""), 1500);
      }

      function resetWatchlist() {
        saveWatchlist(DEFAULT_WATCHLIST);
        renderWatchlist(document.getElementById("wallet").value.trim());
        showStatus("Watchlist reset to default examples.", "loading");
        setTimeout(() => showStatus("", ""), 1500);
      }

      function getAlertSettings() {
        try {
          return { ...DEFAULT_ALERT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")) };
        } catch {
          return DEFAULT_ALERT_SETTINGS;
        }
      }

      function saveAlertSettings() {
        const settings = {
          liqThreshold: Number(document.getElementById("setting-liq").value || DEFAULT_ALERT_SETTINGS.liqThreshold),
          fundingThreshold: Number(document.getElementById("setting-funding").value || DEFAULT_ALERT_SETTINGS.fundingThreshold),
          riskThreshold: Number(document.getElementById("setting-risk").value || DEFAULT_ALERT_SETTINGS.riskThreshold),
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return settings;
      }

      function hydrateAlertSettings() {
        const settings = getAlertSettings();
        document.getElementById("setting-liq").value = settings.liqThreshold;
        document.getElementById("setting-funding").value = settings.fundingThreshold;
        document.getElementById("setting-risk").value = settings.riskThreshold;
        ["setting-liq", "setting-funding", "setting-risk"].forEach((id) => {
          document.getElementById(id).addEventListener("change", () => {
            saveAlertSettings();
            const summaryText = document.getElementById("operator-summary").textContent;
            if (summaryText && summaryText !== "Loading...") {
              loadWallet();
            }
          });
        });
      }

      async function loadWallet() {
        const wallet = document.getElementById("wallet").value.trim();
        showStatus("Loading wallet summary...", "loading");
        try {
          const res = await fetch("/api/wallet?address=" + encodeURIComponent(wallet));
          if (!res.ok) throw new Error("Request failed");
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

          renderAlerts(data);
          renderWatchlist(wallet);
          showStatus("", "");
        } catch (error) {
          showStatus("Could not load wallet summary. Try again or switch to a different wallet.", "error");
        }
      }

      function renderAlerts(data) {
        const settings = getAlertSettings();
        const alerts = [];
        const positions = data.positions || [];
        const mostDangerous = [...positions].sort((a, b) => (a.liquidation_distance_pct || 100) - (b.liquidation_distance_pct || 100))[0];

        if (!positions.length) {
          alerts.push({
            level: "low",
            title: "No active perp exposure",
            body: "This wallet currently has no open positions. Alerting should stay quiet until new exposure appears.",
          });
        } else {
          if ((mostDangerous?.liquidation_distance_pct || 100) <= settings.liqThreshold) {
            alerts.push({
              level: "high",
              title: "Liquidation distance is compressing",
              body: mostDangerous.asset + " is within " + ${pct.toString()}(mostDangerous.liquidation_distance_pct) + " of its liquidation boundary.",
            });
          }
          if (Math.abs(data.costs.total_funding_paid_usd) >= settings.fundingThreshold) {
            alerts.push({
              level: "medium",
              title: "Funding drag is material",
              body: "Carry costs have already removed " + ${money.toString()}(Math.abs(data.costs.total_funding_paid_usd)) + " from this wallet's edge.",
            });
          }
          if (data.risk.score >= settings.riskThreshold) {
            alerts.push({
              level: "high",
              title: "Risk score needs operator attention",
              body: "Current risk score is " + data.risk.score + "/100, driven by leverage concentration and wallet-level exposure.",
            });
          }
        }

        if (!alerts.length) {
          alerts.push({
            level: "low",
            title: "No urgent wallet alerts",
            body: "Exposure is live, but no immediate risk trigger is firing right now.",
          });
        }

        const el = document.getElementById("alerts");
        const summary = document.getElementById("alert-summary");
        el.innerHTML = alerts.map((alert) =>
          "<div class='alert-card " + alert.level + "'>" +
            "<div class='alert-kicker'>" + alert.level + " priority</div>" +
            "<div class='alert-title'>" + alert.title + "</div>" +
            "<p class='alert-body'>" + alert.body + "</p>" +
          "</div>"
        ).join("");
        const urgentCount = alerts.filter((alert) => alert.level === "high").length;
        summary.textContent = urgentCount
          ? urgentCount + " urgent trigger" + (urgentCount > 1 ? "s are" : " is") + " firing under the current wallet thresholds."
          : "No urgent trigger is firing. Current thresholds are tuned for quieter wallet monitoring.";
      }

      async function loadCompare() {
        const a = document.getElementById("compare-a").value.trim();
        const b = document.getElementById("compare-b").value.trim();
        const summary = document.getElementById("compare-summary");
        summary.textContent = "Comparing wallets...";
        try {
          const [ra, rb] = await Promise.all([
            fetch("/api/wallet?address=" + encodeURIComponent(a)).then(r => r.json()),
            fetch("/api/wallet?address=" + encodeURIComponent(b)).then(r => r.json()),
          ]);

          const render = (label, data) =>
            "<div class='compare-card'>" +
              "<h4>" + label + "</h4>" +
              "<div class='compare-meta'>" +
                watchButtonHtml("Risk", String(data.risk.score), data.risk.score >= 60 ? "bad" : data.risk.score >= 35 ? "warn" : "good") +
                watchButtonHtml("At risk", data.risk.most_at_risk_asset || "-", "") +
                watchButtonHtml("Unrealized", ${money.toString()}(data.costs.total_unrealized_pnl_usd), data.costs.total_unrealized_pnl_usd >= 0 ? "good" : "bad") +
                watchButtonHtml("Funding", ${money.toString()}(data.costs.total_funding_paid_usd), data.costs.total_funding_paid_usd >= 0 ? "good" : "bad") +
              "</div>" +
              "<p class='alert-body' style='margin-top: 14px;'>" + data.operator_summary + "</p>" +
            "</div>";

          document.getElementById("compare").innerHTML = render("Wallet A", ra) + render("Wallet B", rb);
          const winner = ra.risk.score >= rb.risk.score ? "Wallet A is riskier right now" : "Wallet B is riskier right now";
          const fundingLead =
            Math.abs(ra.costs.total_funding_paid_usd) >= Math.abs(rb.costs.total_funding_paid_usd)
              ? "Wallet A is bleeding more through funding drag."
              : "Wallet B is bleeding more through funding drag.";
          const attentionLead =
            (ra.risk.most_at_risk_asset || "-") === (rb.risk.most_at_risk_asset || "-")
              ? "Both wallets are leaning on the same risk pocket."
              : "The two wallets are exposed to different pain points.";
          summary.textContent = winner + ". " + fundingLead + " " + attentionLead;
        } catch (error) {
          summary.textContent = "Could not compare the two wallets right now.";
        }
      }

      function selectWatch(address) {
        document.getElementById("wallet").value = address;
        loadWallet();
      }

      renderWatchlist(DEFAULT_WALLET);
      hydrateAlertSettings();
      loadWallet();
      loadCompare();
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
