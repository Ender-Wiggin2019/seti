import { create } from 'zustand';

export enum ELanguage {
  EN = 'en',
  ZH = 'zh',
}

interface ISettingsStoreState {
  language: ELanguage;
  animationEnabled: boolean;
  sfxVolume: number;
  setLanguage: (language: ELanguage) => void;
  setAnimationEnabled: (enabled: boolean) => void;
  setSfxVolume: (volume: number) => void;
}

export const useSettingsStore = create<ISettingsStoreState>((set) => ({
  language: ELanguage.EN,
  animationEnabled: true,
  sfxVolume: 0.8,
  setLanguage: (language) => set({ language }),
  setAnimationEnabled: (animationEnabled) => set({ animationEnabled }),
  setSfxVolume: (sfxVolume) => set({ sfxVolume }),
}));
