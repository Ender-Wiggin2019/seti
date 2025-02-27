/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 11:57:43
 * @Description:
 */
import BaseCard from '@/types/BaseCard';

export type Card = BaseCard;

export enum CardType {
  ANIMAL_CARD = 'BaseCard',
  SPONSOR_CARD = 'SponsorCard',
  CONSERVATION_CARD = 'ConservationCard',
  ACTION_CARD = 'ActionCard',
  END_GAME_CARD = 'EndGameCard',
}
