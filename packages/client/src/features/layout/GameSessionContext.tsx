import type { IBaseCard } from '@seti/common/types/BaseCard';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * GameSessionContext — UI-only cross-section state.
 *
 * Three independent buckets live here:
 *   1. modal/dialog state (card detail, hand expanded)
 *   2. armed-action flags that span sections (movement mode, card-row buy,
 *      play-card selection, corner selection)
 *   3. focus dispatcher (`focusSection`) that lets any section ask the layout
 *      to bring another section into view (tab → setActiveTab, waterfall →
 *      scrollIntoView).
 *
 * Server state (gameState, pendingInput, sendAction…) stays in GameContext.
 * Layout shape (mode, slot, columns…) stays in LayoutStore. Don't merge.
 */
interface IGameSessionContext {
  // detail dialog
  detailCard: IBaseCard | null;
  detailOpen: boolean;
  inspectCard: (card: IBaseCard) => void;
  closeDetail: () => void;

  // hand
  handExpanded: boolean;
  toggleHand: () => void;
  setHandExpanded: (next: boolean) => void;

  // armed-action flags
  movementModeActive: boolean;
  setMovementModeActive: (v: boolean) => void;
  armedCardRowBuy: boolean;
  setArmedCardRowBuy: (v: boolean | ((prev: boolean) => boolean)) => void;
  playCardSelectionMode: boolean;
  setPlayCardSelectionMode: (v: boolean) => void;
  cornerSelectionMode: boolean;
  setCornerSelectionMode: (v: boolean) => void;

  // focus dispatcher — implementations come from LayoutShell
  focusSection: (id: string) => void;
  registerFocusHandler: (handler: (id: string) => void) => () => void;
}

const SessionCtx = createContext<IGameSessionContext | null>(null);

function noopFocusHandler(_id: string): void {
  // No shell has registered yet.
}

export function GameSessionProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [detailCard, setDetailCard] = useState<IBaseCard | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [handExpanded, setHandExpanded] = useState(true);
  const [movementModeActive, setMovementModeActive] = useState(false);
  const [armedCardRowBuy, setArmedCardRowBuyRaw] = useState(false);
  const [playCardSelectionMode, setPlayCardSelectionMode] = useState(false);
  const [cornerSelectionMode, setCornerSelectionMode] = useState(false);

  const inspectCard = useCallback((card: IBaseCard) => {
    setDetailCard(card);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const toggleHand = useCallback(() => {
    setHandExpanded((v) => !v);
  }, []);

  const setArmedCardRowBuy = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      setArmedCardRowBuyRaw(v);
    },
    [],
  );

  const focusHandlerRef = useRef<(id: string) => void>(noopFocusHandler);

  const registerFocusHandler = useCallback((handler: (id: string) => void) => {
    focusHandlerRef.current = handler;
    return () => {
      if (focusHandlerRef.current === handler) {
        focusHandlerRef.current = noopFocusHandler;
      }
    };
  }, []);

  const focusSection = useCallback((id: string) => {
    focusHandlerRef.current(id);
  }, []);

  const value = useMemo<IGameSessionContext>(
    () => ({
      detailCard,
      detailOpen,
      inspectCard,
      closeDetail,
      handExpanded,
      toggleHand,
      setHandExpanded,
      movementModeActive,
      setMovementModeActive,
      armedCardRowBuy,
      setArmedCardRowBuy,
      playCardSelectionMode,
      setPlayCardSelectionMode,
      cornerSelectionMode,
      setCornerSelectionMode,
      focusSection,
      registerFocusHandler,
    }),
    [
      detailCard,
      detailOpen,
      inspectCard,
      closeDetail,
      handExpanded,
      toggleHand,
      movementModeActive,
      armedCardRowBuy,
      setArmedCardRowBuy,
      playCardSelectionMode,
      cornerSelectionMode,
      focusSection,
      registerFocusHandler,
    ],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useGameSession(): IGameSessionContext {
  const ctx = useContext(SessionCtx);
  if (!ctx) {
    throw new Error(
      'useGameSession must be used within <GameSessionProvider />',
    );
  }
  return ctx;
}
