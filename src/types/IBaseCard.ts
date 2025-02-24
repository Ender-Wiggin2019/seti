/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-14 10:52:47
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-21 00:09:58
 * @Description:
 */
import BaseCard from '@/types/BaseCard';
import { BaseCardModel } from '@/types/BaseCardModel';

export interface IBaseCard {
  id: string;
  animalCard: BaseCard;
  model: BaseCardModel;
  rating?: number | null;
  ratingCount?: number | null;
  myRating?: number | null;
  myComment?: string | null;
}
