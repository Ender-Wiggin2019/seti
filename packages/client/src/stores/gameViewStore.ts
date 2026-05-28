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
  setActiveTab: (tab: TBoardTab) => void;
  setZoom: (zoom: number) => void;
  setHoveredPieceId: (id: string | null) => void;
  setUseNewLayout: (use: boolean) => void;
}

export const useGameViewStore = create<IGameViewStoreState>((set) => ({
  activeTab: 'board',
  zoom: DEFAULT_BOARD_ZOOM,
  hoveredPieceId: null,
  useNewLayout: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setZoom: (zoom) => set({ zoom }),
  setHoveredPieceId: (hoveredPieceId) => set({ hoveredPieceId }),
  setUseNewLayout: (useNewLayout) => set({ useNewLayout }),
}));
