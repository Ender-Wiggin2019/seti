import { EAlienType } from '@seti/common/types/BaseCard';
import {
  createGameOptions,
  DEFAULT_ALIEN_MODULES_ENABLED,
  DEFAULT_GAME_OPTIONS,
  type TAlienModulesEnabled,
} from '@seti/common/types/protocol/options';
import { describe, expect, it } from 'vitest';

describe('protocol options', () => {
  it('uses record-shaped alien defaults', () => {
    expect(DEFAULT_ALIEN_MODULES_ENABLED).toEqual({
      [EAlienType.ANOMALIES]: true,
      [EAlienType.CENTAURIANS]: true,
      [EAlienType.EXERTIANS]: true,
      [EAlienType.MASCAMITES]: true,
      [EAlienType.OUMUAMUA]: true,
      [EAlienType.GLYPHIDS]: false,
      [EAlienType.AMOEBA]: false,
      [EAlienType.DUMMY]: false,
    });
  });

  it('creates options with shared alien-module records', () => {
    const options = createGameOptions({
      alienModulesEnabled: {
        ...DEFAULT_ALIEN_MODULES_ENABLED,
        [EAlienType.AMOEBA]: true,
      },
    });

    expect(options).toEqual({
      ...DEFAULT_GAME_OPTIONS,
      alienModulesEnabled: {
        ...DEFAULT_ALIEN_MODULES_ENABLED,
        [EAlienType.AMOEBA]: true,
      },
    });
  });

  it('rejects fewer than two enabled core aliens in record form', () => {
    expect(() =>
      createGameOptions({
        alienModulesEnabled: {
          ...DEFAULT_ALIEN_MODULES_ENABLED,
          [EAlienType.CENTAURIANS]: false,
          [EAlienType.EXERTIANS]: false,
          [EAlienType.MASCAMITES]: false,
          [EAlienType.OUMUAMUA]: false,
        },
      }),
    ).toThrow('alienModulesEnabled must enable at least 2 core aliens');
  });

  it('rejects unknown alien type keys in alien module records', () => {
    expect(() =>
      createGameOptions({
        alienModulesEnabled: {
          999: true,
        } as unknown as Partial<TAlienModulesEnabled>,
      }),
    ).toThrow('alienModulesEnabled must only use known alien types');
  });

  it('rejects non-boolean alien module flags', () => {
    expect(() =>
      createGameOptions({
        alienModulesEnabled: {
          [EAlienType.ANOMALIES]: 'false',
        } as unknown as Partial<TAlienModulesEnabled>,
      }),
    ).toThrow('alienModulesEnabled values must be boolean');
  });
});
