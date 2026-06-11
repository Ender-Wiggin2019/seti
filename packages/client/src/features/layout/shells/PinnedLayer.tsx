import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { useGameSession } from '../GameSessionContext';
import { useLayout } from '../LayoutContext';
import { useLayoutStore } from '../layoutStore';
import { getSection } from '../sectionRegistry';
import type { PinMode, ResolvedSection } from '../types';
import { SectionFrame } from './SectionFrame';

/** Height of the hand dock when collapsed — only its top rail stays visible. */
export const HAND_COLLAPSED_HEIGHT = '44px';

/**
 * PinnedLayer — renders any section whose `pin` !== 'none' outside the flow.
 * Pin modes:
 *   • sticky-top / sticky-bottom — `position: sticky` inside the layout root
 *   • fixed-top / fixed-bottom   — `position: fixed` at the viewport edge
 *   • floating                   — fixed, with `pinOffset` controlling all sides
 *
 * Sticky variants live inside the document flow so they participate in normal
 * scroll containers (the LayoutShell wraps them in a positioned root). Fixed
 * variants are absolute relative to the viewport.
 */

function pinStyle(section: ResolvedSection): CSSProperties {
  const offset = section.pinOffset ?? {};
  const base: CSSProperties = {
    zIndex: section.zIndex,
    height: section.size?.height,
    minHeight: section.size?.minH,
    maxHeight: section.size?.maxH,
  };
  switch (section.pin) {
    case 'sticky-top':
      return { ...base, position: 'sticky', top: offset.top ?? 0 };
    case 'sticky-bottom':
      return { ...base, position: 'sticky', bottom: offset.bottom ?? 0 };
    case 'fixed-top':
      return {
        ...base,
        position: 'fixed',
        top: offset.top ?? 0,
        left: offset.left ?? 0,
        right: offset.right ?? 0,
      };
    case 'fixed-bottom':
      return {
        ...base,
        position: 'fixed',
        bottom: offset.bottom ?? 0,
        left: offset.left ?? 0,
        right: offset.right ?? 0,
      };
    case 'floating':
      return {
        ...base,
        position: 'fixed',
        top: offset.top,
        bottom: offset.bottom,
        left: offset.left,
        right: offset.right,
      };
    default:
      return base;
  }
}

const FIXED_PINS: PinMode[] = ['fixed-top', 'fixed-bottom', 'floating'];

export function PinnedLayer({
  variant,
}: {
  // 'sticky' renders sticky-* in flow; 'fixed' renders fixed-* and floating.
  variant: 'sticky-top' | 'sticky-bottom' | 'fixed';
}): React.JSX.Element | null {
  const { layout } = useLayout();
  const patchSection = useLayoutStore((s) => s.patchSection);
  const handExpanded = useGameSession().handExpanded;

  const sections = layout.sections.filter((s) => {
    if (!s.visible) return false;
    if (variant === 'sticky-top') return s.pin === 'sticky-top';
    if (variant === 'sticky-bottom') return s.pin === 'sticky-bottom';
    return FIXED_PINS.includes(s.pin);
  });

  if (sections.length === 0) return null;

  // Stable order: respect zIndex, then id for determinism.
  sections.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <>
      {sections.map((section) => {
        const def = getSection(section.id);
        if (!def) return null;
        const Body = def.Component;
        const isHand = section.id === 'hand' && section.pin === 'fixed-bottom';
        const handCollapsed = isHand && !handExpanded;
        const style = pinStyle(section);
        if (handCollapsed) {
          // Shrink the fixed wrapper to the rail so the dock retracts flush to
          // the bottom edge instead of leaving a tall empty panel.
          style.height = HAND_COLLAPSED_HEIGHT;
          style.minHeight = HAND_COLLAPSED_HEIGHT;
          style.maxHeight = HAND_COLLAPSED_HEIGHT;
        }
        return (
          <div
            key={section.id}
            data-pin={section.pin}
            data-section-id={section.id}
            style={style}
            className={cn('pointer-events-auto')}
          >
            {isHand && !handCollapsed ? (
              <FixedBottomResizeHandle
                currentHeight={section.size?.height}
                onResize={(height) =>
                  patchSection('hand', {
                    size: { ...(section.size ?? {}), height: `${height}px` },
                  })
                }
              />
            ) : null}
            <SectionFrame section={section} titleKey={def.titleKey}>
              <Body section={section} />
            </SectionFrame>
          </div>
        );
      })}
    </>
  );
}

function FixedBottomResizeHandle({
  currentHeight,
  onResize,
}: {
  currentHeight?: string;
  onResize: (height: number) => void;
}): React.JSX.Element {
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = parsePx(currentHeight) ?? 280;

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      const nextHeight = clamp(
        startHeight + startY - moveEvent.clientY,
        120,
        340,
      );
      onResize(nextHeight);
    };
    const handlePointerUp = (): void => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      role='separator'
      aria-orientation='horizontal'
      tabIndex={0}
      className='absolute inset-x-0 top-0 z-10 flex h-3 cursor-ns-resize items-center justify-center'
      onPointerDown={handlePointerDown}
    >
      <span className='h-1 w-16 rounded-full border border-[color:var(--metal-edge)] bg-surface-800 shadow-hairline-inset' />
    </div>
  );
}

function parsePx(value: string | undefined): number | null {
  if (!value?.endsWith('px')) return null;
  const parsed = Number(value.slice(0, -2));
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
