# Dexy Whitepaper

## 1. Abstract

Dexy is a non-custodial risk attribution and event alert layer built for Hyperliquid-native operators.

It does **not** aim to tell users what to buy or sell. Instead, it helps them answer three higher-value questions:

1. Which position is most dangerous right now?
2. Where is profit leaking through funding, fees, slippage, or poor execution?
3. Why did realized PnL differ from what the trader thought should have happened?

Dexy starts as a human-first operator workflow product:

- wallet-aware
- risk-first
- attribution-first
- Telegram-first
- dashboard and API second

Later, the most valuable intelligence objects can be exposed through API, MCP, and x402-compatible usage rails.

## 2. Problem

Hyperliquid users do not primarily suffer from a lack of market ideas. They suffer from three recurring forms of uncertainty:

### 2.1 Sudden death

Users fear:

- liquidation
- leverage expansion
- concentration risk
- not noticing when a position becomes fragile

### 2.2 Slow bleed

Users fear:

- funding drag
- fee drag
- slippage
- poor fill quality
- hidden carrying costs that erode directional gains

### 2.3 Dying without understanding why

Users fear:

- PnL mismatch
- thinking they were right but realizing little profit
- not knowing whether the mistake came from direction, timing, fees, execution, or structure

This is not a “find me alpha” problem. It is a “help me see risk, loss drivers, and action priority” problem.

## 3. Why Now

Three things are now simultaneously true:

### 3.1 Hyperliquid has operator density

Hyperliquid has concentrated a large number of serious perp users, strategy operators, builder-integrated frontends, and vault participants into one venue.

This makes it a better wedge than trying to solve “all onchain trading” from day one.

### 3.2 Publicly observable data is sufficient for a first wedge

Hyperliquid and adjacent onchain markets expose enough public state to reconstruct:

- positions
- fills
- leverage posture
- wallet behavior
- liquidation proximity
- funding burden

That does not mean all truth is public. It means enough is observable to build a real, non-custodial workflow product.

### 3.3 Existing tools remain fragmented

Users can combine dashboards, trackers, bots, and spreadsheets. But fragmentation produces a new tax:

- too many surfaces
- no single risk priority
- weak attribution
- poor narrative explanation

Dexy’s opportunity is not to invent a need. It is to compress fragmented operator workflows into a persistent control layer.

## 4. Product Thesis

Dexy should be understood as an **operator control layer**, not an AI analyst and not an alpha terminal.

### Dexy is not:

- a copy-trading product
- a public signal feed
- a generic “AI explains your portfolio” chatbot
- a custody layer
- a strategy automation platform in v1

### Dexy is:

- a wallet-aware risk monitor
- a cost and PnL attribution surface
- an event alerting system
- a persistent workflow layer for active Hyperliquid operators

## 5. Product Design

### 5.1 Core jobs to be done

Dexy helps users:

1. identify the most dangerous open position
2. quantify funding/fee/execution drag
3. understand why realized outcomes diverged from intuition
4. know what to watch next

### 5.2 Initial product surfaces

#### Telegram bot

The bot is the first product surface because risk is time-sensitive.

Core functions:

- `/health`
- `/risk`
- `/pnl`
- `/watch`
- threshold alerts
- one-line risk summaries

#### Minimal dashboard

The dashboard should support:

- wallet overview
- current open positions
- risk ranking
- cost decomposition
- short narrative explanation

### 5.3 Core fields

#### Risk fields

- `primary_position_asset`
- `position_side`
- `position_value_usd`
- `position_leverage`
- `margin_mode`
- `liquidation_distance_pct`
- `account_risk_score`

#### Cost fields

- `unrealized_pnl_usd`
- `realized_pnl_usd`
- `funding_paid_usd`
- `fees_paid_usd`
- `execution_drag_hint`

#### Attribution fields

- `top_loss_driver`
- `top_risk_driver`
- `most_at_risk_position`
- `most_costly_position`

#### Explanation fields

- `one_line_summary`
- `what_to_watch_now`
- `why_pnl_looks_like_this`

## 6. Initial User

Dexy is not for everyone who uses Hyperliquid.

### First user segment

- active Hyperliquid traders
- small strategy operators
- bot runners
- builder-adjacent operators who need persistent visibility

### Explicitly not the first users

- retail copy-traders
- beginners seeking education
- fully autonomous agents
- whale desks with proprietary internal infrastructure

The first customer is a person with real exposure and recurring anxiety around risk, leakage, and post-trade explanation.

## 7. Business Model

### Phase 1: Human-first subscription

Likely model:

- free tier for one wallet and basic snapshots
- pro tier for alerts, attribution, and history
- operator tier for multi-wallet, exports, and team workflows

Why this works:

- low onboarding friction
- direct fit for human operators
- easier to validate than x402-first monetization

### Phase 2: API / workflow monetization

Once the core wedge is proven, Dexy can monetize:

- API access
- webhooks
- MCP access
- workflow integrations

### Phase 3: x402-compatible machine usage

x402 should be treated as a later-stage machine-native monetization rail, not a v1 payment experience for humans.

## 8. Defensibility

Dexy will not win because “AI can analyze public data.” That is not defensible.

Dexy can only win through a compound moat:

1. workflow embedding
2. wallet-aware and operator-specific configuration
3. continuously improving risk and attribution semantics
4. persistent alerts and replay
5. explanation quality tied to action priority

The product moat is not raw data. It is:

- structured semantics
- user-specific monitoring
- repeated workflow usage

## 9. Risks

### 9.1 The fake-dashboard risk

If Dexy becomes a prettier dashboard with no behavior-changing output, it fails.

### 9.2 Platform catch-up risk

If Hyperliquid or adjacent major tools ship equivalent native attribution and risk workflows, Dexy’s wedge narrows.

### 9.3 Commodity AI risk

If value remains at “explaining what is already visible,” Dexy is not investable and not durable.

### 9.4 Narrow market risk

This is likely a narrower, professional market before it becomes a broader one.

## 10. Validation Criteria

The thesis should be considered validated only if:

1. users repeatedly return to the workflow
2. users say the tool changed what they watched or did
3. users will pay for risk/attribution, not just free curiosity

## 11. Roadmap

### Phase 1

- Hyperliquid-first
- one-wallet risk and attribution
- Telegram alerts
- one-line explanations

### Phase 2

- multi-wallet
- replay timeline
- better attribution breakdown
- export and team workflow

### Phase 3

- API
- MCP
- x402
- multi-venue extensions

## 12. Closing Thesis

Dexy is not a bet that public data can create superior alpha. It is a bet that public observability can support a valuable operator control layer.

The first product should not tell users what to buy.

It should tell them:

- where risk is building
- where profit is leaking
- and why their results look the way they do
