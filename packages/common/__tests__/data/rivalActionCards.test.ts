import { describe, expect, it } from 'vitest';
import {
  RIVAL_BOARD_CONFIGS,
  RIVAL_OBJECTIVE_DEFINITIONS,
  RIVAL_SPECIES_ACTION_CARD_BY_ALIEN,
} from '@/constant/solo';
import { rivalActionCards } from '@/data/rivalActionCards';
import { EAlienType, EPlanet } from '@/types/protocol/enums';
import {
  ERivalActionCardTier,
  ERivalActionKind,
  ERivalDecisionDirection,
  ERivalProbePlacement,
  ERivalProbeTarget,
  ERivalTelescopeMode,
} from '@/types/protocol/solo';

const PROGRESS_1 = { type: 'CUSTOM', effectId: 'RIVAL_PROGRESS_1' } as const;
const PUBLICITY_1 = { type: 'PUBLICITY', amount: 1 } as const;
const VP_3 = { type: 'VP', amount: 3 } as const;

const cardById = new Map(rivalActionCards.map((card) => [card.id, card]));

describe('rivalActionCards data', () => {
  it('matches the extracted basic and advanced rival action card table', () => {
    expect([...cardById.keys()]).toEqual([
      'S.1',
      'S.2',
      'S.3',
      'S.4',
      'S.5',
      'S.6',
      'S.7',
      'S.8',
      'S.9',
      'S.10',
      'S.11',
      'S.12',
      'S.13',
      'S.14',
      'S.15',
      'S.16',
      'S.17',
      'S.18',
      'S.19',
    ]);

    expect(cardById.get('S.7')).toMatchObject({
      deckTier: ERivalActionCardTier.ADVANCED,
      decisionDirection: ERivalDecisionDirection.RIGHT,
      candidates: [
        {
          kind: ERivalActionKind.RESEARCH_TECH,
          paid: true,
          effects: [PROGRESS_1],
        },
        {
          kind: ERivalActionKind.PROBE_PLACEMENT,
          movement: 4,
          planets: [
            EPlanet.URANUS,
            EPlanet.SATURN,
            EPlanet.MERCURY,
            EPlanet.VENUS,
          ],
          probePlacement: ERivalProbePlacement.LANDER,
        },
        {
          kind: ERivalActionKind.SCAN,
          telescopeMode: ERivalTelescopeMode.EARTH,
        },
      ],
    });

    expect(cardById.get('S.8')).toMatchObject({
      deckTier: ERivalActionCardTier.ADVANCED,
      decisionDirection: ERivalDecisionDirection.LEFT,
      candidates: [
        { kind: ERivalActionKind.ANALYZE_DATA, effects: [VP_3] },
        {
          kind: ERivalActionKind.PROBE_PLACEMENT,
          movement: 4,
          planets: [
            EPlanet.NEPTUNE,
            EPlanet.JUPITER,
            EPlanet.MERCURY,
            EPlanet.VENUS,
          ],
          probePlacement: ERivalProbePlacement.LANDER,
        },
        {
          kind: ERivalActionKind.SCAN,
          telescopeMode: ERivalTelescopeMode.EARTH,
        },
      ],
    });

    expect(cardById.get('S.14')).toMatchObject({
      deckTier: ERivalActionCardTier.ADVANCED,
      decisionDirection: ERivalDecisionDirection.RIGHT,
      candidates: [
        {
          kind: ERivalActionKind.LAUNCH_PROBE,
          effects: [PUBLICITY_1, PROGRESS_1],
        },
        {
          kind: ERivalActionKind.RESEARCH_TECH,
          paid: true,
          effects: [PROGRESS_1],
        },
        {
          kind: ERivalActionKind.SCAN,
          telescopeMode: ERivalTelescopeMode.EARTH,
        },
      ],
    });

    expect(cardById.get('S.2')?.candidates.at(-1)).toMatchObject({
      kind: ERivalActionKind.SCAN,
      telescopeMode: ERivalTelescopeMode.DEFAULT,
    });

    expect(cardById.get('S.3')?.candidates[0]).toMatchObject({
      kind: ERivalActionKind.SPECIES_REPLACEMENT_CHECK,
      alienIndex: 1,
    });
    expect(cardById.get('S.4')?.candidates[0]).toMatchObject({
      kind: ERivalActionKind.SPECIES_REPLACEMENT_CHECK,
      alienIndex: 2,
    });
  });

  it('keeps species special action cards as explicit server-resolved data', () => {
    expect(cardById.get('S.15')).toMatchObject({
      deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
      decisionDirection: ERivalDecisionDirection.RIGHT,
      candidates: [
        { kind: ERivalActionKind.LAUNCH_PROBE, effects: [PUBLICITY_1] },
        {
          kind: ERivalActionKind.PROBE_PLACEMENT,
          movement: 5,
          planets: [EPlanet.SATURN, EPlanet.JUPITER],
          probePlacement: ERivalProbePlacement.LANDER,
          collectMascamitesSample: true,
        },
      ],
    });

    expect(cardById.get('S.16')).toMatchObject({
      deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
      decisionDirection: ERivalDecisionDirection.LEFT,
      candidates: [
        { kind: ERivalActionKind.MARK_TRACE },
        { kind: ERivalActionKind.RESEARCH_TECH, effects: [PROGRESS_1] },
      ],
    });

    expect(cardById.get('S.17')).toMatchObject({
      deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
      decisionDirection: ERivalDecisionDirection.LEFT,
      candidates: [
        {
          kind: ERivalActionKind.PROBE_PLACEMENT,
          movement: 4,
          probeTarget: ERivalProbeTarget.OUMUAMUA,
          probePlacement: ERivalProbePlacement.LANDER,
        },
        {
          kind: ERivalActionKind.SCAN,
          telescopeMode: ERivalTelescopeMode.OUMUAMUA,
        },
      ],
    });

    expect(cardById.get('S.18')).toMatchObject({
      deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
      decisionDirection: ERivalDecisionDirection.RIGHT,
      candidates: [
        { kind: ERivalActionKind.START_COUNTDOWN },
        {
          kind: ERivalActionKind.SCAN,
          telescopeMode: ERivalTelescopeMode.DEFAULT,
        },
      ],
    });

    expect(cardById.get('S.19')).toMatchObject({
      deckTier: ERivalActionCardTier.SPECIES_SPECIAL,
      decisionDirection: ERivalDecisionDirection.RIGHT,
      candidates: [
        { kind: ERivalActionKind.PLAY_DANGER_CARD },
        {
          kind: ERivalActionKind.SCAN,
          telescopeMode: ERivalTelescopeMode.EARTH,
        },
      ],
    });

    expect(RIVAL_SPECIES_ACTION_CARD_BY_ALIEN).toMatchObject({
      [EAlienType.MASCAMITES]: 'S.15',
      [EAlienType.ANOMALIES]: 'S.16',
      [EAlienType.OUMUAMUA]: 'S.17',
      [EAlienType.CENTAURIANS]: 'S.18',
      [EAlienType.EXERTIANS]: 'S.19',
    });
  });

  it('uses canonical solo domain names instead of frontend-reference aliases', () => {
    expect(
      Object.values(RIVAL_BOARD_CONFIGS).map((config) => config.boardConfigId),
    ).toEqual([
      'rival-board-1',
      'rival-board-1',
      'rival-board-2',
      'rival-board-3',
      'rival-board-4',
    ]);

    const serializedCards = JSON.stringify(rivalActionCards);
    expect(serializedCards).not.toContain('lifeIndex');
    expect(cardById.get('S.3')?.candidates[0]).toMatchObject({
      kind: 'species-replacement-check',
      alienIndex: 1,
    });
    expect(cardById.get('S.4')?.candidates[0]).toMatchObject({
      kind: 'species-replacement-check',
      alienIndex: 2,
    });

    const serializedObjectives = JSON.stringify(RIVAL_OBJECTIVE_DEFINITIONS);
    expect(serializedObjectives).not.toMatch(
      /techfly|techlook|techcomp|lifeblue|missionrover|missionsatellite|completeQuest|cardCost3|dominanceyellow|dominancered|dominanceblue|dominanceblack|missionvenus|missionmercury|missionjupiter|missionsaturn|missionmars|missionneptune|missionuranus/,
    );
  });
});
