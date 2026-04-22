// Node-oriented editable pro deck builder.
// Run this after editing SLIDES, SOURCES, and layout functions.
// The init script installs a sibling node_modules/@oai/artifact-tool package link
// and package.json with type=module for shell-run eval builders. Run with the
// Node executable from Codex workspace dependencies or the platform-appropriate
// command emitted by the init script.
// Do not use pnpm exec from the repo root or any Node binary whose module
// lookup cannot resolve the builder's sibling node_modules/@oai/artifact-tool.

const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const DECK_ID = "dexy-investor-deck";
const OUT_DIR = "/Users/vivian/Documents/Roven IDE/B2A/dexy/deck/outputs";
const REF_DIR = "/Users/vivian/Documents/Roven IDE/B2A/dexy/deck/references";
const SCRATCH_DIR = path.resolve(process.env.PPTX_SCRATCH_DIR || path.join("tmp", "slides", DECK_ID));
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const VERIFICATION_DIR = path.join(SCRATCH_DIR, "verification");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");
const MAX_RENDER_VERIFY_LOOPS = 3;

const INK = "#101214";
const GRAPHITE = "#30363A";
const MUTED = "#687076";
const PAPER = "#F7F4ED";
const PAPER_96 = "#F7F4EDF5";
const WHITE = "#FFFFFF";
const ACCENT = "#27C47D";
const ACCENT_DARK = "#116B49";
const GOLD = "#D7A83D";
const CORAL = "#E86F5B";
const TRANSPARENT = "#00000000";

const TITLE_FACE = "Caladea";
const BODY_FACE = "Lato";
const MONO_FACE = "Aptos Mono";

const FALLBACK_PLATE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const SOURCES = {
  primary: "Dexy internal strategy synthesis based on founder research, X-source appendix, and public pricing/product references.",
};

const SLIDES = [
  {
    "kicker": "HYPERLIQUID OPERATOR INFRA",
    "title": "Dexy",
    "subtitle": "The risk attribution and event alert layer for Hyperliquid operators.",
    "expectedVisual": "Minimal title slide with one core framing statement and clean institutional tone.",
    "moment": "See where risk is building. See where profit is leaking.",
    "notes": "Open with the problem framing: this is not another alpha product. Dexy is for operators who already trade, but still lack a clean control layer for risk, attribution, and alerts.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "PROBLEM",
    "title": "Traders are not dying from lack of signal.",
    "subtitle": "They are dying from lack of visibility into risk, drag, and explanation.",
    "expectedVisual": "Three-card problem breakdown.",
    "cards": [
      [
        "Sudden death",
        "High leverage plus weak monitoring. Users often realize fragility too late."
      ],
      [
        "Slow bleed",
        "Funding, fees, and slippage quietly eat profit even when direction is right."
      ],
      [
        "No post-trade truth",
        "Users see the result, but not the reason behind it."
      ]
    ],
    "notes": "Make the core point explicit: the wedge is not signal discovery. It is operator visibility and explanation.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "WHY NOW",
    "title": "Hyperliquid created a dense new operator market.",
    "subtitle": "One venue now concentrates enough active perp behavior, public observability, and tooling fragmentation to support a focused control-layer business.",
    "expectedVisual": "Metric slide that frames the market shape, not financial certainty.",
    "metrics": [
      [
        "1 venue",
        "Best wedge market",
        "Start Hyperliquid-first instead of trying to solve all onchain trading."
      ],
      [
        "3 pains",
        "Risk, leakage, explanation",
        "The product thesis is built around sudden death, slow bleed, and unclear outcomes."
      ],
      [
        "2 phases",
        "Humans first, agents later",
        "Subscription and workflow first. API, MCP, and x402 later."
      ]
    ],
    "notes": "This is a market-structure slide, not a TAM slide. Emphasize density and timing over false precision.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "PRODUCT",
    "title": "Dexy is the operator control layer.",
    "subtitle": "It does not tell users what to buy. It tells them what is dangerous, what is leaking, and what to watch next.",
    "expectedVisual": "Three-card product definition.",
    "cards": [
      [
        "Risk layer",
        "Rank the most dangerous open positions using leverage, margin mode, and liquidation distance."
      ],
      [
        "Attribution layer",
        "Break PnL into direction, funding drag, fee drag, and execution drag."
      ],
      [
        "Alert layer",
        "Push event-prioritized alerts before the user opens a dashboard."
      ]
    ],
    "notes": "This is the most important product-definition slide. Keep it crisp and avoid drifting into generic AI language.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "WORKFLOW",
    "title": "From wallet state to action priority.",
    "subtitle": "Dexy turns fragmented public observability into one ranked operator workflow.",
    "expectedVisual": "Four-step workflow cards.",
    "cards": [
      [
        "Input",
        "Read wallet and position state from Hyperliquid."
      ],
      [
        "Interpret",
        "Score risk, detect drag, and identify the biggest loss driver."
      ],
      [
        "Prioritize",
        "Tell the operator what to watch first and why."
      ]
    ],
    "notes": "Narrate this as a workflow compression story. The user does not buy more data. They buy less confusion and better action order.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "ICP",
    "title": "Human operators first.",
    "subtitle": "Dexy starts with the users most likely to pay for visibility before it expands into machine rails.",
    "expectedVisual": "Persona / segment metric cards.",
    "metrics": [
      [
        "Primary",
        "Active HL traders",
        "Users with recurring exposure and repeated monitoring burden."
      ],
      [
        "Secondary",
        "Strategy operators",
        "Small teams or bot runners without a fully productized internal risk stack."
      ],
      [
        "Not yet",
        "Autonomous agents",
        "Machine-native payments and agent usage are phase two, not the starting buyer."
      ]
    ],
    "notes": "Make the anti-ICP explicit. This helps investors trust that the wedge is disciplined.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "WHY THEY PAY",
    "title": "Dexy is not paid for intelligence. It is paid for fewer mistakes.",
    "subtitle": "The product earns the right to charge only if it changes behavior.",
    "expectedVisual": "Value articulation cards.",
    "cards": [
      [
        "Catch danger earlier",
        "Show which position is becoming fragile before risk becomes obvious."
      ],
      [
        "Explain leakage",
        "Show when profit disappears through funding, fees, or execution."
      ],
      [
        "Reduce monitoring overhead",
        "Replace repeated wallet checking with prioritized alerts and summaries."
      ]
    ],
    "notes": "Stress that the product is not a content product. It is a repeated workflow product.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "BUSINESS MODEL",
    "title": "Start as operator SaaS. Expand into workflow and machine rails.",
    "subtitle": "The floor is subscription. The ceiling rises when Dexy becomes part of workflow, API, and eventually machine usage.",
    "expectedVisual": "Three-card monetization ladder.",
    "cards": [
      [
        "Phase 1",
        "Human-first subscription for alerts, attribution, and wallet monitoring."
      ],
      [
        "Phase 2",
        "API, webhooks, and MCP for deeper operator workflow."
      ],
      [
        "Phase 3",
        "Machine rails such as x402, and possibly flow-linked monetization later."
      ]
    ],
    "notes": "Frame this slide as floor vs ceiling logic. Do not oversell phase 3 as guaranteed.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "COMPETITION",
    "title": "The market is fragmented, but the wedge is still open.",
    "subtitle": "Dexy sits between generic analytics and execution products: wallet-specific, attribution-first, and alert-first.",
    "expectedVisual": "Three-card competitive structure.",
    "metrics": [
      [
        "Native tools",
        "Good defaults",
        "Hyperliquid owns execution, but not necessarily deep operator-specific attribution."
      ],
      [
        "Analytics tools",
        "Paid category exists",
        "Nansen, CoinMarketMan, and others prove public data can support subscription products."
      ],
      [
        "Workflow tools",
        "Higher ceiling",
        "Hyperdash and 3Commas show workflow and flow monetize better than static dashboards."
      ]
    ],
    "notes": "Be explicit that the hidden competitor is user self-assembly: native UI + dashboards + Telegram + spreadsheets.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "CASE STUDY",
    "title": "A dangerous SP500 short shows the problem clearly.",
    "subtitle": "This is the kind of wallet state Dexy should explain better than a raw dashboard.",
    "expectedVisual": "Three-card case breakdown.",
    "cards": [
      [
        "Visible state",
        "Large short exposure, high leverage, negative funding, and tightening liquidation distance."
      ],
      [
        "What most tools show",
        "A red PnL number and raw fields that still need interpretation."
      ],
      [
        "What Dexy should say",
        "Direction is not the only issue. Funding and leverage are compounding the loss."
      ]
    ],
    "notes": "This slide helps investors feel the wedge. It should feel concrete and operator-real, not abstract.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "ROADMAP",
    "title": "One wedge at a time.",
    "subtitle": "The roadmap is intentionally narrow at the start and only expands after repeated paid usage is proven.",
    "expectedVisual": "Three-step roadmap cards.",
    "cards": [
      [
        "0–3 months",
        "Wallet risk snapshots, funding and fee attribution, and Telegram alerts."
      ],
      [
        "3–6 months",
        "Replay, exports, richer attribution, and multi-wallet workflows."
      ],
      [
        "6–12 months",
        "API, MCP, and machine rails only after the human wedge proves sticky."
      ]
    ],
    "notes": "This slide should make the discipline visible. No broad platform ambition too early.",
    "sources": [
      "primary"
    ]
  },
  {
    "kicker": "RAISE",
    "title": "We are raising to prove a paid operator workflow wedge.",
    "subtitle": "The goal is not to fund a huge platform from day one. The goal is to prove repeated, paid usage of risk attribution and alerting on Hyperliquid.",
    "expectedVisual": "Three metric cards as milestones.",
    "metrics": [
      [
        "Milestone 1",
        "Repeated usage",
        "Users return because the workflow changes what they watch and do."
      ],
      [
        "Milestone 2",
        "Paid wedge",
        "Users pay for risk and attribution, not just curiosity or signal."
      ],
      [
        "Milestone 3",
        "Expansion option",
        "Only after workflow proof do we deepen into API, MCP, and machine rails."
      ]
    ],
    "notes": "Keep the ask disciplined: this is milestone capital to prove the wedge, not narrative capital to pretend the whole platform already exists.",
    "sources": [
      "primary"
    ]
  }
];

const inspectRecords = [];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  if (!bytes.byteLength) {
    throw new Error(`Image file is empty: ${imagePath}`);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function normalizeImageConfig(config) {
  if (!config.path) {
    return config;
  }
  const { path: imagePath, ...rest } = config;
  return {
    ...rest,
    blob: await readImageBlob(imagePath),
  };
}

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const obsoleteFinalArtifacts = [
    "preview",
    "verification",
    "inspect.ndjson",
    ["presentation", "proto.json"].join("_"),
    ["quality", "report.json"].join("_"),
  ];
  for (const obsolete of obsoleteFinalArtifacts) {
    await fs.rm(path.join(OUT_DIR, obsolete), { recursive: true, force: true });
  }
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(VERIFICATION_DIR, { recursive: true });
}

function lineConfig(fill = TRANSPARENT, width = 0) {
  return { style: "solid", fill, width };
}

function recordShape(slideNo, shape, role, shapeType, x, y, w, h) {
  if (!slideNo) return;
  inspectRecords.push({
    kind: "shape",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    shapeType,
    bbox: [x, y, w, h],
  });
}

function addShape(slide, geometry, x, y, w, h, fill = TRANSPARENT, line = TRANSPARENT, lineWidth = 0, meta = {}) {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: lineConfig(line, lineWidth),
  });
  recordShape(meta.slideNo, shape, meta.role || geometry, geometry, x, y, w, h);
  return shape;
}

function normalizeText(text) {
  if (Array.isArray(text)) {
    return text.map((item) => String(item ?? "")).join("\n");
  }
  return String(text ?? "");
}

function textLineCount(text) {
  const value = normalizeText(text);
  if (!value.trim()) {
    return 0;
  }
  return Math.max(1, value.split(/\n/).length);
}

function requiredTextHeight(text, fontSize, lineHeight = 1.18, minHeight = 8) {
  const lines = textLineCount(text);
  if (lines === 0) {
    return minHeight;
  }
  return Math.max(minHeight, lines * fontSize * lineHeight);
}

function assertTextFits(text, boxHeight, fontSize, role = "text") {
  const required = requiredTextHeight(text, fontSize);
  const tolerance = Math.max(2, fontSize * 0.08);
  if (normalizeText(text).trim() && boxHeight + tolerance < required) {
    throw new Error(
      `${role} text box is too short: height=${boxHeight.toFixed(1)}, required>=${required.toFixed(1)}, ` +
        `lines=${textLineCount(text)}, fontSize=${fontSize}, text=${JSON.stringify(normalizeText(text).slice(0, 90))}`,
    );
  }
}

function wrapText(text, widthChars) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > widthChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.join("\n");
}

function recordText(slideNo, shape, role, text, x, y, w, h) {
  const value = normalizeText(text);
  inspectRecords.push({
    kind: "textbox",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    text: value,
    textPreview: value.replace(/\n/g, " | ").slice(0, 180),
    textChars: value.length,
    textLines: textLineCount(value),
    bbox: [x, y, w, h],
  });
}

function recordImage(slideNo, image, role, imagePath, x, y, w, h) {
  inspectRecords.push({
    kind: "image",
    slide: slideNo,
    id: image?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    path: imagePath,
    bbox: [x, y, w, h],
  });
}

function applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle) {
  box.text = text;
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = Boolean(bold);
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.typeface = face;
  box.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (autoFit) {
    box.text.autoFit = autoFit;
  }
  if (listStyle) {
    box.text.style = "list";
  }
}

function addText(
  slide,
  slideNo,
  text,
  x,
  y,
  w,
  h,
  {
    size = 22,
    color = INK,
    bold = false,
    face = BODY_FACE,
    align = "left",
    valign = "top",
    fill = TRANSPARENT,
    line = TRANSPARENT,
    lineWidth = 0,
    autoFit = null,
    listStyle = false,
    checkFit = true,
    role = "text",
  } = {},
) {
  if (!checkFit && textLineCount(text) > 1) {
    throw new Error("checkFit=false is only allowed for single-line headers, footers, and captions.");
  }
  if (checkFit) {
    assertTextFits(text, h, size, role);
  }
  const box = addShape(slide, "rect", x, y, w, h, fill, line, lineWidth);
  applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle);
  recordText(slideNo, box, role, text, x, y, w, h);
  return box;
}

async function addImage(slide, slideNo, config, position, role, sourcePath = null) {
  const image = slide.images.add(await normalizeImageConfig(config));
  image.position = position;
  recordImage(slideNo, image, role, sourcePath || config.path || config.uri || "inline-data-url", position.left, position.top, position.width, position.height);
  return image;
}

async function addPlate(slide, slideNo, opacityPanel = false) {
  slide.background.fill = PAPER;
  const platePath = path.join(REF_DIR, `slide-${String(slideNo).padStart(2, "0")}.png`);
  if (await pathExists(platePath)) {
    await addImage(
      slide,
      slideNo,
      { path: platePath, fit: "cover", alt: `Text-free art-direction plate for slide ${slideNo}` },
      { left: 0, top: 0, width: W, height: H },
      "art plate",
      platePath,
    );
  } else {
    await addImage(
      slide,
      slideNo,
      { dataUrl: FALLBACK_PLATE_DATA_URL, fit: "cover", alt: `Fallback blank art plate for slide ${slideNo}` },
      { left: 0, top: 0, width: W, height: H },
      "fallback art plate",
      "fallback-data-url",
    );
  }
  if (opacityPanel) {
    addShape(slide, "rect", 0, 0, W, H, "#FFFFFFB8", TRANSPARENT, 0, { slideNo, role: "plate readability overlay" });
  }
}

function addHeader(slide, slideNo, kicker, idx, total) {
  addText(slide, slideNo, String(kicker || "").toUpperCase(), 64, 34, 430, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    checkFit: false,
    role: "header",
  });
  addText(slide, slideNo, `${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 1114, 34, 104, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    align: "right",
    checkFit: false,
    role: "header",
  });
  addShape(slide, "rect", 64, 64, 1152, 2, INK, TRANSPARENT, 0, { slideNo, role: "header rule" });
  addShape(slide, "ellipse", 57, 57, 16, 16, ACCENT, INK, 2, { slideNo, role: "header marker" });
}

function addTitleBlock(slide, slideNo, title, subtitle = null, x = 64, y = 86, w = 780, dark = false) {
  const titleColor = dark ? PAPER : INK;
  const bodyColor = dark ? PAPER : GRAPHITE;
  addText(slide, slideNo, title, x, y, w, 142, {
    size: 40,
    color: titleColor,
    bold: true,
    face: TITLE_FACE,
    role: "title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + 148, Math.min(w, 720), 70, {
      size: 19,
      color: bodyColor,
      face: BODY_FACE,
      role: "subtitle",
    });
  }
}

function addIconBadge(slide, slideNo, x, y, accent = ACCENT, kind = "signal") {
  addShape(slide, "ellipse", x, y, 54, 54, PAPER_96, INK, 1.2, { slideNo, role: "icon badge" });
  if (kind === "flow") {
    addShape(slide, "ellipse", x + 13, y + 18, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "ellipse", x + 31, y + 27, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 22, y + 25, 19, 3, INK, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  } else if (kind === "layers") {
    addShape(slide, "roundRect", x + 13, y + 15, 26, 13, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 18, y + 24, 26, 13, GOLD, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 23, y + 33, 20, 10, CORAL, INK, 1, { slideNo, role: "icon glyph" });
  } else {
    addShape(slide, "rect", x + 16, y + 29, 6, 12, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 25, y + 21, 6, 20, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 34, y + 14, 6, 27, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  }
}

function addCard(slide, slideNo, x, y, w, h, label, body, { accent = ACCENT, fill = PAPER_96, line = INK, iconKind = "signal" } = {}) {
  if (h < 156) {
    throw new Error(`Card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=156.`);
  }
  addShape(slide, "roundRect", x, y, w, h, fill, line, 1.2, { slideNo, role: `card panel: ${label}` });
  addShape(slide, "rect", x, y, 8, h, accent, TRANSPARENT, 0, { slideNo, role: `card accent: ${label}` });
  addIconBadge(slide, slideNo, x + 22, y + 24, accent, iconKind);
  addText(slide, slideNo, label, x + 88, y + 22, w - 108, 28, {
    size: 15,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "card label",
  });
  const wrapped = wrapText(body, Math.max(28, Math.floor(w / 13)));
  const bodyY = y + 86;
  const bodyH = h - (bodyY - y) - 22;
  if (bodyH < 54) {
    throw new Error(`Card body area is too short: height=${bodyH.toFixed(1)}, cardHeight=${h.toFixed(1)}, label=${JSON.stringify(label)}.`);
  }
  addText(slide, slideNo, wrapped, x + 24, bodyY, w - 48, bodyH, {
    size: 17,
    color: INK,
    face: BODY_FACE,
    role: `card body: ${label}`,
  });
}

function addMetricCard(slide, slideNo, x, y, w, h, metric, label, note = null, accent = ACCENT) {
  if (h < 132) {
    throw new Error(`Metric card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=132.`);
  }
  addShape(slide, "roundRect", x, y, w, h, PAPER_96, INK, 1.2, { slideNo, role: `metric panel: ${label}` });
  addShape(slide, "rect", x, y, w, 7, accent, TRANSPARENT, 0, { slideNo, role: `metric accent: ${label}` });
  addText(slide, slideNo, metric, x + 22, y + 24, w - 44, 54, {
    size: 34,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 24, y + 82, w - 48, 38, {
    size: 16,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 24, y + h - 42, w - 48, 22, {
      size: 10,
      color: MUTED,
      face: BODY_FACE,
      role: "metric note",
    });
  }
}

function addChip(slide, slideNo, text, x, y, w, fill = PAPER_96, color = ACCENT_DARK) {
  addShape(slide, "roundRect", x, y, w, 30, fill, INK, 1, { slideNo, role: "chip" });
  addText(slide, slideNo, text, x + 10, y + 7, w - 20, 16, {
    size: 11,
    color,
    bold: true,
    face: MONO_FACE,
    align: "center",
    checkFit: false,
    role: "chip text",
  });
}

function addStageBox(slide, slideNo, x, y, w, h, title, body, accent = ACCENT) {
  addShape(slide, "roundRect", x, y, w, h, PAPER_96, INK, 1.2, { slideNo, role: "stage box" });
  addShape(slide, "rect", x, y, 8, h, accent, TRANSPARENT, 0, { slideNo, role: "stage accent" });
  addText(slide, slideNo, title, x + 24, y + 18, w - 40, 28, {
    size: 15,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "stage title",
  });
  addText(slide, slideNo, body, x + 24, y + 52, w - 40, h - 70, {
    size: 17,
    color: INK,
    face: BODY_FACE,
    role: "stage body",
  });
}

function addArrow(slide, slideNo, x, y, w = 68, h = 24) {
  addShape(slide, "rightArrow", x, y, w, h, ACCENT, INK, 1, { slideNo, role: "arrow" });
}

async function slideMarketStructure(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 860);

  addStageBox(slide, idx, 70, 280, 250, 118, "Native UI", "Execution and the default trading surface.", ACCENT);
  addStageBox(slide, idx, 70, 430, 250, 118, "Third-party tools", "Dashboards, bots, and fragmented alerts.", GOLD);
  addStageBox(slide, idx, 70, 580, 250, 90, "Manual review", "Telegram, sheets, and operator memory.", CORAL);

  addArrow(slide, idx, 338, 462, 72, 28);
  addStageBox(slide, idx, 430, 396, 350, 152, "Operator reality", "The user does not lack information. The user lacks priority, compression, and explanation.", ACCENT_DARK);
  addArrow(slide, idx, 798, 462, 72, 28);
  addStageBox(slide, idx, 890, 350, 310, 242, "Dexy control layer", "Wallet-aware risk ranking.\nFunding / fee attribution.\nEvent alerts.\nOne-line action priority.", ACCENT);

  addChip(slide, idx, "Fragmented inputs", 116, 246, 154, PAPER_96, CORAL);
  addChip(slide, idx, "Compression layer", 530, 362, 156, PAPER_96, ACCENT_DARK);
  addChip(slide, idx, "Action priority", 972, 316, 142, PAPER_96, ACCENT_DARK);
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideWorkflowDiagram(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 860);

  const steps = [
    ["Wallet state", "Read positions, leverage, margin mode, PnL, and funding."],
    ["Risk engine", "Find the most dangerous open position."],
    ["Attribution", "Detect where drag or loss is coming from."],
    ["Alert", "Tell the user what to watch first and why."],
  ];
  const xs = [84, 356, 628, 900];
  const accents = [ACCENT, GOLD, CORAL, ACCENT_DARK];
  for (let i = 0; i < steps.length; i += 1) {
    addStageBox(slide, idx, xs[i], 408, 220, 186, steps[i][0], steps[i][1], accents[i]);
    if (i < steps.length - 1) addArrow(slide, idx, xs[i] + 228, 486, 44, 22);
  }
  addChip(slide, idx, "Workflow compression", 508, 358, 190, PAPER_96, ACCENT_DARK);
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideBusinessModelDiagram(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 900);

  addChip(slide, idx, "Commercial floor", 126, 246, 160, PAPER_96, ACCENT_DARK);
  addChip(slide, idx, "Expansion layer", 558, 246, 160, PAPER_96, ACCENT_DARK);
  addChip(slide, idx, "Commercial ceiling", 960, 246, 180, PAPER_96, ACCENT_DARK);

  addStageBox(slide, idx, 86, 286, 280, 224, "Phase 1: Subscription", "Human-first plans for alerts, attribution, and wallet monitoring.\n\nThis is the realistic floor.", ACCENT);
  addArrow(slide, idx, 392, 388, 70, 26);
  addStageBox(slide, idx, 486, 286, 300, 224, "Phase 2: API / MCP", "Deeper workflow usage through webhooks, integrations, and machine-readable outputs.", GOLD);
  addArrow(slide, idx, 810, 388, 70, 26);
  addStageBox(slide, idx, 904, 286, 290, 224, "Phase 3: Machine rails", "x402 and machine-native usage later.\nPotential flow-linked revenue only after workflow proof.", CORAL);

  addText(slide, idx, "Dexy starts as operator SaaS, not as a speculative agent economy product.", 86, 548, 1108, 38, {
    size: 20,
    color: INK,
    face: BODY_FACE,
    role: "bm summary",
  });
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideCompetitionDiagram(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 920);

  addShape(slide, "rect", 210, 300, 760, 2, INK, TRANSPARENT, 0, { slideNo: idx, role: "x-axis" });
  addShape(slide, "rect", 210, 300, 2, 290, INK, TRANSPARENT, 0, { slideNo: idx, role: "y-axis" });
  addText(slide, idx, "Generic analytics", 84, 594, 128, 18, { size: 11, color: MUTED, face: MONO_FACE, checkFit: false, role: "axis" });
  addText(slide, idx, "Workflow native", 914, 594, 140, 18, { size: 11, color: MUTED, face: MONO_FACE, checkFit: false, role: "axis" });
  addText(slide, idx, "Broad market", 118, 318, 84, 18, { size: 11, color: MUTED, face: MONO_FACE, checkFit: false, role: "axis" });
  addText(slide, idx, "Wallet-specific depth", 88, 144, 118, 34, { size: 11, color: MUTED, face: MONO_FACE, role: "axis" });

  addStageBox(slide, idx, 330, 420, 170, 94, "Nansen", "Broad onchain intelligence", GOLD);
  addStageBox(slide, idx, 280, 522, 180, 94, "CoinGlass", "Market-level risk data", CORAL);
  addStageBox(slide, idx, 520, 390, 190, 90, "HyperTracker / CMM", "Paid HL analytics and data", ACCENT);
  addStageBox(slide, idx, 772, 428, 170, 90, "Hyperdash", "Workflow + flow", ACCENT_DARK);
  addStageBox(slide, idx, 590, 522, 180, 94, "Native UI", "Execution default", PAPER_96);
  addStageBox(slide, idx, 820, 286, 240, 144, "Dexy", "Wallet-specific,\nattribution-first,\nalert-first operator layer", ACCENT);

  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideCaseStudyDiagram(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 900);

  addStageBox(slide, idx, 86, 258, 310, 300, "Observed wallet state", "SP500 short\nLarge notional\n18x isolated\n28.77x effective leverage\nNegative funding burden\n43% liquidation distance", CORAL);
  addArrow(slide, idx, 426, 400, 82, 30);
  addStageBox(slide, idx, 530, 258, 300, 300, "What most tools show", "A red PnL number and several raw fields.\n\nUseful, but still easy to misread under pressure.", GOLD);
  addArrow(slide, idx, 860, 400, 82, 30);
  addStageBox(slide, idx, 954, 236, 240, 344, "What Dexy should say", "This is not just a wrong directional call.\n\nFunding and leverage are compounding the loss.\n\nThe highest-priority variable is liquidation distance.", ACCENT);

  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideRoadmapDiagram(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 900);

  addShape(slide, "rect", 120, 468, 1030, 4, INK, TRANSPARENT, 0, { slideNo: idx, role: "timeline" });
  addShape(slide, "ellipse", 180, 448, 40, 40, ACCENT, INK, 2, { slideNo: idx, role: "timeline node" });
  addShape(slide, "ellipse", 596, 448, 40, 40, GOLD, INK, 2, { slideNo: idx, role: "timeline node" });
  addShape(slide, "ellipse", 1012, 448, 40, 40, CORAL, INK, 2, { slideNo: idx, role: "timeline node" });

  addStageBox(slide, idx, 78, 274, 250, 146, "0–3 months", "Risk snapshots, funding and fee attribution, and Telegram alerts.", ACCENT);
  addStageBox(slide, idx, 492, 274, 250, 146, "3–6 months", "Replay, exports, richer attribution, and multi-wallet workflows.", GOLD);
  addStageBox(slide, idx, 906, 274, 250, 146, "6–12 months", "API, MCP, and machine rails only after the human wedge proves sticky.", CORAL);

  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

function addNotes(slide, body, sourceKeys) {
  const sourceLines = (sourceKeys || []).map((key) => `- ${SOURCES[key] || key}`).join("\n");
  slide.speakerNotes.setText(`${body || ""}\n\n[Sources]\n${sourceLines}`);
}

function addReferenceCaption(slide, slideNo) {
  addText(
    slide,
    slideNo,
    "Generated art plate is used as visual direction; all meaningful copy and structure are editable PowerPoint objects.",
    64,
    674,
    980,
    22,
    {
      size: 10,
      color: MUTED,
      face: BODY_FACE,
      checkFit: false,
      role: "caption",
    },
  );
}

async function slideCover(presentation) {
  const slideNo = 1;
  const data = SLIDES[0];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFCC", TRANSPARENT, 0, { slideNo, role: "cover contrast overlay" });
  addShape(slide, "rect", 64, 86, 7, 455, ACCENT, TRANSPARENT, 0, { slideNo, role: "cover accent rule" });
  addText(slide, slideNo, data.kicker, 86, 88, 520, 26, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "kicker",
  });
  addText(slide, slideNo, data.title, 82, 130, 785, 184, {
    size: 48,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover title",
  });
  addText(slide, slideNo, data.subtitle, 86, 326, 610, 86, {
    size: 20,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "cover subtitle",
  });
  addShape(slide, "roundRect", 86, 456, 390, 92, PAPER_96, INK, 1.2, { slideNo, role: "cover moment panel" });
  addText(slide, slideNo, data.moment || "Replace with core idea", 112, 478, 336, 40, {
    size: 23,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover moment",
  });
  addReferenceCaption(slide, slideNo);
  addNotes(slide, data.notes, data.sources);
}

async function slideCards(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFB8", TRANSPARENT, 0, { slideNo: idx, role: "content contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  const cards = data.cards?.length
    ? data.cards
    : [
        ["Replace", "Add a specific, sourced point for this slide."],
        ["Author", "Use native PowerPoint chart objects for charts; use deterministic geometry for cards and callouts."],
        ["Verify", "Render previews, inspect them at readable size, and fix actionable layout issues within 3 total render loops."],
      ];
  const cols = Math.min(3, cards.length);
  const cardW = (1114 - (cols - 1) * 24) / cols;
  const iconKinds = ["signal", "flow", "layers"];
  for (let cardIdx = 0; cardIdx < cols; cardIdx += 1) {
    const [label, body] = cards[cardIdx];
    const x = 84 + cardIdx * (cardW + 24);
    addCard(slide, idx, x, 388, cardW, 228, label, body, { iconKind: iconKinds[cardIdx % iconKinds.length] });
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideMetrics(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "metrics contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 700);
  const metrics = data.metrics || [
    ["00", "Replace metric", "Source"],
    ["00", "Replace metric", "Source"],
    ["00", "Replace metric", "Source"],
  ];
  const accents = [ACCENT, GOLD, CORAL];
  for (let metricIdx = 0; metricIdx < Math.min(3, metrics.length); metricIdx += 1) {
    const [metric, label, note] = metrics[metricIdx];
    addMetricCard(slide, idx, 92 + metricIdx * 370, 404, 330, 174, metric, label, note, accents[metricIdx % accents.length]);
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function createDeck() {
  await ensureDirs();
  if (!SLIDES.length) {
    throw new Error("SLIDES must contain at least one slide.");
  }
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  await slideCover(presentation);
  for (let idx = 2; idx <= SLIDES.length; idx += 1) {
    const data = SLIDES[idx - 1];
    if (idx === 3) {
      await slideMarketStructure(presentation, idx);
    } else if (idx === 5) {
      await slideWorkflowDiagram(presentation, idx);
    } else if (idx === 8) {
      await slideBusinessModelDiagram(presentation, idx);
    } else if (idx === 9) {
      await slideCompetitionDiagram(presentation, idx);
    } else if (idx === 10) {
      await slideCaseStudyDiagram(presentation, idx);
    } else if (idx === 11) {
      await slideRoadmapDiagram(presentation, idx);
    } else if (data.metrics) {
      await slideMetrics(presentation, idx);
    } else {
      await slideCards(presentation, idx);
    }
  }
  return presentation;
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspectArtifact(presentation) {
  inspectRecords.unshift({
    kind: "deck",
    id: DECK_ID,
    slideCount: presentation.slides.count,
    slideSize: { width: W, height: H },
  });
  presentation.slides.items.forEach((slide, index) => {
    inspectRecords.splice(index + 1, 0, {
      kind: "slide",
      slide: index + 1,
      id: slide?.id || `slide-${index + 1}`,
    });
  });
  const lines = inspectRecords.map((record) => JSON.stringify(record)).join("\n") + "\n";
  await fs.writeFile(INSPECT_PATH, lines, "utf8");
}

async function currentRenderLoopCount() {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  if (!(await pathExists(logPath))) return 0;
  const previous = await fs.readFile(logPath, "utf8");
  return previous.split(/\r?\n/).filter((line) => line.trim()).length;
}

async function nextRenderLoopNumber() {
  return (await currentRenderLoopCount()) + 1;
}

async function appendRenderVerifyLoop(presentation, previewPaths, pptxPath) {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  const priorCount = await currentRenderLoopCount();
  const record = {
    kind: "render_verify_loop",
    deckId: DECK_ID,
    loop: priorCount + 1,
    maxLoops: MAX_RENDER_VERIFY_LOOPS,
    capReached: priorCount + 1 >= MAX_RENDER_VERIFY_LOOPS,
    timestamp: new Date().toISOString(),
    slideCount: presentation.slides.count,
    previewCount: previewPaths.length,
    previewDir: PREVIEW_DIR,
    inspectPath: INSPECT_PATH,
    pptxPath,
  };
  await fs.appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  return record;
}

async function verifyAndExport(presentation) {
  await ensureDirs();
  const nextLoop = await nextRenderLoopNumber();
  if (nextLoop > MAX_RENDER_VERIFY_LOOPS) {
    throw new Error(
      `Render/verify/fix loop cap reached: ${MAX_RENDER_VERIFY_LOOPS} total renders are allowed. ` +
        "Do not rerender; note any remaining visual issues in the final response.",
    );
  }
  await writeInspectArtifact(presentation);
  const previewPaths = [];
  for (let idx = 0; idx < presentation.slides.items.length; idx += 1) {
    const slide = presentation.slides.items[idx];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW_DIR, `slide-${String(idx + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(preview, previewPath);
    previewPaths.push(previewPath);
  }
  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "output.pptx");
  await pptxBlob.save(pptxPath);
  const loopRecord = await appendRenderVerifyLoop(presentation, previewPaths, pptxPath);
  return { pptxPath, loopRecord };
}

const presentation = await createDeck();
const result = await verifyAndExport(presentation);
console.log(result.pptxPath);
