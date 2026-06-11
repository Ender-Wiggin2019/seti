import { GAME_Z_INDEX } from '@/styles/zIndex';

/**
 * GameSceneBackground — the in-game variant of the lobby's 3-tier backdrop
 * (see components/layout/SceneBackground). It paints the same deep-space
 * scene language so the game reads as a continuation of the mission center:
 *
 *   base   : solid void color (--surface-void), the darkest layer.
 *   top    : a deep-space scene hero, fading down into the void.
 *   bottom : the shared footer banner, fading up into the void.
 *
 * Unlike the lobby SceneBackground it takes no per-route hero (the game is a
 * single surface) and sits at GAME_Z_INDEX.background so it composes with the
 * established game stacking contract. It is pointer-event transparent and
 * never blocks board / chrome interactions.
 */
const GAME_SCENE_HERO = '/assets/seti/scenes/room.webp';
const GAME_SCENE_FOOTER = '/assets/seti/scenes/footer.webp';

export function GameSceneBackground(): React.JSX.Element {
  return (
    <div
      aria-hidden
      data-testid='game-scene-background'
      className='pointer-events-none fixed inset-0 overflow-hidden bg-[var(--surface-void)]'
      style={{ zIndex: GAME_Z_INDEX.background }}
    >
      {/* Top scene — fades down into the void. Dimmer than the lobby hero so
          the board and chrome stay high-contrast over it. */}
      <div
        data-testid='game-scene-hero'
        className='absolute inset-x-0 top-0 h-[56vh] bg-cover bg-center bg-no-repeat opacity-[0.85]'
        style={{
          backgroundImage: `url("${GAME_SCENE_HERO}")`,
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Bottom banner — fades up into the void. Shared with the lobby. */}
      <div
        data-testid='game-scene-footer'
        className='absolute inset-x-0 bottom-0 h-[42vh] bg-cover bg-bottom bg-no-repeat opacity-[0.9]'
        style={{
          backgroundImage: `url("${GAME_SCENE_FOOTER}")`,
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0.8) 78%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0.8) 78%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
}
