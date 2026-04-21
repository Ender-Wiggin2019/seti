/**
 * Centralized data-testid selectors for game UI elements.
 * Keep in sync with the client component `data-testid` attributes.
 */
export const sel = {
  // ── Bottom bar panels ──────────────────────────────────────
  bottomDashboard: '[data-testid="bottom-dashboard"]',
  bottomHand: '[data-testid="bottom-hand"]',
  bottomActions: '[data-testid="bottom-actions"]',

  // ── Player dashboard ───────────────────────────────────────
  playerDashboard: '[data-testid="player-dashboard"]',
  resourceBar: '[data-testid="resource-bar"]',
  incomeTracker: '[data-testid="income-tracker"]',
  dataPoolView: '[data-testid="data-pool-view"]',

  // ── Hand & missions ────────────────────────────────────────
  handView: '[data-testid="hand-view"]',
  handCard: (cardId: string) => `[data-testid="hand-card-${cardId}"]`,
  playedMissions: '[data-testid="played-missions"]',

  // ── Computer slots ─────────────────────────────────────────
  computerSlotTop: (index: number) =>
    `[data-testid="computer-slot-top-${index}"]`,
  computerSlotBottom: (index: number) =>
    `[data-testid="computer-slot-bottom-${index}"]`,

  // ── Board tabs ─────────────────────────────────────────────
  boardTab: (tab: string) => `[role="tab"]:has-text("${tab}")`,

  // ── Solar system ───────────────────────────────────────────
  solarSpace: (spaceId: string) => `[data-testid="solar-space-${spaceId}"]`,
  wheelLayerRing: (ring: number) => `[data-testid="wheel-layer-ring-${ring}"]`,

  // ── Sectors ────────────────────────────────────────────────
  sectorPair: (position: number) => `[data-testid="sector-pair-${position}"]`,
  sectorNode: (position: number, index: number) =>
    `[data-testid="sector-node-${position}-${index}"]`,

  // ── Planets ────────────────────────────────────────────────
  planetCard: (planet: string) => `[data-testid="planet-card-${planet}"]`,

  // ── Tech board ─────────────────────────────────────────────
  techStack: (tech: string, level: number) =>
    `[data-testid="tech-stack-${tech}-${level}"]`,

  // ── Card row & end-of-round ────────────────────────────────
  cardRow: (cardId: string) => `[data-testid="card-row-${cardId}"]`,
  cardRender: (cardId: string) => `[data-testid="card-render-${cardId}"]`,
  roundStack: (index: number) => `[data-testid="round-stack-${index}"]`,
  roundStackCard: (cardId: string) =>
    `[data-testid="round-stack-card-${cardId}"]`,

  // ── Input prompts ──────────────────────────────────────────
  selectCard: (cardId: string) =>
    `[data-testid="hand-card-${cardId}"], [data-testid="select-card-${cardId}"]`,
  goldTile: (tileId: string) => `[data-testid="gold-tile-${tileId}"]`,

  // ── Action menu & free actions ─────────────────────────────
  actionMenu: (actionType: string) =>
    `[data-testid="action-menu-${actionType}"]`,
  freeActionBar: '[data-testid="free-action-bar"]',
  freeActionToggle: '[data-testid="free-action-toggle"]',
  freeAction: (action: string) => `[data-testid="free-action-${action}"]`,
  undoButton: '[data-testid="undo-button"]',

  // ── Event log ──────────────────────────────────────────────
  eventLog: '[data-testid="event-log"]',
  eventEntry: (index: number) => `[data-testid="event-entry-${index}"]`,

  // ── Input prompt elements ──────────────────────────────────
  inputOption: (optionId: string) => `[data-testid="input-option-${optionId}"]`,
  inputSector: (sector: string) => `[data-testid="input-sector-${sector}"]`,
  inputOrTab: (index: number) => `[data-testid="input-or-tab-${index}"]`,
  inputSelectCard: (cardId: string) =>
    `[data-testid="hand-card-${cardId}"], [data-testid="select-card-${cardId}"]`,
  inputEorCard: (cardId: string) => `[data-testid="input-eor-card-${cardId}"]`,
} as const;
