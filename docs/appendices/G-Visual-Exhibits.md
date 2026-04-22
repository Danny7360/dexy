# Appendix G: Visual Exhibits

This appendix provides reusable diagrams for whitepaper, deck, and memo use.

## 1. Market Structure

```mermaid
flowchart LR
A["Hyperliquid Native UI"] --> B["Active Operator"]
C["Third-party Dashboards"] --> B
D["Telegram / Group Chats"] --> B
E["Manual Wallet Review"] --> B
B --> F["Fragmented Monitoring"]
F --> G["Dexy Control Layer"]
G --> H["Risk Priority"]
G --> I["Attribution"]
G --> J["Event Alerts"]
```

### Interpretation

The operator does not lack information. The operator lacks compression, priority, and explanation.

## 2. Problem Structure

```mermaid
flowchart TD
A["Operator Pain"] --> B["Sudden Death"]
A --> C["Slow Bleed"]
A --> D["Dying Without Understanding Why"]
B --> B1["Liquidation"]
B --> B2["Leverage"]
B --> B3["Concentration"]
C --> C1["Funding Drag"]
C --> C2["Fee Drag"]
C --> C3["Execution Drag"]
D --> D1["PnL Mismatch"]
D --> D2["No Attribution"]
D --> D3["No Clear Next Step"]
```

## 3. Dexy Product Logic

```mermaid
flowchart LR
A["Wallet / Position State"] --> B["Risk Engine"]
A --> C["Cost Engine"]
A --> D["Event Layer"]
B --> E["Most Dangerous Position"]
C --> F["Main Profit Leak"]
D --> G["What To Watch Next"]
E --> H["Operator Action"]
F --> H
G --> H
```

## 4. Business Model Ladder

```mermaid
flowchart LR
A["Phase 1: Subscription"] --> B["Phase 2: API / MCP / Webhooks"]
B --> C["Phase 3: Machine Rails / x402"]
C --> D["Optional Phase 4: Flow-Linked Revenue"]
```

### Interpretation

- phase 1 gives the business a realistic floor
- phase 2 creates workflow depth
- phase 3 creates machine-native expansion
- phase 4 is where ceiling expansion begins

## 5. Floor vs Ceiling

```mermaid
flowchart TD
A["Pure Dashboard"] --> B["Low Defensibility"]
A --> C["Useful but Limited Ceiling"]
D["Workflow Product"] --> E["Habit Formation"]
D --> F["Better Retention"]
G["Workflow + API"] --> H["Higher ARPU"]
G --> I["Better Expansion"]
J["Workflow + Flow"] --> K["Largest Ceiling"]
J --> L["Hardest To Build"]
```

## 6. Competitive Positioning

```mermaid
quadrantChart
    title Dexy Positioning
    x-axis Generic Analytics --> Workflow Native
    y-axis Broad Market Scope --> Wallet-Specific Operator Depth
    quadrant-1 High workflow, low depth
    quadrant-2 High workflow, high depth
    quadrant-3 Low workflow, low depth
    quadrant-4 Low workflow, high depth
    "Nansen": [0.35, 0.45]
    "CoinGlass": [0.25, 0.35]
    "HyperTracker / CMM": [0.45, 0.55]
    "Hyperdash": [0.75, 0.55]
    "Hyperliquid Native UI": [0.55, 0.30]
    "Dexy": [0.72, 0.75]
```

## 7. Product Roadmap

```mermaid
flowchart LR
A["V1: Wallet Risk + Attribution"] --> B["V2: Replay + Multi-Wallet + Exports"]
B --> C["V3: API + MCP + Machine Usage"]
```

## 8. Founder Narrative Compression

```mermaid
flowchart TD
A["Old Idea: Big Crypto Trading Platform"] --> B["Too Broad"]
A --> C["Too Many Modules"]
A --> D["Weak First Wedge"]
E["New Idea: Dexy"] --> F["Hyperliquid-first"]
E --> G["Human Operator-first"]
E --> H["Risk + Attribution-first"]
E --> I["Telegram-first"]
```

## 9. Case Study Structure

```mermaid
flowchart TD
A["Public Wallet State"] --> B["Direction"]
A --> C["Leverage and Structure"]
A --> D["Funding / Fee Drag"]
A --> E["Execution / Fill Quality"]
B --> F["One-line Explanation"]
C --> F
D --> F
E --> F
F --> G["Action Priority"]
```
