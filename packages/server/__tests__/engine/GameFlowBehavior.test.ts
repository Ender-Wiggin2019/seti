import { EResource, ETech, ETrace } from '@seti/common/types/element';
import {
  EFreeAction,
  EMainAction,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { LaunchProbeAction } from '@/engine/actions/LaunchProbe.js';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { ScanAction } from '@/engine/actions/Scan.js';
import { Game } from '@/engine/Game.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import type { TPartialResourceBundle } from '@/engine/player/Resources.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function getPlayer(game: Game, id: string): IPlayer {
  return game.players.find((p) => p.id === id)!;
}

/**
 * Resolve all pending inputs by auto-picking the first valid option.
 * Used for actions where we don't care about the choice (e.g., p2's pass).
 */
function resolveAllInputs(game: Game, player: IPlayer): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel();

    if (model.type === EPlayerInputType.CARD) {
      const cardModel = model as {
        cards: { id: string }[];
        minSelections: number;
      };
      const cardIds = cardModel.cards
        .slice(0, cardModel.minSelections)
        .map((c) => c.id);
      game.processInput(player.id, { type: EPlayerInputType.CARD, cardIds });
    } else if (model.type === EPlayerInputType.END_OF_ROUND) {
      const eorModel = model as ISelectEndOfRoundCardInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: eorModel.cards[0].id,
      });
    } else if (model.type === EPlayerInputType.OPTION) {
      const optModel = model as ISelectOptionInputModel;
      const doneOpt = optModel.options.find((o) => o.id === 'done');
      if (doneOpt) {
        game.processInput(player.id, {
          type: EPlayerInputType.OPTION,
          optionId: 'done',
        });
      } else {
        game.processInput(player.id, {
          type: EPlayerInputType.OPTION,
          optionId: optModel.options[0].id,
        });
      }
    } else if (model.type === EPlayerInputType.GOLD_TILE) {
      const gtModel = model as { options: string[] };
      game.processInput(player.id, {
        type: EPlayerInputType.GOLD_TILE,
        tileId: gtModel.options[0],
      });
    } else if (model.type === EPlayerInputType.TECH) {
      const techModel = model as { options: string[] };
      game.processInput(player.id, {
        type: EPlayerInputType.TECH,
        tech: techModel.options[0],
      } as never);
    } else if (model.type === EPlayerInputType.TRACE) {
      const traceModel = model as ISelectTraceInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.TRACE,
        trace: traceModel.options[0],
      });
    } else {
      break;
    }
  }
}

function passPlayer(game: Game, playerId: string): void {
  game.processMainAction(playerId, { type: EMainAction.PASS });
  resolveAllInputs(game, getPlayer(game, playerId));
}

/**
 * Modify ring-1-cell-2 from NULL to ASTEROID so that after the first
 * disc rotation (triggered by p2's pass), the board layout becomes:
 *
 *   ..., VENUS (cell-2), ASTEROID (cell-3), EARTH (cell-4), ...
 *
 * This enables the probe movement scenario: Earth → Asteroid → Venus.
 */
function patchSolarSystemForScenario(game: Game): void {
  const ss = game.solarSystem!;
  const cell2 = ss.spaces.find((s) => s.id === 'ring-1-cell-2');
  if (!cell2) throw new Error('ring-1-cell-2 not found');

  cell2.elements = [
    { type: ESolarSystemElementType.ASTEROID, amount: 1 },
  ];
}

/** Map an EResource income type to a single-unit resource gain bundle. */
function incomeResourceToGainBundle(resource: EResource): TPartialResourceBundle {
  switch (resource) {
    case EResource.CREDIT: return { credits: 1 };
    case EResource.ENERGY: return { energy: 1 };
    case EResource.DATA: return { data: 1 };
    case EResource.PUBLICITY: return { publicity: 1 };
    default: return {};
  }
}

/**
 * Tuck a card from the player's hand for income using engine methods.
 *
 * Resolves the card's income type via `loadCardData`, then applies:
 *   - tucked card income (+1 of the income resource per round)
 *   - immediate tuck bonus (+1 resource of the income type)
 */
function tuckCardForIncome(player: IPlayer, cardId: string): void {
  const cardIndex = player.findCardInHand(cardId);
  if (cardIndex < 0) throw new Error(`Card ${cardId} not found in hand`);

  player.removeCardAt(cardIndex);
  player.tuckedIncomeCards.push(cardId);

  const cardData = loadCardData(cardId);
  player.income.addTuckedIncome(cardData.income);
  player.resources.gain(incomeResourceToGainBundle(cardData.income));
}

/**
 * Set up the player's initial 5-card hand and clear any auto-tucked state.
 * Only card IDs are fixed here; the tuck choice happens in the test.
 */
function setupPlayerHand(player: IPlayer): void {
  player.hand = ['8', '80', '130', '110', '16'];
  player.tuckedIncomeCards = [];
}

/**
 * Patch tech board so that each stack's top tile has a deterministic bonus:
 *   - All COMPUTER (blue) stacks: ENERGY
 *   - All SCAN stacks: CARD
 *   - All PROBE stacks: PUBLICITY
 */
function patchTechBoardForScenario(game: Game): void {
  const techBoard = game.techBoard!;
  for (const [, stack] of techBoard.stacks) {
    if (stack.tiles.length === 0) continue;
    const category = stack.category;
    if (category === ETech.COMPUTER) {
      stack.tiles[0].bonus = { type: ETechBonusType.ENERGY };
    } else if (category === ETech.SCAN) {
      stack.tiles[0].bonus = { type: ETechBonusType.CARD };
    } else if (category === ETech.PROBE) {
      stack.tiles[0].bonus = { type: ETechBonusType.PUBLICITY };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Behavior-Driven Game Flow Test
//
// Scenario: p1 plays mission card '80', launches a probe, moves through
// an asteroid to reach Venus, gaining publicity along the way.
// ─────────────────────────────────────────────────────────────────────────
describe('Game Flow: Play Card → Launch → Move → Visit Venus', () => {
  let game: Game;
  let p1: IPlayer;
  let p2: IPlayer;

  beforeAll(() => {
    game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'behavior-flow-seed',
      'behavior-test-game',
    );

    p1 = getPlayer(game, 'p1');
    p2 = getPlayer(game, 'p2');

    patchSolarSystemForScenario(game);
    patchTechBoardForScenario(game);
    setupPlayerHand(p1);
  });

  // ── 1. Game initialization ───────────────────────────────────────────
  it('1. game is initialized as a 2-player game in round 1', () => {
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.round).toBe(1);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.players).toHaveLength(2);
    expect(game.solarSystem).not.toBeNull();
  });

  // ── 2. Solar system layout after patch ───────────────────────────────
  it('2. ring-1-cell-2 is patched to ASTEROID (between Venus and Earth)', () => {
    const ss = game.solarSystem!;
    const cell2 = ss.spaces.find((s) => s.id === 'ring-1-cell-2')!;
    expect(
      cell2.elements.some(
        (e) => e.type === ESolarSystemElementType.ASTEROID && e.amount > 0,
      ),
    ).toBe(true);
  });

  // ── 3. Initial resources (before tuck) ───────────────────────────────
  it('3. p1 initial resources before tuck (credits 4, energy 3, publicity 4)', () => {
    expect(p1.resources.credits).toBe(4);
    expect(p1.resources.energy).toBe(3);
    expect(p1.resources.publicity).toBe(4);
    expect(p1.resources.data).toBe(0);
    expect(p1.score).toBe(1); // seatIndex 0 + 1
  });

  // ── 4. Initial 5-card hand ───────────────────────────────────────────
  it('4. p1 has 5 cards dealt, including card 80 and card 8', () => {
    expect(p1.hand).toHaveLength(5);
    expect(p1.hand).toContain('80');
    expect(p1.hand).toContain('8');
    expect(p1.tuckedIncomeCards).toHaveLength(0);
  });

  // ── 5. Tuck card '8' for income ──────────────────────────────────────
  it('5. tuck card 8 → energy income +1, energy resource +1', () => {
    const energyBefore = p1.resources.energy;
    const energyIncomeBefore = p1.income.computeRoundPayout()[EResource.ENERGY];

    tuckCardForIncome(p1, '8');

    expect(p1.tuckedIncomeCards).toEqual(['8']);
    expect(p1.hand).toHaveLength(4);
    expect(p1.hand).not.toContain('8');
    expect(p1.hand[0]).toBe('80');

    expect(p1.income.computeRoundPayout()[EResource.ENERGY]).toBe(
      energyIncomeBefore + 1,
    );
    expect(p1.resources.energy).toBe(energyBefore + 1); // 3 → 4
  });

  // ── 6. Available actions check ───────────────────────────────────────
  it('6. p1 can launch, scan, play card, pass — cannot orbit/land', () => {
    expect(LaunchProbeAction.canExecute(p1, game)).toBe(true);
    expect(ScanAction.canExecute(p1, game)).toBe(true);
    expect(PlayCardAction.canExecute(p1, game)).toBe(true);

    expect(p1.canLand(EPlanet.VENUS)).toBe(false);
    expect(p1.probesInSpace).toBe(0);
  });

  // ── 7. Play card '80' (Cape Canaveral SFS) ──────────────────────────
  it('7. p1 plays card 80 — spends 1 credit, registers 3-branch LAUNCH mission', () => {
    const creditsBefore = p1.resources.credits; // 4

    game.processMainAction('p1', {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    resolveAllInputs(game, p1);

    expect(p1.resources.credits).toBe(creditsBefore - 1); // 3
    expect(p1.hand).not.toContain('80');
    expect(p1.playedMissions.length).toBeGreaterThanOrEqual(1);

    const missionState = game.missionTracker.getMissionState('p1', '80');
    expect(missionState).toBeDefined();
    expect(missionState!.def.branches).toHaveLength(3);
    expect(missionState!.branchStates.every((s) => !s.completed)).toBe(true);

    expect(game.activePlayer.id).toBe('p2');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  // ── 8. p2 passes (first pass triggers disc rotation) ────────────────
  it('8. p2 passes — disc rotation shifts ring-1 elements clockwise by 1', () => {
    const rotBefore = game.solarSystem!.rotationCounter;

    passPlayer(game, 'p2');

    expect(game.solarSystem!.rotationCounter).toBe(rotBefore + 1);
    expect(p2.passed).toBe(true);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('8b. after rotation: Earth→cell-4, Asteroid→cell-3, Venus→cell-2', () => {
    const ss = game.solarSystem!;

    const earthSpaces = ss.getSpacesOnPlanet(EPlanet.EARTH);
    expect(earthSpaces.length).toBeGreaterThan(0);
    expect(earthSpaces[0].id).toBe('ring-1-cell-4');

    const cell3 = ss.spaces.find((s) => s.id === 'ring-1-cell-3')!;
    expect(
      cell3.elements.some(
        (e) => e.type === ESolarSystemElementType.ASTEROID && e.amount > 0,
      ),
    ).toBe(true);

    const venusSpaces = ss.getSpacesOnPlanet(EPlanet.VENUS);
    expect(venusSpaces.length).toBeGreaterThan(0);
    expect(venusSpaces[0].id).toBe('ring-1-cell-2');
    expect(venusSpaces[0].hasPublicityIcon).toBe(true);
  });

  // ── 9. p1 launches probe ─────────────────────────────────────────────
  it('9. p1 launches probe — spends 2 credits, probe lands on Earth, mission triggers', () => {
    const creditsBefore = p1.resources.credits; // 3

    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });

    // Full mission branch should trigger — player gets a SelectOption prompt
    expect(p1.waitingFor).toBeDefined();
    const model = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(model.type).toBe(EPlayerInputType.OPTION);

    const missionOption = model.options.find(
      (o) => o.id === 'complete-80-0',
    );
    expect(missionOption).toBeDefined();

    // Claim branch 0 reward: +1 MOVE
    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: 'complete-80-0',
    });

    // Skip remaining triggered branches (branches 1 & 2 also match LAUNCH)
    if (p1.waitingFor) {
      const nextModel = p1.waitingFor.toModel() as ISelectOptionInputModel;
      if (
        nextModel.type === EPlayerInputType.OPTION &&
        nextModel.options.some((o) => o.id === 'skip-missions')
      ) {
        game.processInput('p1', {
          type: EPlayerInputType.OPTION,
          optionId: 'skip-missions',
        });
      }
    }
    resolveAllInputs(game, p1);

    // Verify costs and probe placement
    expect(p1.resources.credits).toBe(creditsBefore - 2); // 1
    expect(p1.probesInSpace).toBe(1);

    const earthSpaces = game.solarSystem!.getSpacesOnPlanet(EPlanet.EARTH);
    const probesOnEarth = earthSpaces[0].occupants.filter(
      (probe) => probe.playerId === 'p1',
    );
    expect(probesOnEarth).toHaveLength(1);
  });

  it('9b. mission branch 0 is completed — p1 has 1 movement point', () => {
    const missionState = game.missionTracker.getMissionState('p1', '80');
    expect(missionState).toBeDefined();
    expect(missionState!.branchStates[0].completed).toBe(true);
    expect(missionState!.branchStates[1].completed).toBe(false);
    expect(missionState!.branchStates[2].completed).toBe(false);

    expect(p1.getMoveStash()).toBe(1);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  // ── 10. Move probe from Earth to asteroid (counterclockwise) ─────────
  it('10. p1 moves probe Earth→Asteroid — costs 1 movement point', () => {
    const moveBefore = p1.getMoveStash(); // 1

    game.processFreeAction('p1', {
      type: EFreeAction.MOVEMENT,
      path: ['ring-1-cell-4', 'ring-1-cell-3'],
    });

    expect(p1.getMoveStash()).toBe(moveBefore - 1); // 0

    const cell3 = game.solarSystem!.spaces.find(
      (s) => s.id === 'ring-1-cell-3',
    )!;
    expect(
      cell3.occupants.some((probe) => probe.playerId === 'p1'),
    ).toBe(true);
  });

  // ── 11. Convert energy → movement, then move Asteroid → Venus ────────
  it('11a. p1 converts 2 energy to 2 movement', () => {
    const energyBefore = p1.resources.energy; // 4

    game.processFreeAction('p1', {
      type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
      amount: 2,
    });

    expect(p1.resources.energy).toBe(energyBefore - 2); // 2
    expect(p1.getMoveStash()).toBe(2);
  });

  it('11b. p1 moves probe Asteroid→Venus — costs 2 (1 base + 1 asteroid leave)', () => {
    const moveBefore = p1.getMoveStash(); // 2
    const publicityBefore = p1.resources.publicity; // 4

    game.processFreeAction('p1', {
      type: EFreeAction.MOVEMENT,
      path: ['ring-1-cell-3', 'ring-1-cell-2'],
    });

    expect(p1.getMoveStash()).toBe(moveBefore - 2); // 0
    expect(p1.resources.publicity).toBe(publicityBefore + 1); // 5
  });

  // ── 12. Probe at Venus verification ────────────────────────────────────
  it('12. probe is now at Venus (ring-1-cell-2)', () => {
    const venusCell = game.solarSystem!.spaces.find(
      (s) => s.id === 'ring-1-cell-2',
    )!;
    expect(
      venusCell.occupants.some((probe) => probe.playerId === 'p1'),
    ).toBe(true);

    expect(p1.resources.credits).toBe(1);
    expect(p1.resources.energy).toBe(2);
    expect(p1.resources.publicity).toBe(5);
    expect(p1.getMoveStash()).toBe(0);
    expect(p1.probesInSpace).toBe(1);
  });

  // ── 13. Action list check (after move to Venus) ─────────────────────
  it('13. no launch/land; orbit and scan allowed', () => {
    expect(LaunchProbeAction.canExecute(p1, game)).toBe(false);
    expect(p1.canLand(EPlanet.VENUS)).toBe(false);

    expect(ScanAction.canExecute(p1, game)).toBe(true);
    expect(PlayCardAction.canExecute(p1, game)).toBe(true);
  });

  // ── 14. Play card '16' (Dragonfly) → land on Venus ─────────────────
  it('14. p1 plays card 16 → Dragonfly triggers landing on Venus', () => {
    // Grant extra energy so the player can afford the landing cost (3 energy)
    p1.resources.gain({ energy: 3 });

    const creditsBefore = p1.resources.credits; // 1
    const energyBefore = p1.resources.energy; // 5
    const scoreBefore = p1.score;
    const cardIndex = p1.hand.indexOf('16');

    game.processMainAction('p1', {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex },
    });

    // Dragonfly's deferred land selection should produce an input
    expect(p1.waitingFor).toBeDefined();
    const landModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(landModel.type).toBe(EPlayerInputType.OPTION);

    const venusOption = landModel.options.find(
      (o) => o.id === `land-${EPlanet.VENUS}`,
    );
    expect(venusOption).toBeDefined();

    // Select Venus — landing queues a life trace deferred action automatically
    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: `land-${EPlanet.VENUS}`,
    });

    // Card 16 costs 1 credit. Landing on Venus costs 3 energy (no orbiter).
    expect(p1.resources.credits).toBe(creditsBefore - 1); // 0
    expect(p1.resources.energy).toBe(energyBefore - 3); // 5 - 3 (landing) = 2
    expect(p1.score).toBe(scoreBefore + 3); // Venus center: 3 VP
    expect(p1.hand).not.toContain('16');
  });

  // ── 15. Trace placement (yellow on left alien discovery) ────────────
  it('15. place yellow trace on alien 0 discovery → +5 VP, +1 publicity', () => {
    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;

    // The life trace from Venus landing is automatically queued by the engine.
    // Player should be prompted to choose a trace color (ANY → pick color).
    expect(p1.waitingFor).toBeDefined();
    const traceModel = p1.waitingFor!.toModel();
    expect(traceModel.type).toBe(EPlayerInputType.TRACE);

    // Select YELLOW trace color
    game.processInput('p1', {
      type: EPlayerInputType.TRACE,
      trace: ETrace.YELLOW,
    });

    // Now should be prompted to pick which slot to place the trace
    expect(p1.waitingFor).toBeDefined();
    const slotModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(slotModel.type).toBe(EPlayerInputType.OPTION);

    const expectedSlotId = `alien-0-discovery-${ETrace.YELLOW}`;
    const discoverySlot = slotModel.options.find(
      (o) => o.id === expectedSlotId,
    );
    expect(discoverySlot).toBeDefined();

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: discoverySlot!.id,
    });

    resolveAllInputs(game, p1);

    expect(p1.score).toBe(scoreBefore + 5);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);
  });

  // ── 16. Game state after landing ────────────────────────────────────
  it('16. Venus landing slot occupied, no probes in solar system', () => {
    const venusState = game.planetaryBoard!.planets.get(EPlanet.VENUS)!;
    expect(
      venusState.landingSlots.some((s) => s.playerId === 'p1'),
    ).toBe(true);

    const venusCell = game.solarSystem!.spaces.find(
      (s) => s.id === 'ring-1-cell-2',
    )!;
    expect(
      venusCell.occupants.filter((o) => o.playerId === 'p1'),
    ).toHaveLength(0);

    expect(p1.probesInSpace).toBe(0);
  });

  // ── 17. Player state after landing + trace ──────────────────────────
  it('17. resources: 0 credits, 2 energy, 6 publicity, data ≥ 1', () => {
    expect(p1.resources.credits).toBe(0);
    expect(p1.resources.energy).toBe(2);
    expect(p1.resources.publicity).toBe(6);
    expect(p1.resources.data).toBeGreaterThanOrEqual(1);
  });

  // ── 18. p2 already passed — p1 gets next turn ──────────────────────
  it('18. p1 active on next turn, can research tech', () => {
    // After card 16 main action resolves, the turn auto-advances past p2
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);

    expect(p1.resources.publicity).toBeGreaterThanOrEqual(6);
  });

  // ── 19. Research tech — select comp-0, place on column 0 ───────────
  it('19. p1 researches tech → spends 6 publicity, comp-0 acquired', () => {
    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;
    const energyBefore = p1.resources.energy;
    const rotBefore = game.solarSystem!.rotationCounter;

    game.processMainAction('p1', { type: EMainAction.RESEARCH_TECH });

    // Should produce a SelectOption for tech choice
    expect(p1.waitingFor).toBeDefined();
    const techModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(techModel.type).toBe(EPlayerInputType.OPTION);

    // Select comp-0 (first blue tech = VP + Credit)
    const comp0Option = techModel.options.find(
      (o) => o.id === ETechId.COMPUTER_VP_CREDIT,
    );
    expect(comp0Option).toBeDefined();

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: ETechId.COMPUTER_VP_CREDIT,
    });

    // Engine should now present column selection for computer tech placement
    if (p1.waitingFor) {
      const colModel = p1.waitingFor.toModel() as ISelectOptionInputModel;
      if (colModel.type === EPlayerInputType.OPTION) {
        // Pick column 0
        const col0Option = colModel.options.find((o) => o.id === 'col-0');
        if (col0Option) {
          game.processInput('p1', {
            type: EPlayerInputType.OPTION,
            optionId: 'col-0',
          });
        }
      }
    }
    resolveAllInputs(game, p1);

    expect(p1.resources.publicity).toBe(publicityBefore - 6);
    expect(p1.techs).toContain(ETechId.COMPUTER_VP_CREDIT);
    expect(p1.score).toBe(scoreBefore + 2); // FIRST_TAKE_VP_BONUS = 2
    expect(p1.resources.energy).toBe(energyBefore + 1); // tile bonus = ENERGY
    expect(game.solarSystem!.rotationCounter).toBe(rotBefore + 1);
  });

  // ── 20. Post-tech state checks ──────────────────────────────────────
  it('20. publicity = 0, disc rotated, +2 VP from first-take', () => {
    expect(p1.resources.publicity).toBe(0);
    expect(p1.techs).toContain(ETechId.COMPUTER_VP_CREDIT);

    const col0 = p1.computer.getColumnState(0);
    expect(col0.techId).toBe(ETechId.COMPUTER_VP_CREDIT);
    expect(col0.hasBottomSlot).toBe(true);
    expect(col0.bottomReward).toEqual({ credits: 1 });
  });

  // ── 21. Place data on first top slot and tech bottom slot ───────────
  it('21. p1 places 2 data → +2 VP (top), +1 credit (bottom)', () => {
    // Ensure data is in pool (flush stash from landing bonus)
    p1.data.flushStashToPool();
    // Grant additional data so the player has at least 2 in pool
    if (p1.dataPool.count < 2) {
      const needed = 2 - p1.dataPool.count;
      p1.resources.gain({ data: needed });
      p1.data.flushStashToPool();
    }

    const scoreBefore = p1.score;
    const creditsBefore = p1.resources.credits;

    // First placement via free action: top of column 0 → { vp: 2 }
    game.processFreeAction('p1', { type: EFreeAction.PLACE_DATA, slotIndex: 0 });
    expect(p1.score).toBe(scoreBefore + 2);

    // Second placement: bottom of column 0 (tech slot)
    // PlaceDataFreeAction fills top rows left-to-right first.
    // To target the bottom slot directly, use the Data API.
    const bottomReward = p1.data.placeFromPoolToComputer({
      row: EComputerRow.BOTTOM,
      index: 0,
    });
    if (bottomReward?.credits) {
      p1.resources.gain({ credits: bottomReward.credits });
    }
    expect(p1.resources.credits).toBe(creditsBefore + 1);

    const col0 = p1.computer.getColumnState(0);
    expect(col0.topFilled).toBe(true);
    expect(col0.bottomFilled).toBe(true);
  });
});
