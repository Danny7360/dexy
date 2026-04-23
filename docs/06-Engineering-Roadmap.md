# Dexy Engineering Roadmap

## Goal

Turn the current strategy/docs repo into a narrow, testable MVP for:

- Hyperliquid-first
- human operator first
- wallet-level risk attribution and event alerts

## Build Order

### Phase 1: API Skeleton

- FastAPI service
- wallet summary endpoint
- deterministic demo data
- domain models for risk, costs, attribution

### Phase 2: Real Hyperliquid Reads

- replace demo adapter with real wallet snapshot reads
- normalize positions, leverage, margin mode, liquidation distance
- store snapshots for replay

### Phase 3: Alerting Layer

- threshold rules for liquidation distance
- funding drag alerts
- top-risk-position alerts
- Telegram bot integration
- webhook command surface for `/wallet` and `/risk`
- batch wallet scan API for watchlist-style alerting

### Phase 4: Replay and Explanation

- event timeline
- daily operator summary
- top loss driver by wallet
- natural-language explanation layer

## MVP North Star

The first shipped feature should answer:

> For a given wallet, what is the most dangerous position right now, and what is currently eating into PnL?

## What We Are Not Building Yet

- copy trading
- execution routing
- public alpha feed
- x402-first monetization
- agent-first product surface
- multi-venue support
