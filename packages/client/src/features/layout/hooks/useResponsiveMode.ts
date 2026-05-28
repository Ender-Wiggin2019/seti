import { useEffect, useState } from 'react';

/**
 * `useResponsiveMode` — return true when the viewport is below the breakpoint.
 *
 * Resize-listener guarded against SSR (defaults to false). Compares against a
 * single px breakpoint provided by the caller (LayoutConfig.options.mobileBreakpoint).
 */
export function useResponsiveMode(breakpoint: number): boolean {
  const getMatch = (): boolean =>
    typeof window !== 'undefined' && window.innerWidth < breakpoint;

  const [isMobile, setIsMobile] = useState<boolean>(getMatch);

  useEffect(() => {
    const onResize = (): void => setIsMobile(getMatch());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint]);

  return isMobile;
}
