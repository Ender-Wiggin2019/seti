/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 09:48:41
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-05 02:15:21
 * @Description:
 */

import { Effect } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';

export interface IPreludeCard {
  id: string;
  upperEffects: Effect[];
  upperText: string;
  middleText: string;
  lowerEffects: Effect[];
  lowerText?: string;
  watermark?: boolean;
  income?: EResource;
  description?: string;
  flavorText?: string;
}
