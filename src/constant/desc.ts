import { DESC_WITH_TYPE } from '@/constant/effect';

import { EPlanet, ETrace } from '@/types/element';

export const d = {
  onEach: DESC_WITH_TYPE(ETrace.ANY, 'on each species'),
  mercury: DESC_WITH_TYPE(EPlanet.MERCURY, 'on Mercury'),
  venus: DESC_WITH_TYPE(EPlanet.VENUS, 'on Venus'),
  mars: DESC_WITH_TYPE(EPlanet.MARS, 'on Mars'),
  jupiter: DESC_WITH_TYPE(EPlanet.JUPITER, 'on Jupiter'),
  saturn: DESC_WITH_TYPE(EPlanet.SATURN, 'on Saturn'),
  uranus: DESC_WITH_TYPE(EPlanet.URANUS, 'on Uranus'),
  neptune: DESC_WITH_TYPE(EPlanet.NEPTUNE, 'on Neptune'),
};
