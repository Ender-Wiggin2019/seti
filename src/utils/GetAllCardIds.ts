/*
 * @Author: Ender-Wiggin
 * @Date: 2024-06-27 23:56:37
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-25 01:12:41
 * @Description:
 */
import { EndGameData } from '@/data/EndGames';
import { ProjectsData } from '@/data/Projects';
import { SponsorsData } from '@/data/Sponsors';

import { Card, CardType } from '@/types/Card';
import { CardSource } from '@/types/CardSource';
import { ProjectCard, ProjectCategory } from '@/types/ProjectCard';

export function getAllCardIds() {
  return [
    ...SponsorsData.map((d) => d.id),
    ...ProjectsData.map((d) => d.id),
    ...EndGameData.map((d) => d.id),
  ];
}

export const cardTypeDataMapping = new Map<CardType, Card[]>([
  [CardType.SPONSOR_CARD, SponsorsData],
  [CardType.CONSERVATION_CARD, ProjectsData],
  [CardType.END_GAME_CARD, EndGameData],
]);
export function getCardIds(
  cardTypes: CardType[],
  cardSources?: CardSource[],
  setUpType?: 'hand' | 'game'
) {
  const ids: string[] = [];
  cardTypes.forEach((cardType) => {
    let data = cardTypeDataMapping.get(cardType);
    if (!data) throw Error('Cannot find cardType');
    if (cardSources) {
      data = data.filter((d) => cardSources.includes(d.source as any));
    }
    if (setUpType === 'hand' && cardType === CardType.CONSERVATION_CARD) {
      data = data.filter(
        (d) => (d as ProjectCard).type !== ProjectCategory.BASE
      );
    }

    if (setUpType === 'game' && cardType === CardType.CONSERVATION_CARD) {
      data = data.filter(
        (d) => (d as ProjectCard).type === ProjectCategory.BASE
      );
    }

    ids.push(...data.map((d) => d.id));
  });

  return ids;
}
