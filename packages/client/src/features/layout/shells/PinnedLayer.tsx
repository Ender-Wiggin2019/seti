import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { useLayout } from '../LayoutContext';
import { getSection } from '../sectionRegistry';
import type { PinMode, ResolvedSection } from '../types';
import { SectionFrame } from './SectionFrame';

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
        return (
          <div
            key={section.id}
            data-pin={section.pin}
            data-section-id={section.id}
            style={pinStyle(section)}
            className={cn('pointer-events-auto')}
          >
            <SectionFrame section={section} titleKey={def.titleKey}>
              <Body section={section} />
            </SectionFrame>
          </div>
        );
      })}
    </>
  );
}
