import type { TSoloDifficulty } from '@seti/common/types/protocol/solo';

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
  isSoloMode: boolean;
  soloDifficulty: TSoloDifficulty;
}

export const DEFAULT_GAME_OPTIONS: Readonly<IGameOptions> = Object.freeze({
  playerCount: 2,
  alienModulesEnabled: [true, true, true, true, true],
  undoAllowed: true,
  timerPerTurn: 0,
  expansions: [EExpansion.BASE],
  isSoloMode: false,
  soloDifficulty: 1,
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

  if (
    !Number.isInteger(gameOptions.soloDifficulty) ||
    gameOptions.soloDifficulty < 1 ||
    gameOptions.soloDifficulty > 5
  ) {
    throw new Error('soloDifficulty must be an integer between 1 and 5');
  }
}

export function createGameOptions(
  gameOptions: Partial<IGameOptions> = {},
): Readonly<IGameOptions> {
  const mergedOptions: IGameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...gameOptions,
    playerCount: gameOptions.isSoloMode
      ? 2
      : (gameOptions.playerCount ?? DEFAULT_GAME_OPTIONS.playerCount),
    soloDifficulty: (gameOptions.soloDifficulty ??
      DEFAULT_GAME_OPTIONS.soloDifficulty) as TSoloDifficulty,
    alienModulesEnabled: gameOptions.alienModulesEnabled ?? [
      ...DEFAULT_GAME_OPTIONS.alienModulesEnabled,
    ],
    expansions: gameOptions.expansions ?? [...DEFAULT_GAME_OPTIONS.expansions],
  };

  validateGameOptions(mergedOptions);
  return Object.freeze(mergedOptions);
}

export function isSoloMode(options: Partial<IGameOptions>): boolean {
  return options.isSoloMode === true;
}

export function getRequiredHumanPlayers(
  options: Partial<IGameOptions>,
): number {
  return isSoloMode(options) ? 1 : (options.playerCount ?? 2);
}

export function getRulesPlayerCount(options: Partial<IGameOptions>): number {
  return isSoloMode(options) ? 2 : (options.playerCount ?? 2);
}
