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

export {
  createOrganizationSetupCandidates,
  ORGANIZATIONS,
  ORGANIZATIONS_BY_ID,
} from '@seti/common/data/organizations';
export {
  createPreludeSetupCandidates,
  PRELUDE_CARDS_BY_ID,
  preludeCards,
} from '@seti/common/data/preludeCards';
