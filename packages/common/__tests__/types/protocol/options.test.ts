import { EAlienType } from '@seti/common/types/BaseCard';
import {
  createGameOptions,
  DEFAULT_ALIEN_MODULES_ENABLED,
  DEFAULT_GAME_OPTIONS,
  EExpansion,
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
        [EAlienType.MASCAMITES]: false,
      },
    });

    expect(options).toEqual({
      ...DEFAULT_GAME_OPTIONS,
      alienModulesEnabled: {
        ...DEFAULT_ALIEN_MODULES_ENABLED,
        [EAlienType.MASCAMITES]: false,
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

  it('requires the Space Agency expansion flag when Space Agency options are enabled', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE],
        spaceAgencyOptions: {
          enabled: true,
          agencies: false,
          startResourceCards: false,
          newDeck: false,
          newAlienSpecies: false,
        },
      }),
    ).toThrow('spaceAgencyOptions.enabled requires SPACE_AGENCY expansion');
  });

  it('rejects incomplete Space Agency option objects', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
        } as never,
      }),
    ).toThrow('spaceAgencyOptions must define all module flags');
  });

  it('rejects null Space Agency option objects with a validation error', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: null as never,
      }),
    ).toThrow('spaceAgencyOptions must be an object');
  });

  it('rejects unknown Space Agency option keys', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: false,
          startResourceCards: false,
          newDeck: false,
          newAlienSpecies: false,
          extraModule: true,
        } as never,
      }),
    ).toThrow('spaceAgencyOptions must only use known module flags');
  });

  it('rejects enabled Space Agency child options when the parent option is disabled', () => {
    expect(() =>
      createGameOptions({
        spaceAgencyOptions: {
          enabled: false,
          agencies: true,
          startResourceCards: false,
          newDeck: false,
          newAlienSpecies: false,
        },
      }),
    ).toThrow('disabled spaceAgencyOptions cannot enable child modules');
  });

  it('requires agencies when quick start cards are enabled', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: false,
          startResourceCards: true,
          newDeck: false,
          newAlienSpecies: false,
        },
      }),
    ).toThrow('startResourceCards requires agencies');
  });

  it('rejects new alien module flags when the Space Agency new-alien option is off', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        alienModulesEnabled: {
          ...DEFAULT_ALIEN_MODULES_ENABLED,
          [EAlienType.GLYPHIDS]: true,
        },
        spaceAgencyOptions: {
          enabled: true,
          agencies: false,
          startResourceCards: false,
          newDeck: false,
          newAlienSpecies: false,
        },
      }),
    ).toThrow('newAlienSpecies is required to enable Space Agency aliens');
  });

  it('rejects Space Agency alien module flags when Space Agency options are absent', () => {
    expect(() =>
      createGameOptions({
        expansions: [EExpansion.BASE],
        alienModulesEnabled: {
          ...DEFAULT_ALIEN_MODULES_ENABLED,
          [EAlienType.AMOEBA]: true,
        },
      }),
    ).toThrow('newAlienSpecies is required to enable Space Agency aliens');
  });

  it('accepts a consistent Space Agency option set', () => {
    const options = createGameOptions({
      expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
      spaceAgencyOptions: {
        enabled: true,
        agencies: true,
        startResourceCards: true,
        newDeck: true,
        newAlienSpecies: false,
      },
    });

    expect(options.spaceAgencyOptions).toEqual({
      enabled: true,
      agencies: true,
      startResourceCards: true,
      newDeck: true,
      newAlienSpecies: false,
    });
  });

  it('accepts the Space Agency new deck without agencies', () => {
    const options = createGameOptions({
      expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
      spaceAgencyOptions: {
        enabled: true,
        agencies: false,
        startResourceCards: false,
        newDeck: true,
        newAlienSpecies: false,
      },
    });

    expect(options.spaceAgencyOptions?.newDeck).toBe(true);
    expect(options.spaceAgencyOptions?.agencies).toBe(false);
  });
});
