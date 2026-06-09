/**
 * Layout DSL — single source of truth for how the in-game shell is composed.
 *
 * Two render modes share one config:
 *   • `tab`        — sections are grouped by `tab.container`, each tab renders
 *                    its own 3-column grid. This is the default game table.
 *   • `waterfall`  — the whole game scrolls as one screen; sections fall into
 *                    `waterfall.slot` columns. Tab triggers are hidden.
 *
 * Pinned sections (TopBar / ActionBar / Hand) live outside the flow and are
 * rendered by `<PinnedLayer />` regardless of mode.
 */

export type SectionId =
  | 'solarSystem'
  | 'planetBoard'
  | 'techBoard'
  | 'alienBoard'
  | 'cardRows'
  | 'playerBoard'
  | 'log'
  | 'endGame'
  | 'hand'
  | 'topBar'
  | 'actionBar';

export type Slot = 'left' | 'middle' | 'right';
export type LayoutMode = 'tab' | 'waterfall';

export type PinMode =
  | 'none'
  | 'sticky-top'
  | 'sticky-bottom'
  | 'fixed-top'
  | 'fixed-bottom'
  | 'floating';

export interface SizeConfig {
  width?: string;
  height?: string;
  minH?: string;
  maxH?: string;
  minW?: string;
  maxW?: string;
  /** Flex grow inside its column. Default 0; log defaults to 1. */
  grow?: number;
  /** Visual scale for dense boards inside constrained panels. */
  scale?: number;
}

export interface ColumnSpec {
  width: string;
  visible?: boolean;
}

export interface GridConfig {
  columns: {
    left?: ColumnSpec;
    middle?: ColumnSpec;
    right?: ColumnSpec;
  };
  gap: string;
}

export interface TabDef {
  id: string;
  labelKey: string;
  /** Each tab is a mini-grid identical in shape to the waterfall root grid. */
  grid: GridConfig;
}

export interface PinOffset {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface SectionPlacement {
  id: SectionId;
  /** Position when LayoutMode === 'tab'. Omit to hide in tab mode. */
  tab?: { container: string; slot: Slot; order: number };
  /** Position when LayoutMode === 'waterfall'. Omit to hide in waterfall mode. */
  waterfall?: { slot: Slot; order: number };
  /** Override mobile single-column order. Falls back to slot priority + order. */
  mobileOrder?: number;
  pin?: PinMode;
  pinOffset?: PinOffset;
  zIndex?: number;
  size?: SizeConfig;
  visible?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Per-breakpoint override; merged on top of the base placement. */
  responsive?: {
    mobile?: Partial<Omit<SectionPlacement, 'id' | 'responsive'>>;
    desktop?: Partial<Omit<SectionPlacement, 'id' | 'responsive'>>;
  };
}

export interface LayoutOptions {
  showHandDock?: boolean;
  showTopBar?: boolean;
  showActionBar?: boolean;
  /** px width below which we drop to single-column. Default 1024. */
  mobileBreakpoint?: number;
}

export interface LayoutConfig {
  mode: LayoutMode;
  /** Used by waterfall mode and as fallback for mobile. */
  rootGrid: GridConfig;
  tabs: TabDef[];
  defaultTab?: string;
  sections: SectionPlacement[];
  options?: LayoutOptions;
}

/** Resolved variant — every optional default filled, ready to render. */
export interface ResolvedSection extends SectionPlacement {
  pin: PinMode;
  visible: boolean;
}

export interface ResolvedLayout {
  mode: LayoutMode;
  rootGrid: GridConfig;
  tabs: TabDef[];
  defaultTab: string;
  sections: ResolvedSection[];
  options: Required<LayoutOptions>;
}
