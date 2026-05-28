import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { GridConfig, ResolvedSection, Slot } from '../types';

/**
 * ColumnGrid — the shared 3-column primitive.
 *
 * Used by `WaterfallShell` (for the whole game area) and by `TabShell`
 * (for each tab's interior). Hides any column whose `visible === false`
 * or whose width resolves to '0px'.
 *
 * Sections are pre-sorted by the caller (resolveLayout output keeps source
 * order; we sort by `slot.order` here once).
 */
export interface IColumnGridProps {
  grid: GridConfig;
  sections: ResolvedSection[];
  /** How to read each section's slot+order. */
  pickSlot: (s: ResolvedSection) => { slot: Slot; order: number } | undefined;
  renderSection: (s: ResolvedSection) => ReactNode;
  className?: string;
}

const SLOTS: Slot[] = ['left', 'middle', 'right'];

function columnVisible(grid: GridConfig, slot: Slot): boolean {
  const spec = grid.columns[slot];
  if (!spec) return false;
  if (spec.visible === false) return false;
  return spec.width !== '0px' && spec.width !== '0';
}

export function ColumnGrid({
  grid,
  sections,
  pickSlot,
  renderSection,
  className,
}: IColumnGridProps): React.JSX.Element {
  const buckets: Record<Slot, ResolvedSection[]> = {
    left: [],
    middle: [],
    right: [],
  };

  for (const section of sections) {
    if (!section.visible) continue;
    if (section.pin && section.pin !== 'none') continue;
    const placement = pickSlot(section);
    if (!placement) continue;
    if (!columnVisible(grid, placement.slot)) continue;
    buckets[placement.slot].push(section);
  }

  for (const slot of SLOTS) {
    buckets[slot].sort((a, b) => {
      const ao = pickSlot(a)?.order ?? 0;
      const bo = pickSlot(b)?.order ?? 0;
      return ao - bo;
    });
  }

  const visibleSlots = SLOTS.filter((s) => columnVisible(grid, s));
  const template = visibleSlots
    .map((s) => grid.columns[s]?.width ?? '1fr')
    .join(' ');

  const style: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: template,
    gap: grid.gap,
  };

  return (
    <div className={cn('h-full min-h-0', className)} style={style}>
      {visibleSlots.map((slot) => (
        <div
          key={slot}
          data-column={slot}
          className='flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto'
        >
          {buckets[slot].map((section) => (
            <div key={section.id}>{renderSection(section)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
