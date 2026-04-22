# Appendix E: Case Study Appendix

These case studies are designed to support product thinking, GTM language, and fundraising narrative. They are not trading recommendations.

They combine:

- public-wallet observation
- founder learning exercises
- product framing

## Case Study 1: The dangerous SP500 short

### Wallet

`0xfe35dfb17f226a61d1f8f318990e6d27944d6002`

### User story

An active Hyperliquid operator is running a large, highly directional short. On the surface, the dashboard already shows a bad situation:

- large notional short
- high leverage
- negative funding burden
- tightening liquidation distance

But the real operator problem is not “the number is red.”

It is:

- how bad is this really?
- what is driving the loss?
- what should I pay attention to first?

### What existing tools show

- open position
- leverage
- current unrealized loss
- funding paid
- liquidation distance

This is useful, but still requires interpretation.

### What the user is actually feeling

- I know I’m down, but is the real problem the direction or the structure?
- Is funding now large enough to matter?
- Am I close enough to danger that I need to act now?
- Is this still a thesis, or is this now a fragility problem?

### Dexy-style interpretation

Dexy should not merely show a worse-looking dashboard.

Dexy should explain:

> You are not just wrong on direction. Your short is structurally fragile. Leverage is amplifying the move, funding is compounding the loss, and liquidation distance has become the highest-priority variable to watch.

### Why this matters commercially

This is the kind of case where a user can justify paying:

- not for more information
- but for better interpretation and faster risk prioritization

### Product screenshot sketch

```text
 ----------------------------------------------------------
| Dexy Wallet Risk Layer                                    |
|-----------------------------------------------------------|
| Wallet: 0xfe35...6002         Risk Score: HIGH            |
| Primary Position: SP500 Short                             |
| Notional: $19.4M              Margin Mode: Isolated       |
| Position Leverage: 18x        Effective Leverage: 28.77x  |
| Liq Distance: 43%             Funding Paid: -$52,277      |
| UPNL: -$362,746                                           |
|-----------------------------------------------------------|
| Top Risk Driver     | High leverage + tightening liq gap  |
| Top Loss Driver     | Direction loss compounded by funding|
| What To Watch Now   | Liquidation distance before PnL     |
| Dexy Summary        | This is now a fragility problem.    |
 ----------------------------------------------------------
```

### Product implication

This case justifies:

- liquidation-aware alerts
- leverage-aware summaries
- funding-aware loss explanations
- operator-priority ordering

## Case Study 2: The profitable but leaking long wallet

### Wallet

`0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab`

### User story

A profitable long-biased wallet appears healthy. The trader is directionally right, and the account does not look immediately fragile.

But this creates a different operator problem:

- where is profit still leaking?
- how much of this visible gain is truly retained?
- what is the hidden drag inside a “good” account?

### What existing tools show

- profitable posture
- healthy account state
- open positions or recent outcomes
- funding paid

### What the user is actually feeling

- I’m right, but why doesn’t the retained result feel as high as expected?
- Is funding meaningful enough to care about?
- Am I overestimating the quality of this performance?

### Dexy-style interpretation

Dexy should explain:

> Your direction has been right, but not all visible profit is durable. Funding and carry costs are reducing retained PnL. The key question is no longer whether you are right, but how much of the gain you actually keep.

### Why this matters commercially

This case proves attribution is not only for losing traders.

Serious operators also pay to understand:

- why they are winning
- and where their gains are quietly leaking away

### Product screenshot sketch

```text
 ----------------------------------------------------------
| Dexy Profit Attribution View                              |
|-----------------------------------------------------------|
| Wallet: 0x3ee5...4fab         State: Stable / Long-biased |
| Realized PnL: +$X             Unrealized PnL: +$Y         |
| Funding Paid: -$Z             Fees Paid: -$N              |
|-----------------------------------------------------------|
| Main Gain Driver   | Directional long exposure            |
| Main Leakage       | Funding drag                         |
| Execution Quality  | No major warning                     |
| What To Watch Next | Whether carry costs keep rising      |
| Dexy Summary       | Good posture, but not all profit     |
|                    | is durable.                          |
 ----------------------------------------------------------
```

### Product implication

This case supports:

- funding drag breakdown
- realized vs unrealized interpretation
- “why profit is smaller than intuition” explanation

## Case Study 3: The fragmented operator

### Persona

A small Hyperliquid strategy operator with:

- multiple wallets or subaccounts
- one or more bots
- no internal risk or attribution stack
- ongoing manual checking across tools

### User story

This operator is not a beginner. They know how to trade. They may even know how to code.

But they still have a repeated workflow problem:

- they check multiple dashboards
- they glance at native UI
- they rely on Telegram and social feeds
- they mentally stitch together the story

The problem is not that they cannot build any tooling.

The problem is that they do not want to continuously maintain their own monitoring, ranking, and explanation system.

### What existing workflows look like

- native Hyperliquid UI
- one or two external dashboards
- manual spreadsheet notes
- Telegram alerts

### What this creates

- context switching
- weak prioritization
- delayed reactions
- poor post-trade explanation

### Dexy-style interpretation

Dexy’s value is compressing this fragmented workflow into:

- one risk priority
- one loss driver
- one action recommendation

### Product screenshot sketch

```text
 ----------------------------------------------------------
| Dexy Operator Home                                         |
|------------------------------------------------------------|
| Wallets Watched: 4        Bot-linked Accounts: 2           |
|------------------------------------------------------------|
| 1. Most Dangerous Position                                 |
|    SP500 Short / Wallet B / Liq Distance 43%              |
|                                                            |
| 2. Biggest Current Profit Leak                             |
|    ETH Long / Wallet A / Funding drag increasing          |
|                                                            |
| 3. Highest-Priority Event                                  |
|    Portfolio concentration rising in one short cluster    |
|                                                            |
| 4. Daily Summary                                           |
|    Today’s main issue is not direction; it is structure.  |
 -----------------------------------------------------------
```

## Case Study 4: Why this is not an alpha business

### The temptation

It is easy to look at public wallet data and decide to build:

- whale alerts
- alpha calls
- copy trading

### Why that is the wrong first product

Public alpha decays quickly.

The stronger commercial wedge is:

- risk monitoring
- attribution
- event-aware alerts
- operator workflow

### Product implication

Dexy should not begin by selling:

- public alpha feed
- generic AI trading recommendations
- “best wallets to copy today”

It should begin by helping operators avoid loss and understand loss.
