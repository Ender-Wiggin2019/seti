import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface ISceneState {
  setHero: (src: string | null) => void;
  hero: string | null;
}

const SceneContext = createContext<ISceneState | null>(null);

interface ISceneProviderProps {
  children: React.ReactNode;
}

export function SceneProvider(
  props: ISceneProviderProps,
): React.JSX.Element {
  const [hero, setHero] = useState<string | null>(null);
  const value = useMemo(() => ({ hero, setHero }), [hero]);
  return (
    <SceneContext.Provider value={value}>
      {props.children}
    </SceneContext.Provider>
  );
}

/**
 * Register a top hero image for the current route. Pass `null` to clear.
 * The hook is a no-op outside a SceneProvider (game/debug routes opt out).
 */
export function useSceneHero(src: string | null): void {
  const ctx = useContext(SceneContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setHero(src);
    return () => ctx.setHero(null);
  }, [ctx, src]);
}

/**
 * SceneBackground — the 3-tier client backdrop.
 *
 *   top    : optional hero image (per route, via useSceneHero), fades to mid.
 *   middle : solid color (--scene-bg) matched to the footer's top edge.
 *   bottom : global footer banner, always present, fades up to mid.
 *
 * Sits behind everything (z = -10) and is pointer-event transparent so it
 * never blocks UI interactions.
 */
export function SceneBackground(): React.JSX.Element {
  const ctx = useContext(SceneContext);
  const hero = ctx?.hero ?? null;

  return (
    <div
      aria-hidden
      className='pointer-events-none fixed inset-0 -z-10 overflow-hidden'
      data-testid='scene-background'
    >
      {hero ? (
        <div
          data-testid='scene-hero'
          className='absolute inset-x-0 top-0 h-[58vh] bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: `url("${hero}")`,
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)',
          }}
        />
      ) : null}

      <div
        data-testid='scene-footer'
        className='absolute inset-x-0 bottom-0 h-[42vh] bg-[image:var(--scene-footer-image)] bg-cover bg-bottom bg-no-repeat'
        style={{
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
}
