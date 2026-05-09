import {
  ERivalObjectiveTaskKind,
  type IRivalObjectiveDefinition,
  type IRivalObjectiveTaskDefinition,
  RIVAL_OBJECTIVE_DEFINITIONS,
} from '@seti/common/constant/solo';
import {
  ERivalObjectiveTrigger,
  type TRivalObjectiveId,
  type TRivalObjectiveTriggerKey,
} from '@seti/common/types/protocol/solo';

type TT = (key: string, options?: Record<string, unknown>) => string;

const RIVAL_OBJECTIVE_BY_ID = new Map<
  TRivalObjectiveId,
  IRivalObjectiveDefinition
>(RIVAL_OBJECTIVE_DEFINITIONS.map((definition) => [definition.id, definition]));

export const RIVAL_OBJECTIVE_IMAGE_SRC_BY_ID: Partial<
  Record<TRivalObjectiveId, string>
> = Object.fromEntries(
  Array.from({ length: 24 }, (_, index) => {
    const id = `SOLO.${index + 1}` as TRivalObjectiveId;
    return [id, `/assets/seti/solo/objective-cards/${id}.png`];
  }),
);

const OBJECTIVE_TRIGGER_DEFAULT_LABEL: Record<ERivalObjectiveTrigger, string> =
  {
    [ERivalObjectiveTrigger.PROBE_LAUNCHED]: 'Launch a probe',
    [ERivalObjectiveTrigger.SCAN_PERFORMED]: 'Scan',
    [ERivalObjectiveTrigger.TECH_PROBE]: 'Probe tech',
    [ERivalObjectiveTrigger.TECH_SCAN]: 'Scan tech',
    [ERivalObjectiveTrigger.TECH_COMPUTER]: 'Computer tech',
    [ERivalObjectiveTrigger.TECH_ANY]: 'Any tech',
    [ERivalObjectiveTrigger.TRACE_BLUE]: 'Blue trace',
    [ERivalObjectiveTrigger.PROBE_VISITED_ASTEROIDS]: 'Visit asteroids',
    [ERivalObjectiveTrigger.PROBE_VISITED_COMET]: 'Visit a comet',
    [ERivalObjectiveTrigger.CARD_COST_3]: 'Play a 3-cost card',
    [ERivalObjectiveTrigger.MISSION_COMPLETED]: 'Complete a mission',
    [ERivalObjectiveTrigger.PROBE_LANDED]: 'Land a probe',
    [ERivalObjectiveTrigger.PROBE_ORBITED]: 'Orbit a probe',
    [ERivalObjectiveTrigger.PLANET_VENUS]: 'Venus mission',
    [ERivalObjectiveTrigger.PLANET_MERCURY]: 'Mercury mission',
    [ERivalObjectiveTrigger.PLANET_JUPITER]: 'Jupiter mission',
    [ERivalObjectiveTrigger.PLANET_SATURN]: 'Saturn mission',
    [ERivalObjectiveTrigger.PLANET_MARS]: 'Mars mission',
    [ERivalObjectiveTrigger.PLANET_NEPTUNE]: 'Neptune mission',
    [ERivalObjectiveTrigger.PLANET_URANUS]: 'Uranus mission',
    [ERivalObjectiveTrigger.SECTOR_DOMINANCE]: 'Win any sector',
    [ERivalObjectiveTrigger.SECTOR_DOMINANCE_YELLOW]: 'Win yellow sector',
    [ERivalObjectiveTrigger.SECTOR_DOMINANCE_RED]: 'Win red sector',
    [ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLUE]: 'Win blue sector',
    [ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLACK]: 'Win black sector',
  };

export function getRivalObjectiveDefinition(
  objectiveId: TRivalObjectiveId,
): IRivalObjectiveDefinition | undefined {
  return RIVAL_OBJECTIVE_BY_ID.get(objectiveId);
}

export function getRivalObjectiveImageSrc(
  objectiveId: TRivalObjectiveId,
): string | undefined {
  return RIVAL_OBJECTIVE_IMAGE_SRC_BY_ID[objectiveId];
}

export function formatRivalObjectiveTask(
  task: IRivalObjectiveTaskDefinition,
  t: TT,
): string {
  switch (task.kind) {
    case ERivalObjectiveTaskKind.MIN_SCORE:
      return t('client.rival_objective.tasks.min_score', {
        amount: task.amount ?? 0,
        defaultValue: 'Reach {{amount}} VP',
      });
    case ERivalObjectiveTaskKind.MIN_DATA_POOL:
      return t('client.rival_objective.tasks.min_data_pool', {
        amount: task.amount ?? 0,
        defaultValue: 'Store {{amount}} data',
      });
    case ERivalObjectiveTaskKind.MIN_PUBLICITY:
      return t('client.rival_objective.tasks.min_publicity', {
        amount: task.amount ?? 0,
        defaultValue: 'Reach {{amount}} publicity',
      });
    case ERivalObjectiveTaskKind.TRIGGER:
      return task.triggerKey
        ? formatRivalObjectiveTrigger(task.triggerKey, t)
        : t('client.rival_objective.tasks.unknown', {
            defaultValue: 'Objective trigger',
          });
  }
}

function formatRivalObjectiveTrigger(
  triggerKey: TRivalObjectiveTriggerKey,
  t: TT,
): string {
  if (triggerKey.startsWith('either:')) {
    const items = triggerKey
      .slice('either:'.length)
      .split('|')
      .map((part) => formatSingleTrigger(part as ERivalObjectiveTrigger, t));
    return t('client.rival_objective.tasks.either', {
      items: items.join(
        t('client.rival_objective.tasks.either_separator', {
          defaultValue: ' or ',
        }),
      ),
      defaultValue: '{{items}}',
    });
  }

  return formatSingleTrigger(triggerKey as ERivalObjectiveTrigger, t);
}

function formatSingleTrigger(trigger: ERivalObjectiveTrigger, t: TT): string {
  return t(`client.rival_objective.triggers.${trigger}`, {
    defaultValue: OBJECTIVE_TRIGGER_DEFAULT_LABEL[trigger] ?? trigger,
  });
}
