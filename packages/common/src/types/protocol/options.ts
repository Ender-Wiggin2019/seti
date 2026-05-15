import { EAlienType } from '@seti/common/types/BaseCard';
import type { TSoloDifficulty } from '@seti/common/types/protocol/solo';

export enum EExpansion {
  BASE = 'BASE',
  ALIEN = 'ALIEN',
  SPACE_AGENCY = 'SPACE_AGENCY',
}

export interface ISpaceAgencyOptions {
  enabled: boolean;
  agencies: boolean;
  startResourceCards: boolean;
  newDeck: boolean;
  newAlienSpecies: boolean;
}

export type TAlienModulesEnabled = Record<EAlienType, boolean>;

export interface IGameOptions {
  playerCount: number;
  alienModulesEnabled: TAlienModulesEnabled;
  undoAllowed: boolean;
  timerPerTurn: number;
  expansions: EExpansion[];
  isSoloMode: boolean;
  soloDifficulty: TSoloDifficulty;
  spaceAgencyOptions?: ISpaceAgencyOptions;
}

export type IGameOptionsPatch = Partial<
  Omit<IGameOptions, 'alienModulesEnabled'>
> & {
  alienModulesEnabled?: Partial<TAlienModulesEnabled>;
};

export const CORE_ALIEN_TYPES: readonly EAlienType[] = [
  EAlienType.ANOMALIES,
  EAlienType.CENTAURIANS,
  EAlienType.EXERTIANS,
  EAlienType.MASCAMITES,
  EAlienType.OUMUAMUA,
];

export const DEFAULT_ALIEN_MODULES_ENABLED: Readonly<TAlienModulesEnabled> =
  Object.freeze({
    [EAlienType.ANOMALIES]: true,
    [EAlienType.CENTAURIANS]: true,
    [EAlienType.EXERTIANS]: true,
    [EAlienType.MASCAMITES]: true,
    [EAlienType.OUMUAMUA]: true,
    [EAlienType.GLYPHIDS]: false,
    [EAlienType.AMOEBA]: false,
    [EAlienType.DUMMY]: false,
  });

export const DEFAULT_GAME_OPTIONS: Readonly<IGameOptions> = Object.freeze({
  playerCount: 2,
  alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
  undoAllowed: true,
  timerPerTurn: 0,
  expansions: [EExpansion.BASE],
  isSoloMode: false,
  soloDifficulty: 1,
});

const ALL_ALIEN_TYPES: readonly EAlienType[] = Object.values(EAlienType).filter(
  (value): value is EAlienType => typeof value === 'number',
);

function isAlienModulesRecord(
  value: unknown,
): value is Partial<TAlienModulesEnabled> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateAlienModulesEnabled(
  alienModulesEnabled: unknown,
  requireAllAlienTypes: boolean,
): void {
  if (!isAlienModulesRecord(alienModulesEnabled)) {
    throw new Error('alienModulesEnabled must be a record');
  }

  for (const [key, value] of Object.entries(alienModulesEnabled)) {
    const alienType = Number(key);
    if (!Number.isInteger(alienType) || !ALL_ALIEN_TYPES.includes(alienType)) {
      throw new Error('alienModulesEnabled must only use known alien types');
    }

    if (typeof value !== 'boolean') {
      throw new Error('alienModulesEnabled values must be boolean');
    }
  }

  if (requireAllAlienTypes) {
    for (const alienType of ALL_ALIEN_TYPES) {
      if (typeof alienModulesEnabled[alienType] !== 'boolean') {
        throw new Error('alienModulesEnabled must define all alien types');
      }
    }
  }
}

export function validateGameOptions(gameOptions: IGameOptions): void {
  if (
    !Number.isInteger(gameOptions.playerCount) ||
    gameOptions.playerCount < 2 ||
    gameOptions.playerCount > 4
  ) {
    throw new Error('playerCount must be an integer between 2 and 4');
  }

  validateAlienModulesEnabled(gameOptions.alienModulesEnabled, true);

  const enabledCoreAlienCount = CORE_ALIEN_TYPES.filter(
    (alienType) => gameOptions.alienModulesEnabled[alienType] !== false,
  ).length;

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
  gameOptions: IGameOptionsPatch = {},
): Readonly<IGameOptions> {
  if (gameOptions.alienModulesEnabled !== undefined) {
    validateAlienModulesEnabled(gameOptions.alienModulesEnabled, false);
  }

  const mergedOptions: IGameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...gameOptions,
    playerCount: gameOptions.isSoloMode
      ? 2
      : (gameOptions.playerCount ?? DEFAULT_GAME_OPTIONS.playerCount),
    soloDifficulty: (gameOptions.soloDifficulty ??
      DEFAULT_GAME_OPTIONS.soloDifficulty) as TSoloDifficulty,
    alienModulesEnabled: {
      ...DEFAULT_ALIEN_MODULES_ENABLED,
      ...(gameOptions.alienModulesEnabled ?? {}),
    },
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

export function isAlienEnabled(
  options: Pick<IGameOptions, 'alienModulesEnabled'>,
  alienType: EAlienType,
): boolean {
  return options.alienModulesEnabled[alienType] !== false;
}
