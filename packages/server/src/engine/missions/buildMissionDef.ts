import { EEffectType, type IMissionEffect } from '@seti/common/types/effect';
import { loadCardData } from '../cards/loadCardData.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import { EMissionType, type IMissionDef } from './IMission.js';

type TConditionFn = (player: IPlayer, game: IGame) => boolean;

/**
 * Build a QUICK_MISSION def from card data, overriding condition
 * checking with an explicit server-side function.
 *
 * Rewards are read from the card data; the condition is provided
 * by the card class so planet / game-state logic stays in the server.
 */
export function buildQuickMissionDef(
  cardId: string,
  checkCondition: TConditionFn,
): IMissionDef {
  const data = loadCardData(cardId);
  const missionEffect = data.effects.find(
    (eff) =>
      eff.effectType === EEffectType.MISSION_QUICK ||
      eff.effectType === EEffectType.MISSION_FULL,
  ) as IMissionEffect;

  const type =
    missionEffect.effectType === EEffectType.MISSION_FULL
      ? EMissionType.FULL
      : EMissionType.QUICK;

  return {
    cardId,
    cardName: data.name,
    type,
    branches: missionEffect.missions.map((item) => ({
      req: item.req,
      rewards: item.reward,
      checkCondition,
    })),
  };
}
