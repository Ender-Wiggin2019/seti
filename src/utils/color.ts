/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-14 16:30:05
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-14 16:33:22
 * @Description:
 */
import { EAlienColor } from '@/constant/color';

import { IBaseCard } from '@/types/BaseCard';

const DEFAULT_COLOR = '#3E403B';

export const getCardMiddleColor = (card: IBaseCard) => {
  if (card?.special?.titleColor) {
    return card?.special?.titleColor;
  } else if (card?.alien) {
    return EAlienColor[card?.alien] || DEFAULT_COLOR;
  }

  return DEFAULT_COLOR;
};
