import type { ESector } from '@seti/common/types/element';
import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectCardInputModel,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import {
  isAnomaliesAlienBoard,
  type TSlotReward,
} from '@/engine/alien/AlienBoard.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import type { TSolarSystemAnomalyTraceColor } from '@/engine/board/SolarSystem.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

export function createAnomaliesGame(seed: string): {
  game: Game;
  player: Player;
} {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players[0] as Player;
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  if (!isAnomaliesAlienBoard(board)) {
    throw new Error('expected anomalies board');
  }
  board.discovered = true;
  return { game, player };
}

export function getEarthSectorIndex(game: Game): number {
  if (!game.solarSystem) {
    throw new Error('expected solar system');
  }
  const earthSpace = game.solarSystem.getSpacesOnPlanet(EPlanet.EARTH)[0];
  if (!earthSpace) {
    throw new Error('expected earth space');
  }
  return Math.floor(earthSpace.indexInRing / earthSpace.ringIndex);
}

export function addAnomalyToken(
  game: Game,
  sectorIndex: number,
  color: TSolarSystemAnomalyTraceColor = ETrace.RED,
  rewards: TSlotReward[] = [{ type: 'VP', amount: 2 }],
): void {
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  if (!isAnomaliesAlienBoard(board)) {
    throw new Error('expected anomalies board');
  }
  if (!game.solarSystem) {
    throw new Error('expected solar system');
  }

  game.solarSystem.addAlienToken({
    tokenId: `alien-${board.alienIndex}-anomaly-token|${sectorIndex}|${color}`,
    alienType: EAlienType.ANOMALIES,
    sectorIndex,
    traceColor: color,
    rewards,
  });
}

export function toAnySignalOptionId(color: ESector): string {
  if (color === 'red-signal') return 'any-signal-red';
  if (color === 'yellow-signal') return 'any-signal-yellow';
  if (color === 'blue-signal') return 'any-signal-blue';
  return 'any-signal-black';
}

export function setMainDeck(game: Game, drawPile: string[]): void {
  game.mainDeck = new Deck(drawPile, []);
}

export function resolveDeferredInputs(
  game: Game,
  pick?: (model: IPlayerInputModel) => string,
): void {
  let guard = 0;
  let pending: IPlayerInput | undefined = game.deferredActions.drain(game);

  while (pending) {
    guard += 1;
    if (guard > 60) {
      throw new Error('input resolution exceeded 60 iterations');
    }

    let input: IPlayerInput | undefined = pending;
    while (input) {
      const model = input.toModel() as IPlayerInputModel;
      const selected = pick?.(model);

      if (model.type === EPlayerInputType.OPTION) {
        const options = (model as ISelectOptionInputModel).options;
        const done = options.find((o) => o.id === 'done')?.id;
        const skip = options.find((o) => o.id === 'skip-missions')?.id;
        const optionId = selected ?? done ?? skip ?? options[0]?.id;
        if (!optionId) throw new Error('missing option selection');
        input = input.process({
          type: EPlayerInputType.OPTION,
          optionId,
        });
        continue;
      }

      if (model.type === EPlayerInputType.CARD) {
        const cards = (model as ISelectCardInputModel).cards;
        const cardId = selected ?? cards[0]?.id;
        if (!cardId) throw new Error('missing card selection');
        input = input.process({
          type: EPlayerInputType.CARD,
          cardIds: [cardId],
        });
        continue;
      }

      if (model.type === EPlayerInputType.TRACE) {
        const traces = (model as ISelectTraceInputModel).options;
        const trace = (selected as ETrace | undefined) ?? traces[0];
        if (!trace) throw new Error('missing trace selection');
        input = input.process({ type: EPlayerInputType.TRACE, trace });
        continue;
      }

      throw new Error(`unsupported input type in test: ${model.type}`);
    }

    pending = game.deferredActions.drain(game);
  }
}
