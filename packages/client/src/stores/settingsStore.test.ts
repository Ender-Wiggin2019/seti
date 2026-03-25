import { beforeEach, describe, expect, it } from 'vitest';
import { ELanguage, useSettingsStore } from './settingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      language: ELanguage.EN,
      animationEnabled: true,
      sfxVolume: 0.8,
    });
  });

  it('updates language and animation toggles', () => {
    useSettingsStore.getState().setLanguage(ELanguage.ZH);
    useSettingsStore.getState().setAnimationEnabled(false);

    expect(useSettingsStore.getState().language).toBe(ELanguage.ZH);
    expect(useSettingsStore.getState().animationEnabled).toBe(false);
  });

  it('updates audio volume', () => {
    useSettingsStore.getState().setSfxVolume(0.3);

    expect(useSettingsStore.getState().sfxVolume).toBe(0.3);
  });
});
