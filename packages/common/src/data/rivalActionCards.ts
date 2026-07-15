import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  ERivalActionCardTier,
  ERivalActionKind,
  ERivalDecisionDirection,
  ERivalProbePlacement,
  ERivalProbeTarget,
  ERivalTelescopeMode,
  type IRivalActionCandidateDefinition,
  type IRivalActionCardDefinition,
} from '@seti/common/types/protocol/solo';

const PROGRESS_1 = {
  type: 'CUSTOM',
  effectId: 'RIVAL_PROGRESS_1',
} as const;
const PUBLICITY_1 = { type: 'PUBLICITY', amount: 1 } as const;
const VP_3 = { type: 'VP', amount: 3 } as const;

function analyze(
  effects?: IRivalActionCandidateDefinition['effects'],
): IRivalActionCandidateDefinition {
  return { kind: ERivalActionKind.ANALYZE_DATA, effects };
}

function launch(
  effects?: IRivalActionCandidateDefinition['effects'],
): IRivalActionCandidateDefinition {
  return { kind: ERivalActionKind.LAUNCH_PROBE, effects };
}

function tech(
  init?: Pick<IRivalActionCandidateDefinition, 'effects' | 'paid'>,
): IRivalActionCandidateDefinition {
  return { kind: ERivalActionKind.RESEARCH_TECH, ...init };
}

function probe(
  init: Pick<
    IRivalActionCandidateDefinition,
    | 'movement'
    | 'planets'
    | 'probePlacement'
    | 'probeTarget'
    | 'collectMascamitesSample'
  >,
): IRivalActionCandidateDefinition {
  return { kind: ERivalActionKind.PROBE_PLACEMENT, ...init };
}

const telescope = (
  telescopeMode: ERivalTelescopeMode,
): IRivalActionCandidateDefinition => ({
  kind: ERivalActionKind.SCAN,
  telescopeMode,
});

export const rivalActionCards: readonly IRivalActionCardDefinition[] = [
  {
    id: 'S.1',
    deckTier: ERivalActionCardTier.BASIC,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      analyze(),
      launch([PUBLICITY_1]),
      tech({ paid: true }),
      probe({
        movement: 3,
        planets: [EPlanet.SATURN, EPlanet.MARS, EPlanet.JUPITER, EPlanet.VENUS],
        probePlacement: ERivalProbePlacement.ORBITER,
      }),
    ],
  },
  {
    id: 'S.2',
    deckTier: ERivalActionCardTier.BASIC,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      analyze(),
      tech({ paid: true }),
      telescope(ERivalTelescopeMode.DEFAULT),
    ],
  },
  {
    id: 'S.3',
    deckTier: ERivalActionCardTier.BASIC,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      { kind: ERivalActionKind.SPECIES_REPLACEMENT_CHECK, alienIndex: 1 },
      tech({ paid: true }),
      telescope(ERivalTelescopeMode.DEFAULT),
    ],
  },
  {
    id: 'S.4',
    deckTier: ERivalActionCardTier.BASIC,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      { kind: ERivalActionKind.SPECIES_REPLACEMENT_CHECK, alienIndex: 2 },
      probe({
        movement: 3,
        planets: [EPlanet.JUPITER, EPlanet.MARS, EPlanet.SATURN, EPlanet.VENUS],
        probePlacement: ERivalProbePlacement.ORBITER,
      }),
      tech({ effects: [PROGRESS_1] }),
    ],
  },
  {
    id: 'S.5',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      analyze([VP_3]),
      tech({ paid: true, effects: [PROGRESS_1] }),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.6',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      tech({ paid: true, effects: [PROGRESS_1] }),
      launch([PUBLICITY_1, PROGRESS_1]),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.7',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      tech({ paid: true, effects: [PROGRESS_1] }),
      probe({
        movement: 4,
        planets: [
          EPlanet.URANUS,
          EPlanet.SATURN,
          EPlanet.MERCURY,
          EPlanet.VENUS,
        ],
        probePlacement: ERivalProbePlacement.LANDER,
      }),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.8',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      analyze([VP_3]),
      probe({
        movement: 4,
        planets: [
          EPlanet.NEPTUNE,
          EPlanet.JUPITER,
          EPlanet.MERCURY,
          EPlanet.VENUS,
        ],
        probePlacement: ERivalProbePlacement.LANDER,
      }),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.9',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      analyze([VP_3]),
      launch([PUBLICITY_1, PROGRESS_1]),
      probe({
        movement: 4,
        planets: [
          EPlanet.URANUS,
          EPlanet.NEPTUNE,
          EPlanet.MERCURY,
          EPlanet.VENUS,
        ],
        probePlacement: ERivalProbePlacement.ORBITER,
      }),
    ],
  },
  {
    id: 'S.10',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      analyze([VP_3]),
      launch([PUBLICITY_1, PROGRESS_1]),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.11',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      tech({ paid: true, effects: [PROGRESS_1] }),
      analyze([VP_3]),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.12',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      tech({ paid: true, effects: [PROGRESS_1] }),
      launch([PUBLICITY_1, PROGRESS_1]),
      probe({
        movement: 4,
        planets: [
          EPlanet.MERCURY,
          EPlanet.SATURN,
          EPlanet.JUPITER,
          EPlanet.VENUS,
        ],
        probePlacement: ERivalProbePlacement.LANDER,
      }),
    ],
  },
  {
    id: 'S.13',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      probe({
        movement: 4,
        planets: [EPlanet.NEPTUNE, EPlanet.URANUS, EPlanet.MARS, EPlanet.VENUS],
        probePlacement: ERivalProbePlacement.LANDER,
      }),
      analyze([VP_3]),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.14',
    deckTier: ERivalActionCardTier.ADVANCED,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      launch([PUBLICITY_1, PROGRESS_1]),
      tech({ paid: true, effects: [PROGRESS_1] }),
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
  {
    id: 'S.15',
    deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      launch([PUBLICITY_1]),
      probe({
        movement: 4,
        planets: [EPlanet.SATURN],
        probePlacement: ERivalProbePlacement.LANDER,
        collectMascamitesSample: true,
      }),
      probe({
        movement: 5,
        planets: [EPlanet.JUPITER],
        probePlacement: ERivalProbePlacement.LANDER,
        collectMascamitesSample: true,
      }),
    ],
  },
  {
    id: 'S.16',
    deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      { kind: ERivalActionKind.MARK_TRACE },
      tech({ effects: [PROGRESS_1] }),
    ],
  },
  {
    id: 'S.17',
    deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
    decisionDirection: ERivalDecisionDirection.LEFT,
    candidates: [
      probe({
        movement: 4,
        probeTarget: ERivalProbeTarget.OUMUAMUA,
        probePlacement: ERivalProbePlacement.LANDER,
      }),
      telescope(ERivalTelescopeMode.OUMUAMUA),
    ],
  },
  {
    id: 'S.18',
    deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      { kind: ERivalActionKind.START_COUNTDOWN },
      telescope(ERivalTelescopeMode.DEFAULT),
    ],
  },
  {
    id: 'S.19',
    deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
    decisionDirection: ERivalDecisionDirection.RIGHT,
    candidates: [
      { kind: ERivalActionKind.PLAY_DANGER_CARD },
      telescope(ERivalTelescopeMode.EARTH),
    ],
  },
];
