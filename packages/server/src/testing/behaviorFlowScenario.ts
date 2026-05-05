import { ETech } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechBonusType } from '@seti/common/types/tech';
import { getMascamitesSampleDeliveryDestination } from '@seti/common/utils/mascamitesSampleDelivery';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { isMascamitesAlienBoard } from '@/engine/alien/AlienBoard.js';
import { MascamitesAlienPlugin } from '@/engine/alien/plugins/MascamitesAlienPlugin.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { Deck } from '@/engine/deck/Deck.js';
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import { Game } from '@/engine/Game.js';
import { EMissionType } from '@/engine/missions/IMission.js';

export const BEHAVIOR_FLOW_SCENARIO_PRESET = 'behavior-flow';
export const BEHAVIOR_FLOW_SEED = 'behavior-flow-seed';
export const SPEND_SIGNAL_TOKEN_SCENARIO_PRESET = 'spend-signal-token';
export const DELIVER_SAMPLE_SCENARIO_PRESET = 'deliver-sample';

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

export function applySpendSignalTokenScenario(game: Game): void {
  const p1 = game.players[0];
  if (!p1) {
    throw new Error('Spend signal token scenario requires player p1');
  }

  patchSolarSystemForBehaviorScenario(game);
  for (const player of game.players) {
    player.waitingFor = undefined;
    player.pendingSetupTucks = 0;
  }
  setPlayerNumericResource(
    p1,
    'credits',
    BEHAVIOR_FLOW_START_RESOURCES.credits,
  );
  setPlayerNumericResource(p1, 'energy', BEHAVIOR_FLOW_START_RESOURCES.energy);
  p1.resources.setPublicity(BEHAVIOR_FLOW_START_RESOURCES.publicity);
  p1.resources.gain({ signalTokens: 1 });
  game.cardRow = ['45', '46', '122'];
  game.mainDeck = new Deck(['55', '73', '11', '89'], []);
}

export function applyDeliverSampleScenario(game: Game): void {
  const p1 = game.players[0];
  if (!p1) {
    throw new Error('Deliver sample scenario requires player p1');
  }
  for (const player of game.players) {
    player.waitingFor = undefined;
    player.pendingSetupTucks = 0;
  }

  const plugin = AlienRegistry.get(EAlienType.MASCAMITES);
  if (!(plugin instanceof MascamitesAlienPlugin)) {
    throw new Error('Mascamites plugin is not registered');
  }

  const board = game.alienState.getBoardByType(EAlienType.MASCAMITES);
  if (!isMascamitesAlienBoard(board)) {
    throw new Error('Mascamites board not found');
  }

  board.discovered = true;
  board.alienDeckDrawPile = ['ET.7', 'ET.5', 'ET.1'];
  board.faceUpAlienCardId = 'ET.1';
  plugin.onDiscover(game, [p1]);

  const missionCardId = 'ET.1';
  const missionCard = loadCardData(missionCardId);
  const destination = getMascamitesSampleDeliveryDestination(missionCard);
  if (!destination) {
    throw new Error('Failed to resolve Mascamites mission destination');
  }

  const tokenId = board.samplePools.jupiter[0];
  if (!tokenId) {
    throw new Error('No Mascamites sample available on Jupiter');
  }

  const capsule = plugin.collectSample(
    p1,
    game,
    EPlanet.JUPITER,
    tokenId,
    missionCardId,
  );

  const destinationSpace = game.solarSystem?.getSpacesOnPlanet(destination)[0];
  if (!destinationSpace) {
    throw new Error(
      `No solar-system space found for destination ${destination}`,
    );
  }
  capsule.spaceId = destinationSpace.id;

  p1.playedMissions.push({ id: missionCardId });
  game.missionTracker.registerMission(
    {
      cardId: missionCardId,
      cardName: missionCard.name,
      type: EMissionType.QUICK,
      branches: [{ req: [], rewards: [] }],
    },
    p1.id,
  );
}
