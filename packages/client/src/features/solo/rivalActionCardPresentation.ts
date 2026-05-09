import { rivalActionCards } from '@seti/common/data/rivalActionCards';
import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  ERivalActionCardTier,
  ERivalActionKind,
  ERivalDecisionDirection,
  ERivalProbePlacement,
  ERivalProbeTarget,
  type IRivalActionCandidateDefinition,
  type IRivalActionCardDefinition,
  type TRivalActionCardId,
} from '@seti/common/types/protocol/solo';

type TT = (key: string, options?: Record<string, unknown>) => string;

const RIVAL_ACTION_CARD_BY_ID = new Map<
  TRivalActionCardId,
  IRivalActionCardDefinition
>(rivalActionCards.map((card) => [card.id, card]));

export const RIVAL_ACTION_CARD_IMAGE_SRC_BY_ID: Partial<
  Record<TRivalActionCardId, string>
> = Object.fromEntries(
  Array.from({ length: 19 }, (_, index) => {
    const id = `S.${index + 1}` as TRivalActionCardId;
    return [id, `/assets/seti/solo/action-cards/${id}.jpg`];
  }),
);

const ACTION_KIND_DEFAULT_LABEL: Record<ERivalActionKind, string> = {
  [ERivalActionKind.ANALYZE_DATA]: 'Analyze data',
  [ERivalActionKind.LAUNCH_PROBE]: 'Launch probe',
  [ERivalActionKind.RESEARCH_TECH]: 'Research tech',
  [ERivalActionKind.PROBE_PLACEMENT]: 'Probe placement',
  [ERivalActionKind.SCAN]: 'Scan',
  [ERivalActionKind.SPECIES_REPLACEMENT_CHECK]: 'Species check',
  [ERivalActionKind.MARK_TRACE]: 'Mark trace',
  [ERivalActionKind.MARK_ANY_TRACE]: 'Mark any trace',
  [ERivalActionKind.PLAY_DANGER_CARD]: 'Play danger card',
  [ERivalActionKind.START_COUNTDOWN]: 'Start countdown',
};

const ACTION_TIER_DEFAULT_LABEL: Record<ERivalActionCardTier, string> = {
  [ERivalActionCardTier.BASIC]: 'Basic',
  [ERivalActionCardTier.ADVANCED]: 'Advanced',
  [ERivalActionCardTier.SPECIES_SPECIAL]: 'Species',
};

const DECISION_DEFAULT_LABEL: Record<ERivalDecisionDirection, string> = {
  [ERivalDecisionDirection.LEFT]: 'Left',
  [ERivalDecisionDirection.RIGHT]: 'Right',
};

const PROBE_PLACEMENT_DEFAULT_LABEL: Record<ERivalProbePlacement, string> = {
  [ERivalProbePlacement.ORBITER]: 'Orbiter',
  [ERivalProbePlacement.LANDER]: 'Lander',
};

const PROBE_TARGET_DEFAULT_LABEL: Record<ERivalProbeTarget, string> = {
  [ERivalProbeTarget.OUMUAMUA]: 'Oumuamua',
};

export function getRivalActionCardDefinition(
  cardId: TRivalActionCardId,
): IRivalActionCardDefinition | undefined {
  return RIVAL_ACTION_CARD_BY_ID.get(cardId);
}

export function getRivalActionCardImageSrc(
  cardId: TRivalActionCardId,
): string | undefined {
  return RIVAL_ACTION_CARD_IMAGE_SRC_BY_ID[cardId];
}

export function formatRivalActionKind(
  actionKind: ERivalActionKind | string,
  t: TT,
): string {
  const defaultValue =
    actionKind in ACTION_KIND_DEFAULT_LABEL
      ? ACTION_KIND_DEFAULT_LABEL[actionKind as ERivalActionKind]
      : actionKind;
  return t(`client.rival_action_card.actions.${actionKind}`, {
    defaultValue,
  });
}

export function formatRivalActionCardTier(
  tier: ERivalActionCardTier,
  t: TT,
): string {
  return t(`client.rival_action_card.tiers.${tier}`, {
    defaultValue: ACTION_TIER_DEFAULT_LABEL[tier],
  });
}

export function formatRivalDecisionDirection(
  direction: ERivalDecisionDirection,
  t: TT,
): string {
  return t(`client.rival_action_card.decisions.${direction}`, {
    defaultValue: DECISION_DEFAULT_LABEL[direction],
  });
}

export function formatRivalActionCandidate(
  candidate: IRivalActionCandidateDefinition,
  t: TT,
): string {
  const parts = [formatRivalActionKind(candidate.kind, t)];

  if (candidate.paid !== undefined) {
    parts.push(
      t(
        candidate.paid
          ? 'client.rival_action_card.candidate.paid'
          : 'client.rival_action_card.candidate.free',
      ),
    );
  }
  if (candidate.movement !== undefined) {
    parts.push(
      t('client.rival_action_card.candidate.movement', {
        count: candidate.movement,
        defaultValue: '{{count}} movement',
      }),
    );
  }
  if (candidate.planets?.length) {
    parts.push(
      t('client.rival_action_card.candidate.planets', {
        planets: candidate.planets.map(formatPlanetName).join(', '),
        defaultValue: 'Targets: {{planets}}',
      }),
    );
  }
  if (candidate.probePlacement) {
    parts.push(
      t(
        `client.rival_action_card.probe_placements.${candidate.probePlacement}`,
        {
          defaultValue: PROBE_PLACEMENT_DEFAULT_LABEL[candidate.probePlacement],
        },
      ),
    );
  }
  if (candidate.probeTarget) {
    parts.push(
      t('client.rival_action_card.candidate.probe_target', {
        target: t(
          `client.rival_action_card.probe_targets.${candidate.probeTarget}`,
          {
            defaultValue: PROBE_TARGET_DEFAULT_LABEL[candidate.probeTarget],
          },
        ),
        defaultValue: 'Target: {{target}}',
      }),
    );
  }
  if (candidate.alienIndex !== undefined) {
    parts.push(
      t('client.rival_action_card.candidate.alien_index', {
        index: candidate.alienIndex,
        defaultValue: 'Alien {{index}}',
      }),
    );
  }

  return parts.join(' · ');
}

function formatPlanetName(planet: EPlanet): string {
  return planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
}
