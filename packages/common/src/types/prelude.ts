/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 09:48:41
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-05 02:15:21
 * @Description:
 */

import type { EStarName } from '@seti/common/constant/sectorSetup';
import type { Effect } from '@seti/common/types/effect';
import { EPlanet, EResource, ETrace } from '@seti/common/types/element';

export type TPreludeSetupMark =
  | {
      kind: 'signal';
      starName: EStarName;
      count: number;
    }
  | {
      kind: 'trace';
      trace: ETrace;
      alienIndex: number;
    }
  | {
      kind: 'orbiter';
      planet: EPlanet;
    };

export interface IPreludeCard {
  id: string;
  upperEffects: Effect[];
  upperText: string;
  middleText: string;
  lowerEffects: Effect[];
  setupMarks: TPreludeSetupMark[];
  lowerText?: string;
  watermark?: boolean;
  income?: EResource;
  description?: string;
  flavorText?: string;
}
