import { ETech } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechBonusType } from '@seti/common/types/tech';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import { Game } from '@/engine/Game.js';

export const BEHAVIOR_FLOW_SCENARIO_PRESET = 'behavior-flow';
export const BEHAVIOR_FLOW_SEED = 'behavior-flow-seed';

const BEHAVIOR_FLOW_START_RESOURCES = {
  credits: 4,
  energy: 4,
  publicity: 4,
} as const;

function setPlayerNumericResource(
  player: Game['players'][number],
  resource: 'credits' | 'energy',
  target: number,
): void {
  const current = player.resources[resource];
  if (current === target) {
    return;
  }

  if (current < target) {
    player.resources.gain({ [resource]: target - current });
    return;
  }

  player.resources.spend({ [resource]: current - target });
}

function patchSolarSystemForBehaviorScenario(game: Game): void {
  const cell2 = game.solarSystem?.spaces.find(
    (space) => space.id === 'ring-1-cell-2',
  );
  if (!cell2) {
    throw new Error('ring-1-cell-2 not found');
  }

  cell2.elements = [
    ...cell2.elements,
    { type: ESolarSystemElementType.ASTEROID, amount: 1 },
  ];
}

function patchTechBoardForBehaviorScenario(game: Game): void {
  const techBoard = game.techBoard;
  if (!techBoard) {
    return;
  }

  for (const [, stack] of techBoard.stacks) {
    if (stack.tiles.length === 0) {
      continue;
    }

    if (stack.category === ETech.COMPUTER) {
      stack.tiles[0].bonus = { type: ETechBonusType.ENERGY };
    } else if (stack.category === ETech.SCAN) {
      stack.tiles[0].bonus = { type: ETechBonusType.CARD };
    } else if (stack.category === ETech.PROBE) {
      stack.tiles[0].bonus = { type: ETechBonusType.PUBLICITY };
    }
  }
}

function patchP1HandForBehaviorScenario(game: Game): void {
  const p1 = game.players[0];
  if (!p1) {
    throw new Error('Behavior scenario requires player p1');
  }

  p1.hand = ['8', '80', '16', '130', '110'];
  p1.tuckedIncomeCards = [];

  const tuckInput = TuckCardForIncomeEffect.execute(p1, game);
  if (!tuckInput) {
    throw new Error('Failed to create tuck input for behavior scenario');
  }

  p1.waitingFor = tuckInput;
  game.processInput(p1.id, {
    type: EPlayerInputType.CARD,
    cardIds: ['8'],
  });

  setPlayerNumericResource(
    p1,
    'credits',
    BEHAVIOR_FLOW_START_RESOURCES.credits,
  );
  setPlayerNumericResource(p1, 'energy', BEHAVIOR_FLOW_START_RESOURCES.energy);
  p1.resources.setPublicity(BEHAVIOR_FLOW_START_RESOURCES.publicity);
  p1.score = 1;
}

export function applyBehaviorFlowScenario(game: Game): void {
  patchSolarSystemForBehaviorScenario(game);
  patchTechBoardForBehaviorScenario(game);
  patchP1HandForBehaviorScenario(game);
}
