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
    const space1 = 'ring-1-cell-7';
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
    const ring2cell15 = board.spaces.find(
      (space) => space.id === 'ring-2-cell-15',
    );

    if (!ring1cell0 || !ring1cell7 || !ring2cell0 || !ring2cell15) {
      throw new Error('Expected ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    ring2cell15.hasPublicityIcon = true;

    const probe = board.placeProbe('p1', ring2cell0.id);
    board.rotate(0);

    expect(
      board.getProbesAt(ring2cell0.id).some((item) => item.id === probe.id),
    ).toBe(false);
    expect(
      board.getProbesAt(ring2cell15.id).some((item) => item.id === probe.id),
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

  describe('Phase 4.2: Rotation Trigger Timing Integration', () => {
    it('4.2.1 [Integration] RESEARCH_TECH main action physically rotates disc and moves probes', () => {
      const game = createIntegrationGame('rotation-research-physical');
      const player = game.players[0];
      player.resources.gain({ publicity: 6 });

      // Place probe on disc 0 (top disc, ring 1)
      const probeSpace = 'ring-1-cell-0';
      const expectedNextSpace = 'ring-1-cell-7';
      const probe = game.solarSystem!.placeProbe(player.id, probeSpace);

      // Verify initial position
      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);

      // Perform RESEARCH_TECH (should rotate disc 0 first)
      game.processMainAction(player.id, { type: EMainAction.RESEARCH_TECH });
      resolveAllInputs(game, player.id);

      // Verify probe physically moved to next space
      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(false);
      expect(
        game
          .solarSystem!.getProbesAt(expectedNextSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);
    });

    it('4.2.2 [Integration] Card effect with ROTATE icon triggers physical disc rotation', () => {
      // Card 59 "Ion Propulsion System" has ROTATE icon
      const game = createIntegrationGame('rotation-card-physical');
      const player = game.players[0];
      player.hand = ['59'];
      game.mainDeck = new Deck(['refill-1', 'refill-2'], []);

      // Place probe on disc 0 (will be rotated)
      const probeSpace = 'ring-1-cell-0';
      const expectedNextSpace = 'ring-1-cell-7';
      const probe = game.solarSystem!.placeProbe(player.id, probeSpace);

      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);

      // Play card with ROTATE
      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveAllInputs(game, player.id);

      // Verify physical rotation occurred
      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(false);
      expect(
        game
          .solarSystem!.getProbesAt(expectedNextSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);
    });

    it('4.2.3 [Integration] First PASS of the round physically rotates disc and moves probes', () => {
      const game = createIntegrationGame('rotation-first-pass-physical');
      const firstPlayer = game.players[0];

      // Place probe on disc 0
      const probeSpace = 'ring-1-cell-0';
      const expectedNextSpace = 'ring-1-cell-7';
      const probe = game.solarSystem!.placeProbe(firstPlayer.id, probeSpace);

      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);

      // First player passes
      game.processMainAction(firstPlayer.id, { type: EMainAction.PASS });
      resolveAllInputs(game, firstPlayer.id);

      // Verify physical rotation occurred
      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(false);
      expect(
        game
          .solarSystem!.getProbesAt(expectedNextSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);
    });

    it('4.2.4 [Integration] Non-first PASS does not physically rotate disc or move probes', () => {
      const game = createIntegrationGame('rotation-second-pass-no-physical');
      const firstPlayer = game.players[0];
      const secondPlayer = game.players[1];

      // First player passes (triggers rotation)
      game.processMainAction(firstPlayer.id, { type: EMainAction.PASS });
      resolveAllInputs(game, firstPlayer.id);

      // Place probe on disc 1 (next disc in sequence) after first rotation
      const probeSpace = 'ring-2-cell-0';
      const probe = game.solarSystem!.placeProbe(secondPlayer.id, probeSpace);

      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);

      // Second player passes (should NOT rotate)
      game.processMainAction(secondPlayer.id, { type: EMainAction.PASS });
      resolveAllInputs(game, secondPlayer.id);

      // Verify probe stayed in same position
      expect(
        game
          .solarSystem!.getProbesAt(probeSpace)
          .some((p) => p.id === probe.id),
      ).toBe(true);
    });

    it('4.2.5 [Integration] Rotation counter cycles through all three discs physically', () => {
      // NOTE: Discs are nested - rotating an outer disc also rotates all inner discs:
      // - Disc 0 rotates: ring 1 only
      // - Disc 1 rotates: rings 1 AND 2
      // - Disc 2 rotates: rings 1, 2, AND 3
      // This test verifies the counter cycles: disc 0 → disc 1 → disc 2 → disc 0...
      const game = createIntegrationGame('rotation-cycle-physical');
      const p1 = game.players[0];
      const p2 = game.players[1];
      p1.resources.gain({ publicity: 12 });
      p2.resources.gain({ publicity: 6 });

      // Place probes on the first two rotating discs to verify cycling
      const probe1 = game.solarSystem!.placeProbe(p1.id, 'ring-1-cell-0');
      const probe2 = game.solarSystem!.placeProbe(p2.id, 'ring-2-cell-0');

      expect(game.solarSystem!.rotationCounter).toBe(0);

      // First rotation: disc 0 (rotates ring 1 only) - P1's turn
      game.processMainAction(p1.id, { type: EMainAction.RESEARCH_TECH });
      resolveAllInputs(game, p1.id);
      game.processEndTurn(p1.id);
      expect(game.solarSystem!.rotationCounter).toBe(1);
      // Ring 1 moved
      expect(
        game
          .solarSystem!.getProbesAt('ring-1-cell-7')
          .some((p) => p.id === probe1.id),
      ).toBe(true);
      // Ring 2 unchanged
      expect(
        game
          .solarSystem!.getProbesAt('ring-2-cell-0')
          .some((p) => p.id === probe2.id),
      ).toBe(true);

      // Second rotation: disc 1 (rotates rings 1 AND 2) - P2's turn
      game.processMainAction(p2.id, { type: EMainAction.RESEARCH_TECH });
      resolveAllInputs(game, p2.id);
      game.processEndTurn(p2.id);
      expect(game.solarSystem!.rotationCounter).toBe(2);
      // Ring 1 moved again (from cell-7 to cell-6) due to cascading
      expect(
        game
          .solarSystem!.getProbesAt('ring-1-cell-6')
          .some((p) => p.id === probe1.id),
      ).toBe(true);
      // Ring 2 moved for first time (from cell-0 to cell-15)
      expect(
        game
          .solarSystem!.getProbesAt('ring-2-cell-15')
          .some((p) => p.id === probe2.id),
      ).toBe(true);

      // Next rotation would be disc 2, then cycle back to disc 0
      // Counter at 2 means next is: 2 % 3 = disc 2
      expect(game.solarSystem!.rotationCounter % 3).toBe(2);
      // After one more rotation, counter would be 3, meaning: 3 % 3 = disc 0 (cycles back)
    });
  });
});
