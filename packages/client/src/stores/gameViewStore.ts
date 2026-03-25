import { create } from 'zustand';

export type TBoardTab =
  | 'solar-system'
  | 'sectors'
  | 'planets'
  | 'tech'
  | 'cards'
  | 'aliens'
  | 'scoring';

interface IGameViewStoreState {
  activeTab: TBoardTab;
  zoom: number;
  hoveredPieceId: string | null;
  setActiveTab: (tab: TBoardTab) => void;
  setZoom: (zoom: number) => void;
  setHoveredPieceId: (id: string | null) => void;
}

export const useGameViewStore = create<IGameViewStoreState>((set) => ({
  activeTab: 'solar-system',
  zoom: 1,
  hoveredPieceId: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setZoom: (zoom) => set({ zoom }),
  setHoveredPieceId: (hoveredPieceId) => set({ hoveredPieceId }),
}));
