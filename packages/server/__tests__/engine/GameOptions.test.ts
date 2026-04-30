import {
  createGameOptions,
  DEFAULT_GAME_OPTIONS,
  EExpansion,
} from '@/engine/GameOptions.js';

describe('GameOptions', () => {
  it('uses defaults when no options provided', () => {
    const gameOptions = createGameOptions();

    expect(gameOptions).toEqual(DEFAULT_GAME_OPTIONS);
    expect(gameOptions.expansions).toEqual([EExpansion.BASE]);
  });

  it('throws when playerCount is out of range', () => {
    expect(() => createGameOptions({ playerCount: 1 })).toThrow(
      'playerCount must be an integer between 2 and 4',
    );
    expect(() => createGameOptions({ playerCount: 5 })).toThrow(
      'playerCount must be an integer between 2 and 4',
    );
  });

  it('throws when alienModulesEnabled has fewer than 5 toggles', () => {
    expect(() =>
      createGameOptions({
        alienModulesEnabled: [true, true, true, true],
      }),
    ).toThrow('alienModulesEnabled must define at least 5 alien toggles');
  });

  it('throws when fewer than 2 core aliens are enabled', () => {
    expect(() =>
      createGameOptions({
        alienModulesEnabled: [true, false, false, false, false],
      }),
    ).toThrow('alienModulesEnabled must enable at least 2 core aliens');
  });
});
