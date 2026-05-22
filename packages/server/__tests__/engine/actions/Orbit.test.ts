import { PLANETARY_BOARD_CONFIG } from '@seti/common/constant/boardLayout';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { OrbitAction } from '@/engine/actions/Orbit.js';
import { Game } from '@/engine/Game.js';
import {
  resolveAllInputsDefault,
  resolveSetupTucks,
  skipSetupTucks,
} from '../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function placeProbeOnPlanet(
  game: Game,
  playerId: string,
  planet: EPlanet,
  count: number,
): void {
  const targetSpace = game.solarSystem?.getSpacesOnPlanet(planet)[0];
  if (!targetSpace || game.solarSystem === null) {
    throw new Error('Expected a planet space in solar system');
  }

  for (let index = 0; index < count; index += 1) {
    game.solarSystem.placeProbe(playerId, targetSpace.id);
  }
}

describe('Orbit action', () => {
  it('does not allow orbiting while the only probe is still on Earth', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-earth-boundary',
    );
    resolveSetupTucks(game);
    const player = game.players[0];

    game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
    game.processEndTurn(player.id);
    game.setActivePlayer(player.id);

    expect(OrbitAction.canExecute(player, game, EPlanet.EARTH)).toBe(false);
    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(false);
    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.EARTH },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('spends resources, moves probe from space, and grants first orbit bonus', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-main-action',
    );
    skipSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;
    const handBefore = player.hand.length;
    // Setup may grant a baseline VP via tuck-income / organization
    // setup; capture the post-setup baseline so the orbit-side
    // assertions express *delta*, not absolute score.
    const scoreBefore = player.score;
    const creditsBefore = player.resources.credits;
    const energyBefore = player.resources.energy;

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.MARS },
    });

    // Action cost paid (1 credit + 1 energy).
    expect(player.resources.credits).toBe(creditsBefore - 1);
    expect(player.resources.energy).toBe(energyBefore - 1);
    expect(player.probesInSpace).toBe(0);
    expect(
      game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0]?.occupants,
    ).toHaveLength(0);
    expect(game.planetaryBoard?.planets.get(EPlanet.MARS)?.orbitSlots).toEqual([
      { playerId: player.id },
    ]);
    // Mars first-orbit rewards resolve BEFORE the regular orbit
    // rewards (the +3 VP bonus is granted the moment the slot is
    // claimed, matching the printed board's "first orbiter scores
    // 3 points" rule). After that, the regular chain continues:
    // card-any prompt fires, then signal mark + tuck after
    // resolution. Score delta at this checkpoint = +3 from the
    // first-orbit bonus.
    expect(player.score - scoreBefore).toBe(3);
    expect(player.hand).toHaveLength(handBefore);
    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      title: 'Choose any card',
    });

    resolveAllInputsDefault(game, player);
    // After full resolution: card grabbed, signal marked (planet
    // sector — does not fulfil for this seed), tuck applied. The
    // +3 from first-orbit was already counted above; total delta
    // stays 3.
    expect(player.tuckedIncomeCards).toHaveLength(1);
    expect(player.score - scoreBefore).toBe(3);
  });

  it('offers the chosen Mars orbit any-card reward in the following tuck prompt', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-mars-any-card-before-tuck',
    );
    skipSetupTucks(game);
    const player = game.players[0];
    const selectedCardId = 'mars-row-choice';
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;
    game.cardRow = [selectedCardId];
    game.mainDeck.addToTop('mars-row-replacement');

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.MARS },
    });

    const optionModel = player.waitingFor?.toModel();
    expect(optionModel?.type).toBe(EPlayerInputType.OPTION);
    const rowOption =
      optionModel?.type === EPlayerInputType.OPTION
        ? optionModel.options.find((option) =>
            option.id.startsWith(`row:0:${selectedCardId}`),
          )
        : undefined;
    expect(rowOption).toBeDefined();
    if (!rowOption) throw new Error('Expected row option for Mars reward');

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: rowOption.id,
    });

    const tuckModel = player.waitingFor?.toModel();
    expect(tuckModel?.type).toBe(EPlayerInputType.CARD);
    const tuckCardIds =
      tuckModel?.type === EPlayerInputType.CARD
        ? tuckModel.cards.map((card) => card.id)
        : [];
    expect(tuckCardIds).toContain(selectedCardId);
  });

  it('only grants +3 VP for the first orbiter on a planet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-first-bonus-once',
    );
    resolveSetupTucks(game);
    const p1 = game.players[0];
    const p2 = game.players[1];
    placeProbeOnPlanet(game, p1.id, EPlanet.VENUS, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.VENUS, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    game.processMainAction(p1.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });
    resolveAllInputsDefault(game, p1);
    game.processEndTurn(p1.id);

    game.processMainAction(p2.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });
    resolveAllInputsDefault(game, p2);
    game.processEndTurn(p2.id);

    expect(p1.score).toBe(10);
    expect(p2.score).toBe(8);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.VENUS)?.orbitSlots,
    ).toHaveLength(2);
  });

  it('rejects orbit when no own probe is on selected planet', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'orbit-invalid');
    resolveSetupTucks(game);
    const player = game.players[0];

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.JUPITER },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('rejects orbit attempts from a non-active player even with a valid probe', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-not-your-turn',
    );
    resolveSetupTucks(game);
    const player = game.players[1];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(true);
    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.MARS },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.NOT_YOUR_TURN,
      }),
    );
  });

  it('2.2.3 applies configured orbit rewards per planet', () => {
    // Rewards (the data shape) is locked in by
    // `planetBoardRewards.test.ts`. Here we cover the integration:
    // ORBIT main action paid the cost, claimed the first-orbit slot,
    // and consumed the probe — for every native planet.
    //
    // Reward delta assertions intentionally cover only the
    // deterministic pieces (cost paid, first-orbit slot, planet
    // baseline rewards that aren't seed-dependent). Sector-signal
    // resolution and tuck-income are seed-dependent (which sector
    // tile sits at the planet, which card is in hand to tuck) and
    // are exercised in dedicated tests.
    const planets: EPlanet[] = [
      EPlanet.MERCURY,
      EPlanet.VENUS,
      EPlanet.MARS,
      EPlanet.JUPITER,
      EPlanet.SATURN,
      EPlanet.URANUS,
      EPlanet.NEPTUNE,
    ];
    const planetsWithTuck = new Set<EPlanet>([
      EPlanet.MERCURY,
      EPlanet.VENUS,
      EPlanet.MARS,
      EPlanet.JUPITER,
      EPlanet.SATURN,
    ]);

    for (const planet of planets) {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        `orbit-2-2-3-${planet}`,
      );
      resolveSetupTucks(game);
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, planet, 1);
      player.probesInSpace = 1;

      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;
      const tuckedCardsBefore = player.tuckedIncomeCards.length;

      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet },
      });

      // Action cost paid up-front (before any reward applies).
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(energyBefore - 1);

      // Probe consumed from the planet's space, slot claimed.
      expect(player.probesInSpace).toBe(0);
      expect(
        game.solarSystem?.getSpacesOnPlanet(planet)[0]?.occupants,
      ).toHaveLength(0);
      expect(game.planetaryBoard?.planets.get(planet)?.orbitSlots).toEqual([
        { playerId: player.id },
      ]);
      expect(game.planetaryBoard?.planets.get(planet)?.firstOrbitClaimed).toBe(
        true,
      );

      // Drain prompts so tuck (if present) actually fires before we
      // assert tucked-income cardinality.
      resolveAllInputsDefault(game, player);
      const expectedTuckCount = planetsWithTuck.has(planet)
        ? tuckedCardsBefore + 1
        : tuckedCardsBefore;
      expect(player.tuckedIncomeCards).toHaveLength(expectedTuckCount);
    }
  });

  it('2.2.4 orbit tuck reward prompts a selected hand card to become income', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-2-2-4-income-track',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.VENUS, 1);
    player.probesInSpace = 1;

    const tuckedCardsBefore = player.tuckedIncomeCards.length;
    const handBefore = player.hand.length;

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });

    expect(player.score).toBe(
      1 +
        PLANETARY_BOARD_CONFIG[EPlanet.VENUS].orbit.rewards[0].amount +
        PLANETARY_BOARD_CONFIG[EPlanet.VENUS].orbit.firstRewards[0].amount,
    );
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

    resolveAllInputsDefault(game, player);

    expect(player.tuckedIncomeCards).toHaveLength(tuckedCardsBefore + 1);
    expect(player.hand.length).toBeLessThanOrEqual(handBefore);
  });

  it('returns false when credits or energy are insufficient even with a valid planet probe', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-insufficient-resources',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    player.resources.spend({ credits: 4 });
    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(false);

    player.resources.gain({ credits: 1 });
    player.resources.spend({ energy: 3 });
    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(false);
  });

  describe('picker-driven main-action flow', () => {
    it('returns a planet picker SelectOption when no planet payload is provided', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'orbit-picker-planet-step',
      );
      skipSetupTucks(game);
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
      placeProbeOnPlanet(game, player.id, EPlanet.VENUS, 1);
      player.probesInSpace = 2;

      game.processMainAction(player.id, { type: EMainAction.ORBIT });

      const model = player.waitingFor?.toModel();
      expect(model?.type).toBe(EPlayerInputType.OPTION);
      if (model?.type !== EPlayerInputType.OPTION) {
        throw new Error('Expected OPTION input');
      }
      expect(model.title).toBe('Choose planet to orbit');
      // Both eligible planets surface as options with cost-aware labels.
      const ids = model.options.map((option) => option.id);
      expect(ids).toContain(`main-action-orbit-planet-${EPlanet.MARS}`);
      expect(ids).toContain(`main-action-orbit-planet-${EPlanet.VENUS}`);
      // Cost suffix is in the label.
      const marsOption = model.options.find(
        (option) => option.id === `main-action-orbit-planet-${EPlanet.MARS}`,
      );
      expect(marsOption?.label).toContain('1 ⚡');
      expect(marsOption?.label).toContain('1 💰');
    });

    it('chains a slot picker after a planet is selected', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'orbit-picker-slot-step',
      );
      skipSetupTucks(game);
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
      player.probesInSpace = 1;

      game.processMainAction(player.id, { type: EMainAction.ORBIT });

      // Resolve planet picker with Mars.
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: `main-action-orbit-planet-${EPlanet.MARS}`,
      });

      const slotModel = player.waitingFor?.toModel();
      expect(slotModel?.type).toBe(EPlayerInputType.OPTION);
      if (slotModel?.type !== EPlayerInputType.OPTION) {
        throw new Error('Expected OPTION input');
      }
      expect(slotModel.title).toBe('Choose orbit slot');
      const slotIds = slotModel.options.map((option) => option.id);
      // First-orbit slot still available — both options surface.
      expect(slotIds).toContain(`main-action-orbit-slot-${EPlanet.MARS}-first`);
      expect(slotIds).toContain(
        `main-action-orbit-slot-${EPlanet.MARS}-regular`,
      );
    });

    it('lets the player decline the first-orbit bonus by picking the regular slot', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'orbit-picker-decline-first',
      );
      skipSetupTucks(game);
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
      player.probesInSpace = 1;
      const scoreBefore = player.score;

      game.processMainAction(player.id, { type: EMainAction.ORBIT });
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: `main-action-orbit-planet-${EPlanet.MARS}`,
      });
      // Pick regular — opt out of the bonus.
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: `main-action-orbit-slot-${EPlanet.MARS}-regular`,
      });

      // First-orbit bonus is 3 VP per the Mars config — not granted
      // because we picked the regular slot. Mars's regular orbit
      // rewards (signal + any-card + tuck) carry through normally.
      const marsState = game.planetaryBoard?.planets.get(EPlanet.MARS);
      expect(marsState?.firstOrbitClaimed).toBe(false);
      // Score gain accounts only for non-first-orbit rewards (no +3
      // bonus here; the orbit rewards on Mars give a signal mark
      // which may grant 0–N VP depending on resolution path).
      expect(player.score - scoreBefore).toBeLessThan(3);
    });

    it('returns a LAND planet picker with the per-planet energy cost in each label', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'land-picker-planet-step',
      );
      skipSetupTucks(game);
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
      player.probesInSpace = 1;

      game.processMainAction(player.id, { type: EMainAction.LAND });

      const model = player.waitingFor?.toModel();
      expect(model?.type).toBe(EPlayerInputType.OPTION);
      if (model?.type !== EPlayerInputType.OPTION) {
        throw new Error('Expected OPTION input');
      }
      expect(model.title).toBe('Choose planet to land on');
      const marsOption = model.options.find(
        (option) => option.id === `main-action-land-planet-${EPlanet.MARS}`,
      );
      expect(marsOption?.label).toContain('Land on');
      expect(marsOption?.label).toMatch(/\d+ ⚡/);
    });

    it('rejects ORBIT picker when no planet is eligible', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'orbit-picker-no-eligible',
      );
      skipSetupTucks(game);
      const player = game.players[0];

      // No probe placed anywhere — no eligible orbit target.
      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.ORBIT }),
      ).toThrowError(
        expect.objectContaining({
          code: EErrorCode.INVALID_ACTION,
        }),
      );
    });
  });
});
