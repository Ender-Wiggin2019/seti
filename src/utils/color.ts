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
