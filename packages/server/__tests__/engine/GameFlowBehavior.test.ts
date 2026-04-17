import { EResource, ESector, ETech, ETrace } from '@seti/common/types/element';
import {
  EFreeAction,
  EMainAction,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectCardInputModel,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { LaunchProbeAction } from '@/engine/actions/LaunchProbe.js';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import { ScanAction } from '@/engine/actions/Scan.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { loadAllCardData } from '@/engine/cards/loadCardData.js';
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import { getSectorIndexByPlanet } from '@/engine/effects/scan/ScanEffectUtils.js';
import { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

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

  cell2.elements = [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }];
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
// Then passes, round-end income is applied, and round 2 features a scan.
// ─────────────────────────────────────────────────────────────────────────
describe('Game Flow: Play Card → Launch → Move → Venus → Pass → Scan', () => {
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

  // ── 3. Check initial GameSetup state ─────────────────────────────────
  it('3. GameSetup dealt 5 cards, auto-tucked 1 → 4 in hand, base resources', () => {
    expect(p1.hand).toHaveLength(4);
    expect(p1.tuckedIncomeCards).toHaveLength(1);
    expect(p1.resources.credits).toBe(4);
    expect(p1.resources.energy).toBe(3);
    expect(p1.resources.publicity).toBe(4);
    expect(p1.resources.data).toBe(0);
  });

  // ── 3b. Card row has 3 cards, end-of-round stacks have 3 each ───────
  it('3b. card row has 3 cards, end-of-round stacks have playerCount+1 cards each', () => {
    expect(game.cardRow).toHaveLength(3);
    for (const stack of game.endOfRoundStacks) {
      expect(stack).toHaveLength(TEST_PLAYERS.length + 1);
    }
  });

  // ── 4. Mock hand to 5 specific cards (undo auto-tuck) ───────────────
  it('4. mock hand to 5 specific cards, clear auto-tuck for deterministic testing', () => {
    p1.hand = ['8', '80', '16', '130', '110'];
    p1.tuckedIncomeCards = [];

    expect(p1.hand).toHaveLength(5);
    expect(p1.tuckedIncomeCards).toHaveLength(0);
    expect(p1.income.computeRoundPayout()[EResource.ENERGY]).toBe(0);
  });

  // ── 5. Tuck card '8' via TuckCardForIncomeEffect ────────────────────
  it('5. tuck card 8 via engine → energy income +1, immediate +1 energy', () => {
    const energyBefore = p1.resources.energy;

    const tuckInput = TuckCardForIncomeEffect.execute(p1, game);
    expect(tuckInput).toBeDefined();

    const tuckModel = tuckInput!.toModel() as ISelectCardInputModel;
    expect(tuckModel.type).toBe(EPlayerInputType.CARD);
    expect(tuckModel.cards).toHaveLength(5);

    p1.waitingFor = tuckInput!;
    game.processInput('p1', {
      type: EPlayerInputType.CARD,
      cardIds: ['8'],
    });

    expect(p1.tuckedIncomeCards).toContain('8');
    expect(p1.hand).toHaveLength(4);
    expect(p1.hand).not.toContain('8');
    expect(p1.income.computeRoundPayout()[EResource.ENERGY]).toBe(1);
    expect(p1.resources.energy).toBe(energyBefore + 1);
  });

  // ── 5b. Verify post-tuck initial state and grant 1 extra energy ─────
  // The rule fix (one branch per trigger event) means the probe-launch
  // mission now yields only 1 move instead of 2.  We compensate with
  // +1 energy so the Asteroid→Venus path stays viable.
  it('5b. post-tuck: hand = [80,16,130,110], credits 4, energy 5, publicity 4', () => {
    p1.resources.gain({ energy: 1 });

    expect(p1.hand).toEqual(['80', '16', '130', '110']);
    expect(p1.resources.credits).toBe(4);
    expect(p1.resources.energy).toBe(5);
    expect(p1.resources.publicity).toBe(4);
    expect(p1.resources.data).toBe(0);
    expect(p1.score).toBe(1);
  });

  // ── 6. Available actions check ──────────────────────────────────────
  it('6. p1 can launch, scan, play card, pass — cannot orbit/land', () => {
    expect(LaunchProbeAction.canExecute(p1, game)).toBe(true);
    expect(ScanAction.canExecute(p1, game)).toBe(true);
    expect(PlayCardAction.canExecute(p1, game)).toBe(true);

    expect(p1.canLand(EPlanet.VENUS)).toBe(false);
    expect(p1.probesInSpace).toBe(0);
  });

  // ── 7. Play card '80' (Cape Canaveral SFS) ──────────────────────────
  it('7. p1 plays card 80 — spends 1 credit, registers 3-branch LAUNCH mission', () => {
    const creditsBefore = p1.resources.credits;

    game.processMainAction('p1', {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    resolveAllInputs(game, p1);

    expect(p1.resources.credits).toBe(creditsBefore - 1);
    expect(p1.hand).not.toContain('80');
    expect(p1.playedMissions.length).toBeGreaterThanOrEqual(1);

    const missionState = game.missionTracker.getMissionState('p1', '80');
    expect(missionState).toBeDefined();
    expect(missionState!.def.branches).toHaveLength(3);
    expect(missionState!.branchStates.every((s) => !s.completed)).toBe(true);

    game.processEndTurn('p1');
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

  // ── 9. p1 launches probe, completes 1 mission branch ───────────────
  // Per rules: one event can trigger multiple branches, but only one
  // space may be covered per trigger. A second launch is needed later.
  it('9. p1 launches probe — spends 2 credits, probe on Earth, 1 branch completed', () => {
    const creditsBefore = p1.resources.credits;

    game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });

    expect(p1.waitingFor).toBeDefined();
    const model = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(model.type).toBe(EPlayerInputType.OPTION);

    const branch0 = model.options.find((o) => o.id === 'complete-80-0');
    expect(branch0).toBeDefined();

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: 'complete-80-0',
    });

    resolveAllInputs(game, p1);

    expect(p1.resources.credits).toBe(creditsBefore - 2);
    expect(p1.probesInSpace).toBe(1);

    const earthSpaces = game.solarSystem!.getSpacesOnPlanet(EPlanet.EARTH);
    const probesOnEarth = earthSpaces[0].occupants.filter(
      (probe) => probe.playerId === 'p1',
    );
    expect(probesOnEarth).toHaveLength(1);

    game.processEndTurn('p1');
  });

  it('9b. branch 0 completed — p1 has 1 movement point', () => {
    const missionState = game.missionTracker.getMissionState('p1', '80');
    expect(missionState).toBeDefined();
    expect(missionState!.branchStates[0].completed).toBe(true);
    expect(missionState!.branchStates[1].completed).toBe(false);
    expect(missionState!.branchStates[2].completed).toBe(false);

    expect(p1.getMoveStash()).toBe(1);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  // ── 10. Move probe from Earth to asteroid (counterclockwise) ────────
  it('10. p1 moves probe Earth→Asteroid — costs 1 movement point', () => {
    const moveBefore = p1.getMoveStash();

    game.processFreeAction('p1', {
      type: EFreeAction.MOVEMENT,
      path: ['ring-1-cell-4', 'ring-1-cell-3'],
    });

    expect(p1.getMoveStash()).toBe(moveBefore - 1);

    const cell3 = game.solarSystem!.spaces.find(
      (s) => s.id === 'ring-1-cell-3',
    )!;
    expect(cell3.occupants.some((probe) => probe.playerId === 'p1')).toBe(true);
  });

  // ── 11. Convert energy → movement, then move Asteroid → Venus ───────
  it('11a. p1 converts 2 energy → 2 movement (0 remaining from step 10 + 2 new = 2)', () => {
    const energyBefore = p1.resources.energy;

    game.processFreeAction('p1', {
      type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
      amount: 2,
    });

    expect(p1.resources.energy).toBe(energyBefore - 2);
    expect(p1.getMoveStash()).toBe(2);
  });

  it('11b. p1 moves probe Asteroid→Venus — costs 2 (1 base + 1 asteroid leave)', () => {
    const moveBefore = p1.getMoveStash();
    const publicityBefore = p1.resources.publicity;

    game.processFreeAction('p1', {
      type: EFreeAction.MOVEMENT,
      path: ['ring-1-cell-3', 'ring-1-cell-2'],
    });

    expect(p1.getMoveStash()).toBe(moveBefore - 2);
    expect(p1.resources.publicity).toBe(publicityBefore + 1);
  });

  // ── 12. Probe at Venus verification ─────────────────────────────────
  it('12. probe is now at Venus (ring-1-cell-2)', () => {
    const venusCell = game.solarSystem!.spaces.find(
      (s) => s.id === 'ring-1-cell-2',
    )!;
    expect(venusCell.occupants.some((probe) => probe.playerId === 'p1')).toBe(
      true,
    );

    expect(p1.resources.credits).toBe(1);
    expect(p1.resources.energy).toBe(3);
    expect(p1.resources.publicity).toBe(5);
    expect(p1.getMoveStash()).toBe(0);
    expect(p1.probesInSpace).toBe(1);
    // energy breakdown: 5 start − 2 converted = 3
  });

  // ── 13. Action list check (after move to Venus) ─────────────────────
  it('13. no launch; can land on Venus (enough energy); scan and play card allowed', () => {
    expect(LaunchProbeAction.canExecute(p1, game)).toBe(false);
    expect(p1.canLand(EPlanet.VENUS)).toBe(true);

    expect(ScanAction.canExecute(p1, game)).toBe(true);
    expect(PlayCardAction.canExecute(p1, game)).toBe(true);
  });

  // ── 14. Play card '16' (Dragonfly) → land on Venus ─────────────────
  it('14. p1 plays card 16 → Dragonfly triggers landing on Venus', () => {
    const creditsBefore = p1.resources.credits;
    const energyBefore = p1.resources.energy;
    const scoreBefore = p1.score;
    const cardIndex = p1.hand.indexOf('16');

    game.processMainAction('p1', {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex },
    });

    expect(p1.waitingFor).toBeDefined();
    const landModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(landModel.type).toBe(EPlayerInputType.OPTION);

    const venusOption = landModel.options.find(
      (o) => o.id === `land-${EPlanet.VENUS}`,
    );
    expect(venusOption).toBeDefined();

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: `land-${EPlanet.VENUS}`,
    });

    expect(p1.resources.credits).toBe(creditsBefore - 1);
    expect(p1.resources.energy).toBe(energyBefore - 3);
    expect(p1.score).toBe(scoreBefore + 3);
    expect(p1.hand).not.toContain('16');
  });

  // ── 15. Trace placement (yellow on left alien discovery) ────────────
  it('15. place yellow trace on alien 0 discovery → +5 VP, +1 publicity', () => {
    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;

    expect(p1.waitingFor).toBeDefined();
    const traceModel = p1.waitingFor!.toModel();
    expect(traceModel.type).toBe(EPlayerInputType.TRACE);

    game.processInput('p1', {
      type: EPlayerInputType.TRACE,
      trace: ETrace.YELLOW,
    });

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

    game.processEndTurn('p1');
  });

  // ── 16. Game state after landing ────────────────────────────────────
  it('16. Venus landing slot occupied, no probes in solar system', () => {
    const venusState = game.planetaryBoard!.planets.get(EPlanet.VENUS)!;
    expect(venusState.landingSlots.some((s) => s.playerId === 'p1')).toBe(true);

    const venusCell = game.solarSystem!.spaces.find(
      (s) => s.id === 'ring-1-cell-2',
    )!;
    expect(venusCell.occupants.filter((o) => o.playerId === 'p1')).toHaveLength(
      0,
    );

    expect(p1.probesInSpace).toBe(0);
  });

  // ── 17. Player state after landing + trace ──────────────────────────
  it('17. resources: 0 credits, 0 energy, 6 publicity, data ≥ 1', () => {
    expect(p1.resources.credits).toBe(0);
    expect(p1.resources.energy).toBe(0);
    expect(p1.resources.publicity).toBe(6);
    expect(p1.resources.data).toBeGreaterThanOrEqual(1);
  });

  // ── 18. p2 already passed — p1 gets next turn ──────────────────────
  it('18. p1 active on next turn', () => {
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  // ── 19. Use card corner '110' for +1 data ──────────────────────────
  it('19. p1 uses card 110 corner → +1 data', () => {
    const dataBefore = p1.resources.data;

    game.processFreeAction('p1', {
      type: EFreeAction.USE_CARD_CORNER,
      cardId: '110',
    });

    expect(p1.resources.data).toBe(dataBefore + 1);
    expect(p1.hand).not.toContain('110');
  });

  // ── 20. Research tech — select comp-0, place on column 0 ───────────
  it('20. p1 researches tech → spends 6 publicity, comp-0 acquired', () => {
    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;
    const energyBefore = p1.resources.energy;
    const rotBefore = game.solarSystem!.rotationCounter;

    game.processMainAction('p1', { type: EMainAction.RESEARCH_TECH });

    expect(p1.waitingFor).toBeDefined();
    const techModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(techModel.type).toBe(EPlayerInputType.OPTION);

    const comp0Option = techModel.options.find(
      (o) => o.id === ETechId.COMPUTER_VP_CREDIT,
    );
    expect(comp0Option).toBeDefined();

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: ETechId.COMPUTER_VP_CREDIT,
    });

    if (p1.waitingFor) {
      const colModel = p1.waitingFor.toModel() as ISelectOptionInputModel;
      if (colModel.type === EPlayerInputType.OPTION) {
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
    expect(p1.score).toBe(scoreBefore + 2);
    expect(p1.resources.energy).toBe(energyBefore + 1);
    expect(game.solarSystem!.rotationCounter).toBe(rotBefore + 1);

    game.processEndTurn('p1');
  });

  // ── 21. Post-tech state checks ──────────────────────────────────────
  it('21. publicity = 0, disc rotated, +2 VP from first-take', () => {
    expect(p1.resources.publicity).toBe(0);
    expect(p1.techs).toContain(ETechId.COMPUTER_VP_CREDIT);

    const col0 = p1.computer.getColumnState(0);
    expect(col0.techId).toBe(ETechId.COMPUTER_VP_CREDIT);
    expect(col0.hasBottomSlot).toBe(true);
    expect(col0.bottomReward).toEqual({ credits: 1 });
  });

  // ── 22. Place data on computer via PLACE_DATA free action ───────────
  it('22. p1 places 2 data → +2 VP (tech-col top), +1 publicity (col-1 top)', () => {
    expect(p1.dataPool.count).toBeGreaterThanOrEqual(2);

    const scoreBefore = p1.score;
    const publicityBefore = p1.resources.publicity;

    game.processFreeAction('p1', {
      type: EFreeAction.PLACE_DATA,
      slotIndex: 0,
    });
    expect(p1.score).toBe(scoreBefore + 2);

    game.processFreeAction('p1', {
      type: EFreeAction.PLACE_DATA,
      slotIndex: 1,
    });
    expect(p1.resources.publicity).toBe(publicityBefore + 1);

    const col0 = p1.computer.getColumnState(0);
    expect(col0.topFilled).toBe(true);

    const col1 = p1.computer.getColumnState(1);
    expect(col1.topFilled).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: Pass & Round End
  // ═══════════════════════════════════════════════════════════════════════

  // ── 23. p1 passes — end-of-round card selection ─────────────────────
  let rotBeforeP1Pass: number;

  it('23. p1 passes — selects end-of-round card', () => {
    const handBefore = p1.hand.length;
    rotBeforeP1Pass = game.solarSystem!.rotationCounter;

    const stackIndex = game.roundRotationReminderIndex;
    const stackLengthBefore = game.endOfRoundStacks[stackIndex].length;

    game.processMainAction('p1', { type: EMainAction.PASS });

    // End-of-round card selection
    expect(p1.waitingFor).toBeDefined();
    const eorModel =
      p1.waitingFor!.toModel() as ISelectEndOfRoundCardInputModel;
    expect(eorModel.type).toBe(EPlayerInputType.END_OF_ROUND);
    expect(eorModel.cards.length).toBeGreaterThan(0);

    const selectedCardId = eorModel.cards[0].id;
    game.processInput('p1', {
      type: EPlayerInputType.END_OF_ROUND,
      cardId: selectedCardId,
    });

    expect(p1.hand.length).toBe(handBefore + 1);
    expect(game.endOfRoundStacks[stackIndex].length).toBe(
      stackLengthBefore - 1,
    );
  });

  it('23b. second pass of the round does not trigger another disc rotation', () => {
    expect(game.solarSystem!.rotationCounter).toBe(rotBeforeP1Pass);
  });

  // ── 24. Round end — income applied, round advances ──────────────────
  it('24. both players passed → round end, income applied', () => {
    // After both p1 and p2 passed, resolveEndOfRound fires automatically
    expect(game.round).toBe(2);
    expect(p1.passed).toBe(false);
    expect(p2.passed).toBe(false);

    // p1 should have received +1 energy from tucked card '8' income
    // (round-end income payout)
    expect(p1.resources.energy).toBeGreaterThanOrEqual(2);
  });

  // ── 25. Round 2: start player rotates to p2 ────────────────────────
  it('25. round 2: p2 is now start player and active player', () => {
    expect(game.activePlayer.id).toBe('p2');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  // ── 26. p2 passes in round 2 (first pass → disc rotation) ──────────
  it('26. p2 passes in round 2 — first pass triggers disc rotation', () => {
    const rotBefore = game.solarSystem!.rotationCounter;

    passPlayer(game, 'p2');

    expect(game.solarSystem!.rotationCounter).toBe(rotBefore + 1);
    expect(p2.passed).toBe(true);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4: Scan Action
  // ═══════════════════════════════════════════════════════════════════════

  // ── 27. Card row check & mock ───────────────────────────────────────
  let earthSectorIndex: number;
  let earthSectorId: string;
  let earthSectorColor: ESector;

  it('27. card row setup: determine Earth sector, mock card row with matching sector', () => {
    // Determine Earth's current sector position
    earthSectorIndex = getSectorIndexByPlanet(
      game.solarSystem!,
      EPlanet.EARTH,
    )!;
    expect(earthSectorIndex).not.toBeNull();

    const earthSector = game.sectors[earthSectorIndex];
    expect(earthSector).toBeDefined();
    earthSectorId = earthSector.id;
    earthSectorColor = earthSector.color;

    // Find cards matching Earth's sector color for the card row
    const allCards = loadAllCardData();
    const matchingCards = allCards.filter((c) => c.sector === earthSectorColor);
    expect(matchingCards.length).toBeGreaterThan(0);

    const otherCards = allCards.filter(
      (c) => c.sector !== earthSectorColor && c.sector !== undefined,
    );

    // Mock card row: first card matches Earth's sector, others are filler
    // Use full card objects so extractSectorColorFromCardItem can read .sector
    game.cardRow = [
      matchingCards[0],
      otherCards[0] ?? matchingCards[1],
      otherCards[1] ?? matchingCards[2],
    ] as typeof game.cardRow;

    expect(game.cardRow).toHaveLength(3);
  });

  // ── 28. p1 exchanges 2 cards → 1 credit (to afford scan) ───────────
  it('28. p1 exchanges 2 cards → 1 credit', () => {
    const creditsBefore = p1.resources.credits;
    const handBefore = p1.hand.length;
    expect(handBefore).toBeGreaterThanOrEqual(2);

    game.processFreeAction('p1', {
      type: EFreeAction.EXCHANGE_RESOURCES,
      from: EResource.CARD,
      to: EResource.CREDIT,
    });

    expect(p1.resources.credits).toBe(creditsBefore + 1);
    expect(p1.hand.length).toBe(handBefore - 2);
  });

  // ── 29. p1 scans: card row signal ───────────────────────────────────
  let scoreBeforeScan: number;

  it('29. p1 scans — choose mark-card-row, select matching card', () => {
    scoreBeforeScan = p1.score;
    const creditsBefore = p1.resources.credits;
    const energyBefore = p1.resources.energy;
    const dataBefore = p1.resources.data;

    expect(creditsBefore).toBeGreaterThanOrEqual(1);
    expect(energyBefore).toBeGreaterThanOrEqual(2);

    game.processMainAction('p1', { type: EMainAction.SCAN });

    // Scan costs: 1 credit + 2 energy
    expect(p1.resources.credits).toBe(creditsBefore - 1);
    expect(p1.resources.energy).toBe(energyBefore - 2);

    // Sub-action menu: mark-earth, mark-card-row, done
    expect(p1.waitingFor).toBeDefined();
    const menuModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(menuModel.type).toBe(EPlayerInputType.OPTION);
    expect(menuModel.options.some((o) => o.id === 'mark-earth')).toBe(true);
    expect(menuModel.options.some((o) => o.id === 'mark-card-row')).toBe(true);
    // MARK_EARTH is mandatory — DONE not offered until it's executed.
    expect(menuModel.options.some((o) => o.id === 'done')).toBe(false);

    // Choose mark-card-row
    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: 'mark-card-row',
    });

    // SelectCard: pick a card from the card row
    expect(p1.waitingFor).toBeDefined();
    const cardModel = p1.waitingFor!.toModel() as ISelectCardInputModel;
    expect(cardModel.type).toBe(EPlayerInputType.CARD);

    const matchingCardId = cardModel.cards[0].id;
    game.processInput('p1', {
      type: EPlayerInputType.CARD,
      cardIds: [matchingCardId],
    });

    // If 2 sectors share the same color → player must choose which sector
    if (p1.waitingFor) {
      const sectorChoiceModel =
        p1.waitingFor.toModel() as ISelectOptionInputModel;
      if (
        sectorChoiceModel.type === EPlayerInputType.OPTION &&
        sectorChoiceModel.options.some((o) => o.id === earthSectorId)
      ) {
        game.processInput('p1', {
          type: EPlayerInputType.OPTION,
          optionId: earthSectorId,
        });
      }
    }

    // After marking card row signal: +1 data (replaced a data token)
    expect(p1.resources.data).toBe(dataBefore + 1);
  });

  // ── 30. p1 continues scan: mark earth signal ───────────────────────
  it('30. p1 marks earth signal → same sector, +1 data', () => {
    const dataBefore = p1.resources.data;

    // Sub-action menu should show mark-earth and done (mark-card-row consumed)
    expect(p1.waitingFor).toBeDefined();
    const menuModel = p1.waitingFor!.toModel() as ISelectOptionInputModel;
    expect(menuModel.type).toBe(EPlayerInputType.OPTION);
    expect(menuModel.options.some((o) => o.id === 'mark-earth')).toBe(true);
    expect(menuModel.options.some((o) => o.id === 'mark-card-row')).toBe(false);

    game.processInput('p1', {
      type: EPlayerInputType.OPTION,
      optionId: 'mark-earth',
    });

    // Earth mark is auto-applied (no earth-neighbor tech)
    // After marking earth signal in same sector: +1 data
    expect(p1.resources.data).toBe(dataBefore + 1);

    game.processEndTurn('p1');
  });

  // ── 31. Scan results: verify 2 data and 2 VP from sector position ──
  it('31. scan complete: 2 data total, +2 VP from second signal position', () => {
    const sector = game.sectors[earthSectorIndex];
    expect(sector).toBeDefined();

    // Two player markers in the Earth sector
    expect(sector.getPlayerMarkerCount('p1')).toBe(2);

    // Player gained 2 data total from the two signal marks
    // (each mark that replaces a data token grants +1 data)
    expect(p1.resources.data).toBeGreaterThanOrEqual(2);

    // Each sector's second signal position should award 2 VP
    // (per-position sector rewards — may not be implemented yet)
    expect(p1.score).toBe(scoreBeforeScan + 2);

    // Scan has concluded — game returns to AWAIT_MAIN_ACTION
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p1');
  });
});
