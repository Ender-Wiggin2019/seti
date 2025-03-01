/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-29 11:57:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-02 00:00:19
 * @Description:
 */

import { alienCards } from '@/data/alienCards';
import baseCards from '@/data/baseCards';

import BaseCard from '@/types/BaseCard';
import { Card } from '@/types/Card';
import { sortCards } from '@/utils/sort';

export function isBaseCard(card: Card): card is BaseCard {
  return !card.alien;
}

export function isAlienCard(card: Card): boolean {
  return !!card.alien;
}

export const getAllCardIds = () => {
  return [...baseCards, ...alienCards].map((card) => card.id);
};

export const getCardById = (id: string) => {
  return [...baseCards, ...alienCards].find((card) => card.id === id);
};

export const getCardsById = (ids: string[], sort?: boolean) => {
  const res = [...baseCards, ...alienCards].filter((card) => ids.includes(card.id));
  return sort ? sortCards(res) : res;
};