import { alienCards } from '@seti/common/data/alienCards';
import { baseCards } from '@seti/common/data/baseCards';
import { spaceAgencyAliens } from '@seti/common/data/spaceAgencyAliens';
import { spaceAgencyCards } from '@seti/common/data/spaceAgencyCards';

export const ALL_CARDS = [
  ...baseCards,
  ...spaceAgencyCards,
  ...alienCards,
  ...spaceAgencyAliens,
];
