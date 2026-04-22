# Dexy

Working repo for the `Dexy` business-plan package.

This repository currently contains a first-pass strategy and fundraising-ready document set built from:

- our full product discussion
- the user-provided Grok / Gemini research outputs
- publicly available pricing / product references
- a founder-learning track for moving from thesis to execution

## Package Structure

- [docs/01-Whitepaper.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/01-Whitepaper.md)
  - The formal product whitepaper
- [docs/02-Business-Plan.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/02-Business-Plan.md)
  - Silicon Valley style business plan / investor memo
- [docs/appendices/A-Market-Evidence.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/A-Market-Evidence.md)
  - Market, product, pricing, and comparable evidence
- [docs/appendices/B-X-Source-Index.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/B-X-Source-Index.md)
  - Index of X/Twitter posts used in the thesis
- [docs/appendices/C-Founder-Learning-Path.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/C-Founder-Learning-Path.md)
  - Informal onboarding and learning path
- [docs/appendices/D-FAQ-and-Objections.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/D-FAQ-and-Objections.md)
  - Objections, risks, and plain-language answers
- [docs/03-Pitch-Deck-Outline.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/03-Pitch-Deck-Outline.md)
  - Slide-by-slide fundraising deck structure
- [docs/04-Fundraising-Deck-Copy.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/04-Fundraising-Deck-Copy.md)
  - Draft fundraising deck copy
- [docs/05-Investor-Short-Memo.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/05-Investor-Short-Memo.md)
  - Short forwardable investor memo
- [docs/appendices/E-Case-Study-Appendix.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/E-Case-Study-Appendix.md)
  - Public-wallet and operator case studies
- [docs/appendices/F-Competitive-Landscape.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/F-Competitive-Landscape.md)
  - Competitor and substitute mapping
- [docs/appendices/G-Visual-Exhibits.md](/Users/vivian/Documents/Roven%20IDE/B2A/dexy/docs/appendices/G-Visual-Exhibits.md)
  - Reusable market structure, business model, and roadmap diagrams

## Positioning In One Sentence

Dexy is a non-custodial risk attribution and event alert layer for Hyperliquid-native operators, helping them understand where risk is building, where profit is leaking, and why realized results diverge from intuition.

## Current Thesis

Dexy should **not** start as:

- a copy-trading product
- a public alpha feed
- an autonomous agent product
- an x402-first business
- a generic AI trading copilot

Dexy should start as:

- a wallet-aware risk and attribution workflow
- focused on human operators first
- Hyperliquid-first
- Telegram-first / dashboard-second
- API / MCP / x402 later
# Dexy

Dexy is a Hyperliquid-first wallet risk attribution and event alert layer.

The product direction is intentionally narrow:

- human operator first
- read-only and non-custodial
- focused on wallet-level risk, cost drag, and attribution
- not a signal-selling product
- not a copy-trading or execution product

## Repository Structure

- `docs/`: whitepaper, business plan, deck copy, appendices
- `deck/`: editable investor deck assets
- `src/dexy/`: API and MVP application code
- `tests/`: API smoke tests

## MVP Scope

The MVP is a backend service that answers one question well:

> For a wallet on Hyperliquid, what is the most dangerous open exposure right now, and what is currently eating into PnL?

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn dexy.main:app --reload
```

Then open:

- `http://127.0.0.1:8000/healthz`
- `http://127.0.0.1:8000/v1/wallets/0xfe35dfb17f226a61d1f8f318990e6d27944d6002/summary`

## Current State

This repo started as a strategy/investor-materials repo. The codebase now includes:

- a FastAPI API skeleton
- domain models for positions, risk, costs, and attribution
- a placeholder Hyperliquid adapter using deterministic demo data
- a wallet summary endpoint for frontend and bot integration

## What Comes Next

1. Replace demo snapshots with real Hyperliquid reads
2. Add Telegram alerting
3. Add replay/timeline support
4. Add a minimal dashboard

For the tactical build order, see:

- `docs/06-Engineering-Roadmap.md`
