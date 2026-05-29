import { create } from 'zustand';

export const DEFAULT_BOARD_ZOOM = 0.9;

export type TBoardTab =
  | 'board'
  | 'planets'
  | 'tech'
  | 'cards'
  | 'aliens'
  | 'scoring';

interface IGameViewStoreState {
  activeTab: TBoardTab;
  zoom: number;
  hoveredPieceId: string | null;
  useNewLayout: boolean;
  /**
   * Whether `level === 'debug'` events are hidden in the event log
   * (both compact preview and full dialog). Compact mode already
   * filters debug events by default; this toggle controls the
   * desktop sidebar log + full dialog. Default off so debug players
   * see internal `ACTION_COST` / `ACTION_REWARD` traces; can be
   * flipped on from the EventLog header.
   */
  hideDebugLog: boolean;
  setActiveTab: (tab: TBoardTab) => void;
  setZoom: (zoom: number) => void;
  setHoveredPieceId: (id: string | null) => void;
  setUseNewLayout: (use: boolean) => void;
  setHideDebugLog: (hide: boolean) => void;
}

export const useGameViewStore = create<IGameViewStoreState>((set) => ({
  activeTab: 'board',
  zoom: DEFAULT_BOARD_ZOOM,
  hoveredPieceId: null,
  useNewLayout: false,
  hideDebugLog: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setZoom: (zoom) => set({ zoom }),
  setHoveredPieceId: (hoveredPieceId) => set({ hoveredPieceId }),
  setUseNewLayout: (useNewLayout) => set({ useNewLayout }),
  setHideDebugLog: (hideDebugLog) => set({ hideDebugLog }),
}));
