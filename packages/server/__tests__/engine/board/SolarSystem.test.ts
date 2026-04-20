import { EMainAction } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): Game {
  return Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
}

function resolveAllInputs(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`expected player ${playerId} to exist`);
  }

  while (player.waitingFor) {
    const model = player.waitingFor.toModel();

    if (model.type === EPlayerInputType.CARD) {
      const cardModel = model as {
        cards: Array<{ id: string }>;
        minSelections: number;
      };
      game.processInput(playerId, {
        type: EPlayerInputType.CARD,
        cardIds: cardModel.cards
          .slice(0, cardModel.minSelections)
          .map((card) => card.id),
      });
      continue;
    }

    if (model.type === EPlayerInputType.END_OF_ROUND) {
      const picker = model as ISelectEndOfRoundCardInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: picker.cards[0].id,
      });
      continue;
    }

    if (model.type === EPlayerInputType.OPTION) {
      const options = model as ISelectOptionInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.OPTION,
        optionId: options.options[0].id,
      });
      continue;
    }

    break;
  }
}

describe('SolarSystem', () => {
  it('builds expected total space count from 4 rings', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('space-count'),
    );
    expect(board.spaces).toHaveLength(8 + 16 + 24 + 32);
  });

  it('keeps adjacency symmetric', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('adjacency'),
    );

    for (const [spaceId, neighbors] of board.adjacency.entries()) {
      for (const neighborId of neighbors) {
        expect(board.adjacency.get(neighborId) ?? []).toContain(spaceId);
      }
    }
  });

  it('moves probes with rotated disc', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('rotation-move'),
    );
    const space0 = 'ring-1-cell-0';
    const space1 = 'ring-1-cell-1';
    const probe = board.placeProbe('p1', space0);

    board.rotate(0);

    expect(board.getProbesAt(space0).some((item) => item.id === probe.id)).toBe(
      false,
    );
    expect(board.getProbesAt(space1).some((item) => item.id === probe.id)).toBe(
      true,
    );
  });

  it('rotates in sequence top -> middle -> bottom -> top', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('rotation-seq'),
    );
    expect(board.rotateNextDisc()).toBe(0);
    expect(board.rotateNextDisc()).toBe(1);
    expect(board.rotateNextDisc()).toBe(2);
    expect(board.rotateNextDisc()).toBe(0);
  });

  it('pushes lower-ring probes when upper NULL closes after rotation', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('push'),
    );
    const ring1cell0 = board.spaces.find(
      (space) => space.id === 'ring-1-cell-0',
    );
    const ring1cell7 = board.spaces.find(
      (space) => space.id === 'ring-1-cell-7',
    );
    const ring2cell0 = board.spaces.find(
      (space) => space.id === 'ring-2-cell-0',
    );
    const ring2cell1 = board.spaces.find(
      (space) => space.id === 'ring-2-cell-1',
    );

    if (!ring1cell0 || !ring1cell7 || !ring2cell0 || !ring2cell1) {
      throw new Error('Expected ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    ring2cell1.hasPublicityIcon = true;

    const probe = board.placeProbe('p1', ring2cell0.id);
    board.rotate(0);

    expect(
      board.getProbesAt(ring2cell0.id).some((item) => item.id === probe.id),
    ).toBe(false);
    expect(
      board.getProbesAt(ring2cell1.id).some((item) => item.id === probe.id),
    ).toBe(true);
    expect(board.getPlayerPublicity('p1')).toBe(1);
  });

  it('awards publicity only on enter', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('publicity-enter'),
    );
    const from = board.spaces.find((space) => space.id === 'ring-2-cell-0');
    const to = board.spaces.find((space) => space.id === 'ring-2-cell-1');
    if (!from || !to) {
      throw new Error('Expected spaces for move test');
    }

    from.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    to.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    from.hasPublicityIcon = false;
    to.hasPublicityIcon = true;

    const probe = board.placeProbe('p2', from.id);
    const firstMove = board.moveProbe(probe.id, from.id, to.id);
    expect(firstMove.publicityGained).toBe(1);
    expect(board.getPlayerPublicity('p2')).toBe(1);

    const secondMove = board.moveProbe(probe.id, to.id, from.id);
    expect(secondMove.publicityGained).toBe(0);
    expect(board.getPlayerPublicity('p2')).toBe(1);
  });

  it('does not allow traversing sun', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('sun'),
    );
    const probe = board.placeProbe('p1', 'ring-1-cell-0');

    const sunSpace = board.spaces.find((space) => space.id === 'sun-center');
    if (sunSpace) {
      sunSpace.elements = [{ type: ESolarSystemElementType.SUN, amount: 1 }];
    } else {
      board.spaces.push({
        id: 'sun-center',
        ringIndex: 0,
        indexInRing: 0,
        discIndex: null,
        hasPublicityIcon: false,
        elements: [{ type: ESolarSystemElementType.SUN, amount: 1 }],
        occupants: [],
      });
    }

    expect(() =>
      board.moveProbe(probe.id, 'ring-1-cell-0', 'sun-center'),
    ).toThrow();
  });

  it('charges extra movement cost when leaving asteroid', () => {
    const board = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('asteroid-cost'),
    );
    const from = board.spaces.find((space) => space.id === 'ring-2-cell-0');
    const to = board.spaces.find((space) => space.id === 'ring-2-cell-1');
    if (!from || !to) {
      throw new Error('Expected spaces for asteroid move');
    }

    from.elements = [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }];
    to.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    const probe = board.placeProbe('p3', from.id);
    const moveResult = board.moveProbe(probe.id, from.id, to.id);

    expect(moveResult.movementCost).toBe(2);
  });

  it('rotates the solar system on RESEARCH_TECH main action', () => {
    const game = createIntegrationGame('solar-research-tech-rotates');
    const player = game.players[0];
    player.resources.gain({ publicity: 2 });
    const before = game.solarSystem!.rotationCounter;

    game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });
    resolveAllInputs(game, player.id);

    expect(game.solarSystem!.rotationCounter).toBe(before + 1);
  });

  it('rotates the solar system exactly once when a played card has both ROTATE and TECH', () => {
    // Card 59 "Ion Propulsion System" prints ENERGY + ROTATE + TECH_PROBE.
    // Under the decoupled behavior model the printed ROTATE icon is the
    // sole rotation source — the embedded tech-grant must NOT rotate
    // again, so we expect exactly +1.
    const game = createIntegrationGame('solar-card-rotate-plus-tech');
    const player = game.players[0];
    player.hand = ['59'];
    game.mainDeck = new Deck(['refill-1', 'refill-2'], []);
    const before = game.solarSystem!.rotationCounter;

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    resolveAllInputs(game, player.id);

    expect(player.techs).toHaveLength(1);
    expect(game.solarSystem!.rotationCounter).toBe(before + 1);
  });

  it('does not rotate the solar system when a card grants TECH without a printed ROTATE icon', () => {
    // Card 81 "Int'l Collaboration" prints TECH_ANY + DESC only (no ROTATE).
    // Decoupled behavior: no ROTATE icon → no rotation, even though a tech
    // is granted. The rule §5.7 "card-tech includes rotation" is honored at
    // the card design layer: any card that is meant to rotate prints ROTATE.
    const game = createIntegrationGame('solar-card-tech-only-no-rotate');
    const player = game.players[0];
    player.hand = ['81'];
    game.mainDeck = new Deck(['refill-1', 'refill-2'], []);
    const before = game.solarSystem!.rotationCounter;

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    resolveAllInputs(game, player.id);

    expect(player.techs).toHaveLength(1);
    expect(game.solarSystem!.rotationCounter).toBe(before);
  });

  it('rotates only on the first PASS of the round', () => {
    const game = createIntegrationGame('solar-first-pass-only');
    const firstPlayer = game.players[0];
    const secondPlayer = game.players[1];

    game.processMainAction(firstPlayer.id, { type: EMainAction.PASS });
    resolveAllInputs(game, firstPlayer.id);

    const afterFirstPass = game.solarSystem!.rotationCounter;
    expect(afterFirstPass).toBe(1);

    game.processMainAction(secondPlayer.id, { type: EMainAction.PASS });
    resolveAllInputs(game, secondPlayer.id);

    expect(game.solarSystem!.rotationCounter).toBe(afterFirstPass);
  });
});
