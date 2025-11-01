import { EAlienType } from '@/types/BaseCard';
import { EResource, ESector } from '@/types/element';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:05:06
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-01 15:34:15
 * @Description:
 */
export const EResourceColorMap: Record<EResource, string> = {
  [EResource.CREDIT]: '#b09530',
  [EResource.ENERGY]: '#3aaa23',
  [EResource.SCORE]: '#156853',
  [EResource.DATA]: '#567fd1',
  [EResource.PUBLICITY]: '#f14927',
  [EResource.CARD]: '#414341',
  [EResource.CARD_ANY]: '#414341',
  [EResource.MOVE]: '#182031',
};

export const ESectorColorMap: Record<ESector, string> = {
  [ESector.BLACK]: '#000000',
  [ESector.BLUE]: '#3478d8',
  [ESector.RED]: '#e93e27',
  [ESector.YELLOW]: '#f5c242',
};

export const EAlienColor: Record<EAlienType, string> = {
  [EAlienType.ANOMALIES]: '#1a6983',
  [EAlienType.CENTAURIANS]: '#5fb35e',
  [EAlienType.MASCAMITES]: '#5d412d',
  [EAlienType.OUMUAMUA]: '#6940a2',
  [EAlienType.EXERTIANS]: '#ca273a',
  [EAlienType.AMOEBA]: '#9DA7BE',
};
