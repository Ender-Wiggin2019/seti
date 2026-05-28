import type { CSSProperties, ReactNode } from 'react';
import { Component, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useLayoutStore } from '../layoutStore';
import type { ResolvedSection, SizeConfig } from '../types';

/**
 * SectionFrame — every body section is wrapped in this. Owns:
 *   • the scroll-target anchor (`#section-${id}`) used by focusSection
 *   • the optional collapse toggle
 *   • flex-grow / min-height / max-height plumbing from `SizeConfig`
 *   • a thin error fence so a single broken section doesn't take the screen
 *
 * Header is intentionally minimal — we lean on the legacy `section-head` /
 * `instrument-panel` classes already used throughout the app so the new
 * layout matches the existing visual language.
 */
export interface ISectionFrameProps {
  section: ResolvedSection;
  titleKey?: string;
  showHeader?: boolean;
  children: ReactNode;
  className?: string;
}

function sizeToStyle(size: SizeConfig | undefined): CSSProperties {
  if (!size) return {};
  return {
    width: size.width,
    height: size.height,
    minHeight: size.minH,
    maxHeight: size.maxH,
    minWidth: size.minW,
    maxWidth: size.maxW,
    flexGrow: size.grow,
  };
}

class SectionErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Keep a failed section contained; React still reports the original error in dev.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className='instrument-panel p-3 text-sm text-danger-300'>
          Section failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}

export function SectionFrame({
  section,
  titleKey,
  showHeader = false,
  children,
  className,
}: ISectionFrameProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const collapsedMap = useLayoutStore((s) => s.collapsed);
  const toggleCollapsed = useLayoutStore((s) => s.toggleCollapsed);
  const isCollapsed =
    collapsedMap[section.id] ?? section.defaultCollapsed ?? false;

  const style = useMemo(() => sizeToStyle(section.size), [section.size]);

  return (
    <section
      id={`section-${section.id}`}
      data-section-id={section.id}
      data-collapsed={isCollapsed ? 'true' : 'false'}
      style={style}
      className={cn(
        'min-w-0 flex flex-col',
        section.size?.grow ? '' : 'shrink-0',
        className,
      )}
    >
      {(showHeader || section.collapsible) && (
        <div className='section-head mb-2 flex items-center'>
          <span aria-hidden className='section-head__tick' />
          {titleKey ? (
            <p className='micro-label'>{t(titleKey)}</p>
          ) : (
            <p className='micro-label'>{section.id}</p>
          )}
          <div aria-hidden className='section-head__rule' />
          {section.collapsible && (
            <button
              type='button'
              onClick={() => toggleCollapsed(section.id)}
              className='ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-500 hover:text-text-100'
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? '▸' : '▾'}
            </button>
          )}
        </div>
      )}
      {!isCollapsed && (
        <div className='min-h-0 flex-1'>
          <SectionErrorBoundary>{children}</SectionErrorBoundary>
        </div>
      )}
    </section>
  );
}
