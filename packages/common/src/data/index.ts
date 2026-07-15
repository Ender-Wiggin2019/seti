import { alienCards } from '@seti/common/data/alienCards';
import { arkhosCards } from '@seti/common/data/arkhosCards';
import { baseCards } from '@seti/common/data/baseCards';
import { spaceAgencyAliens } from '@seti/common/data/spaceAgencyAliens';
import { spaceAgencyCards } from '@seti/common/data/spaceAgencyCards';

export const ALL_CARDS = [
  ...baseCards,
  ...spaceAgencyCards,
  ...alienCards,
  ...spaceAgencyAliens,
  ...arkhosCards,
];

export type {
  IArkhosAccessState,
  IArkhosExplorationCardData,
  IArkhosExplorationRewardRecord,
  IArkhosSecurityCardData,
  IArkhosSecurityCardState,
  TArkhosAccessByPlayer,
  TArkhosExplorationRewardSize,
  TArkhosSecurityCardsByPlayer,
  TArkhosSecurityCardZone,
  TArkhosSecurityTrace,
} from '@seti/common/data/arkhosCards';
export {
  ARKHOS_EXPLORATION_CARDS,
  ARKHOS_SECURITY_CARDS,
  arkhosCards,
  getArkhosSecurityCardsByTrace,
} from '@seti/common/data/arkhosCards';
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
