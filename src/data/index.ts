import { alienCards } from '@/data/alienCards';
import { baseCards } from '@/data/baseCards';
import { spaceAgencyAliens } from '@/data/spaceAgencyAliens';
import { spaceAgencyCards } from '@/data/spaceAgencyCards';

export const ALL_CARDS = [
  ...baseCards,
  ...spaceAgencyCards,
  ...alienCards,
  ...spaceAgencyAliens,
];
