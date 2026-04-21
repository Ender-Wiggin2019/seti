import { EAlienMap, EAlienType } from '@seti/common/types/BaseCard';

export interface IAlienLobbyOption {
  alienType: EAlienType;
  alienName: string;
  disabled: boolean;
}

export const CORE_RANDOM_ALIEN_TYPES: readonly EAlienType[] = [
  EAlienType.ANOMALIES,
  EAlienType.CENTAURIANS,
  EAlienType.EXERTIANS,
  EAlienType.MASCAMITES,
  EAlienType.OUMUAMUA,
];

const AVAILABLE_ALIEN_TYPE_SET = new Set<EAlienType>(CORE_RANDOM_ALIEN_TYPES);

export function createAlienLobbyOptionMap(): Record<number, IAlienLobbyOption> {
  const allAlienTypes = Object.values(EAlienType).filter(
    (value): value is EAlienType => typeof value === 'number',
  );

  return allAlienTypes.reduce<Record<number, IAlienLobbyOption>>(
    (map, alienType) => {
      map[alienType] = {
        alienType,
        alienName: EAlienMap[alienType],
        disabled: !AVAILABLE_ALIEN_TYPE_SET.has(alienType),
      };
      return map;
    },
    {},
  );
}

export const ALIEN_LOBBY_OPTION_MAP = createAlienLobbyOptionMap();
