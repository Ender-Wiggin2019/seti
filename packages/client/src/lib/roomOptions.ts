import type { IGameOptions } from '@/api/types';

export function isSoloRoom(options: Pick<IGameOptions, 'isSoloMode'>): boolean {
  return options.isSoloMode === true;
}

export function getRequiredHumanPlayerCount(options: IGameOptions): number {
  return isSoloRoom(options) ? 1 : options.playerCount;
}

export function getRulesPlayerCount(options: IGameOptions): number {
  return isSoloRoom(options) ? 2 : options.playerCount;
}
