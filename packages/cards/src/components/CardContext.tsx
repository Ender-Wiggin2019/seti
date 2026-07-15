import { createContext, useContext } from 'react';

/**
 * Render-time context piped down from the consumer (game client) into
 * card sub-renderers (Mission, EffectContainer, …). Lets components
 * look up *runtime* state — branch claims, owner color, etc. — that
 * isn't part of the static IBaseCard data.
 *
 * Stays optional: any consumer that doesn't wrap CardRender in a
 * provider gets `null` and renders the static card unchanged.
 */
export interface ICardRenderContext {
  /** Card currently being rendered — used by sub-renderers to look up runtime state. */
  cardId?: string;
  /**
   * Per-mission branch claim flags, keyed by cardId. Same shape the
   * server projects in IPublicPlayerState.missionClaims. Provided
   * for any card whose effects include a MISSION_QUICK / MISSION_FULL
   * effect; missing keys mean "no claim data, render static card".
   */
  branchClaimsByCardId?: Record<string, boolean[]>;
  /** Owner of the mission(s) on this card — used to color claim tokens. */
  ownerPlayerColor?: string;
}

const CardRenderContext = createContext<ICardRenderContext | null>(null);

export function CardRenderContextProvider({
  value,
  children,
}: {
  value: ICardRenderContext | null;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <CardRenderContext.Provider value={value}>
      {children}
    </CardRenderContext.Provider>
  );
}

export function useCardRenderContext(): ICardRenderContext | null {
  return useContext(CardRenderContext);
}
