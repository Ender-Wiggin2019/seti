import type { LayoutSnapshot, SectionOverrides } from './layoutStore';
import type {
  GridConfig,
  LayoutConfig,
  ResolvedLayout,
  ResolvedSection,
  SectionId,
  SectionPlacement,
} from './types';

/**
 * Merge: preset → overrides → responsive → final ResolvedSection.
 *
 * Source order matters. Later sources win. We always preserve the section's
 * `id` field — overrides can change anything else.
 */

interface ResolveArgs {
  preset: LayoutConfig;
  snapshot: LayoutSnapshot;
  isMobile: boolean;
}

function mergeGridColumns(
  base: GridConfig,
  cols?: { left?: string; middle?: string; right?: string },
): GridConfig {
  if (!cols) return base;
  return {
    ...base,
    columns: {
      left: cols.left
        ? { ...(base.columns.left ?? { width: '0px' }), width: cols.left }
        : base.columns.left,
      middle: cols.middle
        ? { ...(base.columns.middle ?? { width: '1fr' }), width: cols.middle }
        : base.columns.middle,
      right: cols.right
        ? { ...(base.columns.right ?? { width: '0px' }), width: cols.right }
        : base.columns.right,
    },
  };
}

function applyOverrides(
  base: SectionPlacement,
  overrides: SectionOverrides | undefined,
): SectionPlacement {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    size: { ...(base.size ?? {}), ...(overrides.size ?? {}) },
    pinOffset: { ...(base.pinOffset ?? {}), ...(overrides.pinOffset ?? {}) },
    tab: overrides.tab !== undefined ? (overrides.tab ?? undefined) : base.tab,
    waterfall:
      overrides.waterfall !== undefined
        ? (overrides.waterfall ?? undefined)
        : base.waterfall,
  };
}

function applyResponsive(
  placement: SectionPlacement,
  isMobile: boolean,
): SectionPlacement {
  const r = placement.responsive;
  if (!r) return placement;
  const branch = isMobile ? r.mobile : r.desktop;
  if (!branch) return placement;
  return {
    ...placement,
    ...branch,
    size: { ...(placement.size ?? {}), ...(branch.size ?? {}) },
    pinOffset: {
      ...(placement.pinOffset ?? {}),
      ...(branch.pinOffset ?? {}),
    },
  };
}

export function resolveLayout({
  preset,
  snapshot,
  isMobile,
}: ResolveArgs): ResolvedLayout {
  const sections: ResolvedSection[] = preset.sections.map((base) => {
    const sectionId = base.id as SectionId;
    const overridden = applyOverrides(base, snapshot.overrides[sectionId]);
    const responsive = applyResponsive(overridden, isMobile);
    return {
      ...responsive,
      pin: responsive.pin ?? 'none',
      visible: responsive.visible ?? true,
      defaultCollapsed:
        snapshot.collapsed[sectionId] ?? responsive.defaultCollapsed ?? false,
    };
  });

  const rootGrid = mergeGridColumns(preset.rootGrid, snapshot.rootColumns);
  const tabs = preset.tabs.map((t) => ({
    ...t,
    grid: mergeGridColumns(t.grid, snapshot.tabColumns?.[t.id]),
  }));

  return {
    mode: snapshot.mode,
    rootGrid,
    tabs,
    defaultTab: preset.defaultTab ?? tabs[0]?.id ?? 'board',
    sections,
    options: {
      showTopBar: preset.options?.showTopBar ?? true,
      showActionBar: preset.options?.showActionBar ?? true,
      showHandDock: preset.options?.showHandDock ?? true,
      mobileBreakpoint: preset.options?.mobileBreakpoint ?? 1024,
    },
  };
}
