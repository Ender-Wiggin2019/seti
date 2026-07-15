import { ESector } from '../types/element';
import { EAlienType, ETech } from '../types/protocol/enums';

export type TExertianScoringRule =
  | {
      type: 'MIN_TRACES_ON_ALIEN';
      alienType: EAlienType | 'self' | 'other';
      count: number;
      score: number;
    }
  | {
      type: 'MIN_TRACES_SAME_COLOR';
      count: number;
      score: number;
    }
  | {
      type: 'MIN_ORBIT_OR_LAND_AT_SINGLE_PLANET';
      count: number;
      score: number;
    }
  | {
      type: 'MIN_SECTOR_FULFILLS';
      sector?: ESector;
      count: number;
      score: number;
    }
  | {
      type: 'MIN_TECHS';
      techType: ETech;
      count: number;
      score: number;
    }
  | {
      type: 'MIN_TUCKED_INCOME_CARDS';
      count: number;
      score: number;
    }
  | {
      type: 'MIN_ORBIT_OR_LAND_TOTAL';
      count: number;
      score: number;
    }
  | {
      type: 'MIN_COMPLETED_MISSIONS';
      count: number;
      score: number;
    };

export const EXERTIAN_SCORING_RULES: Readonly<
  Record<string, TExertianScoringRule>
> = {
  'ET.41': {
    type: 'MIN_SECTOR_FULFILLS',
    sector: ESector.BLACK,
    count: 3,
    score: 14,
  },
  'ET.42': {
    type: 'MIN_TECHS',
    techType: ETech.SCAN,
    count: 3,
    score: 15,
  },
  'ET.43': {
    type: 'MIN_TECHS',
    techType: ETech.COMPUTER,
    count: 3,
    score: 9,
  },
  'ET.44': {
    type: 'MIN_SECTOR_FULFILLS',
    sector: ESector.RED,
    count: 2,
    score: 12,
  },
  'ET.45': {
    type: 'MIN_SECTOR_FULFILLS',
    sector: ESector.BLUE,
    count: 2,
    score: 12,
  },
  'ET.46': {
    type: 'MIN_SECTOR_FULFILLS',
    sector: ESector.YELLOW,
    count: 2,
    score: 12,
  },
  'ET.47': {
    type: 'MIN_SECTOR_FULFILLS',
    sector: ESector.BLACK,
    count: 2,
    score: 14,
  },
  'ET.48': {
    type: 'MIN_TECHS',
    techType: ETech.PROBE,
    count: 3,
    score: 11,
  },
  'ET.49': {
    type: 'MIN_ORBIT_OR_LAND_TOTAL',
    count: 4,
    score: 16,
  },
  'ET.50': {
    type: 'MIN_ORBIT_OR_LAND_AT_SINGLE_PLANET',
    count: 3,
    score: 10,
  },
  'ET.51': {
    type: 'MIN_TUCKED_INCOME_CARDS',
    count: 8,
    score: 18,
  },
  'ET.52': {
    type: 'MIN_TRACES_ON_ALIEN',
    alienType: 'self',
    count: 6,
    score: 7,
  },
  'ET.53': {
    type: 'MIN_TRACES_ON_ALIEN',
    alienType: 'other',
    count: 6,
    score: 20,
  },
  'ET.54': {
    type: 'MIN_TRACES_SAME_COLOR',
    count: 5,
    score: 8,
  },
  'ET.55': {
    type: 'MIN_COMPLETED_MISSIONS',
    count: 5,
    score: 12,
  },
};
