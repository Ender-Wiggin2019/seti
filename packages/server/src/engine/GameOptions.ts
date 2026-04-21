export enum EExpansion {
  BASE = 'BASE',
  ALIEN = 'ALIEN',
}

export interface IGameOptions {
  playerCount: number;
  alienModulesEnabled: boolean[];
  undoAllowed: boolean;
  timerPerTurn: number;
  expansions: EExpansion[];
}

export const DEFAULT_GAME_OPTIONS: Readonly<IGameOptions> = Object.freeze({
  playerCount: 2,
  alienModulesEnabled: [true, true, true, true, true],
  undoAllowed: true,
  timerPerTurn: 0,
  expansions: [EExpansion.BASE],
});

export function validateGameOptions(gameOptions: IGameOptions): void {
  if (
    !Number.isInteger(gameOptions.playerCount) ||
    gameOptions.playerCount < 2 ||
    gameOptions.playerCount > 4
  ) {
    throw new Error('playerCount must be an integer between 2 and 4');
  }

  if (!Array.isArray(gameOptions.alienModulesEnabled)) {
    throw new Error('alienModulesEnabled must be an array');
  }

  if (gameOptions.alienModulesEnabled.length < 5) {
    throw new Error('alienModulesEnabled must define at least 5 alien toggles');
  }

  const enabledCoreAlienCount = gameOptions.alienModulesEnabled
    .slice(0, 5)
    .filter((enabled) => enabled !== false).length;

  if (enabledCoreAlienCount < 2) {
    throw new Error('alienModulesEnabled must enable at least 2 core aliens');
  }

  if (
    !Number.isInteger(gameOptions.timerPerTurn) ||
    gameOptions.timerPerTurn < 0
  ) {
    throw new Error('timerPerTurn must be a non-negative integer');
  }
}

export function createGameOptions(
  gameOptions: Partial<IGameOptions> = {},
): Readonly<IGameOptions> {
  const mergedOptions: IGameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...gameOptions,
    alienModulesEnabled: gameOptions.alienModulesEnabled ?? [
      ...DEFAULT_GAME_OPTIONS.alienModulesEnabled,
    ],
    expansions: gameOptions.expansions ?? [...DEFAULT_GAME_OPTIONS.expansions],
  };

  validateGameOptions(mergedOptions);
  return Object.freeze(mergedOptions);
}
