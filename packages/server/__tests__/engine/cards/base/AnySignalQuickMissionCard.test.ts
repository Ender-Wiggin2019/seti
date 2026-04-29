import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { ISelectOptionInputModel } from '@seti/common/types/protocol/playerInput';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { Sector } from '@/engine/board/Sector.js';
import { SolarSystem } from '@/engine/board/SolarSystem.js';
import {
  SOLAR_SYSTEM_CELL_CONFIGS,
  SOLAR_SYSTEM_NEAR_STAR_POOL,
} from '@/engine/board/SolarSystemConfig.js';
import { AnySignalQuickMissionCard } from '@/engine/cards/base/AnySignalQuickMissionCard.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { EventLog } from '@/engine/event/EventLog.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 3, publicity: 4, data: 0 },
  });
}

function createSolarSystem(): SolarSystem {
  const spaces = SOLAR_SYSTEM_CELL_CONFIGS.map((cell) => ({
    ...cell,
    elements: cell.elements.map((element) => ({ ...element })),
    occupants: [],
  }));
  return new SolarSystem(spaces, [...SOLAR_SYSTEM_NEAR_STAR_POOL]);
}

function createGame(sectors: Sector[], solarSystem: SolarSystem | null): IGame {
  return {
    sectors,
    solarSystem,
    mainDeck: new Deck<string>([]),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    missionTracker: { recordEvent: vi.fn() },
    eventLog: new EventLog(),
    random: new SeededRandom('any-signal-quick-mission-test'),
  } as unknown as IGame;
}

function createIndexedSectors(): Sector[] {
  return Array.from(
    { length: 8 },
    (_, index) =>
      new Sector({
        id: `sector-${index}`,
        color: ESector.RED,
        dataSlotCapacity: 5,
      }),
  );
}

function firstSpaceIdForSectorIndex(
  solarSystem: SolarSystem,
  sectorIndex: number,
): string {
  const space = solarSystem.spaces.find(
    (s) =>
      s.ringIndex > 0 &&
      Math.floor(s.indexInRing / s.ringIndex) === sectorIndex,
  );
  if (!space) {
    throw new Error(`No space found for sector index ${sectorIndex}`);
  }
  return space.id;
}

describe('AnySignalQuickMissionCard', () => {
  it('card 32 marks Mercury sector twice without extra input', () => {
    const player = createPlayer();
    const sectors = createIndexedSectors();
    const game = createGame(sectors, createSolarSystem());

    const card = getCardRegistry().create('32');
    card.play({ player, game });

    const pendingInput = game.deferredActions.drain(game);
    expect(pendingInput).toBeUndefined();
    const mercurySectorIndex = game.solarSystem?.getSectorIndexOfPlanet(
      EPlanet.MERCURY,
    );
    if (mercurySectorIndex === null || mercurySectorIndex === undefined) {
      throw new Error('Expected Mercury sector');
    }
    expect(sectors[mercurySectorIndex].getPlayerMarkerCount(player.id)).toBe(2);
  });

  it('planet-sector placement waits for the oumuamua sector/tile choice', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
      ],
      { playerCount: 2 },
      'planet-sector-oumuamua-choice',
      'planet-sector-oumuamua-choice',
    );
    resolveSetupTucks(game);
    const player = game.players[0] as Player;
    discoverOumuamua(game);

    const card = new AnySignalQuickMissionCard('32', {
      placementMode: 'planet-sector',
      targetPlanet: EPlanet.OUMUAMUA,
    });
    card.play({ player, game });

    const pendingInput = game.deferredActions.drain(game);
    const model = pendingInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );
  });

  it('card 115 asks for signal color and then sector when color is ambiguous', () => {
    const player = createPlayer();
    const redA = new Sector({ id: 'sector-red-a', color: ESector.RED });
    const redB = new Sector({ id: 'sector-red-b', color: ESector.RED });
    const yellow = new Sector({ id: 'sector-yellow', color: ESector.YELLOW });
    const game = createGame([redA, redB, yellow], null);

    const card = getCardRegistry().create('115');
    card.play({ player, game });

    const colorInput = game.deferredActions.drain(game);
    expect(colorInput?.type).toBe(EPlayerInputType.OPTION);

    const sectorInput = colorInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'any-signal-red-signal',
    });
    expect(sectorInput?.type).toBe(EPlayerInputType.OPTION);

    const finalInput = sectorInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'sector-red-b',
    });
    expect(finalInput).toBeUndefined();
    expect(redB.getPlayerMarkerCount(player.id)).toBe(1);
    expect(redA.getPlayerMarkerCount(player.id)).toBe(0);
  });

  it('card 88 marks probe sector twice when only one probe sector exists', () => {
    const player = createPlayer();
    const sectors = createIndexedSectors();
    const solarSystem = createSolarSystem();
    const probeSpaceId = firstSpaceIdForSectorIndex(solarSystem, 2);
    solarSystem.placeProbe(player.id, probeSpaceId);
    const game = createGame(sectors, solarSystem);

    const card = getCardRegistry().create('88');
    card.play({ player, game });

    const pendingInput = game.deferredActions.drain(game);
    expect(pendingInput).toBeUndefined();
    expect(sectors[2].getPlayerMarkerCount(player.id)).toBe(2);
  });

  it('card 88 signal placement resolves before same-turn quick mission checks', () => {
    const player = createPlayer();
    const sectors = createIndexedSectors();
    const solarSystem = createSolarSystem();
    solarSystem.placeProbe(
      player.id,
      firstSpaceIdForSectorIndex(solarSystem, 2),
    );
    const game = createGame(sectors, solarSystem);

    const card = getCardRegistry().create('88');
    card.play({ player, game });

    expect(game.deferredActions.peek()?.priority).toBe(EPriority.CORE_EFFECT);
  });

  it('card 88 marks both signals in the selected probe sector without prompting again', () => {
    const player = createPlayer();
    const sectors = createIndexedSectors();
    const solarSystem = createSolarSystem();

    solarSystem.placeProbe(
      player.id,
      firstSpaceIdForSectorIndex(solarSystem, 1),
    );
    solarSystem.placeProbe(
      player.id,
      firstSpaceIdForSectorIndex(solarSystem, 5),
    );

    const game = createGame(sectors, solarSystem);
    const card = getCardRegistry().create('88');
    card.play({ player, game });

    const sectorInput = game.deferredActions.drain(game);
    expect(sectorInput?.type).toBe(EPlayerInputType.OPTION);

    const done = sectorInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'probe-sector-sector-5',
    });

    expect(done).toBeUndefined();
    expect(sectors[5].getPlayerMarkerCount(player.id)).toBe(2);
    expect(sectors[1].getPlayerMarkerCount(player.id)).toBe(0);
  });

  it('card 88 quick mission completes when the player has signals in four different sectors', () => {
    const player = createPlayer();
    const card = getCardRegistry().create('88');
    const mission = card.getMissionDef?.();

    expect(mission).toBeDefined();
    expect(mission?.branches[0].checkCondition).toBeTypeOf('function');

    const game = createGame(createIndexedSectors(), createSolarSystem());
    for (const sector of game.sectors.slice(0, 4)) {
      sector.markSignal(player.id);
    }

    expect(mission?.branches[0].checkCondition?.(player, game)).toBe(true);
  });

  it('card 88 offers sector/tile choice when the only probe sector contains oumuamua', () => {
    const game = Game.create(
      [
        { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
        { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
      ],
      { playerCount: 2 },
      'card-88-oumuamua-probe-sector',
      'card-88-oumuamua-probe-sector',
    );
    resolveSetupTucks(game);
    const player = game.players[0] as Player;
    const { plugin } = discoverOumuamua(game);
    const state = plugin.getRuntimeState(game);
    if (!state?.meta) throw new Error('missing oumuamua state');
    game.solarSystem?.placeProbe(player.id, state.meta.spaceId);

    const card = getCardRegistry().create('88');
    card.play({ player, game });

    const pendingInput = game.deferredActions.drain(game);
    const model = pendingInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );
  });

  it('card 134 lets player choose between multiple probe sectors', () => {
    const player = createPlayer();
    const sectors = createIndexedSectors();
    const solarSystem = createSolarSystem();

    solarSystem.placeProbe(
      player.id,
      firstSpaceIdForSectorIndex(solarSystem, 1),
    );
    solarSystem.placeProbe(
      player.id,
      firstSpaceIdForSectorIndex(solarSystem, 5),
    );

    const game = createGame(sectors, solarSystem);
    const card = getCardRegistry().create('134');
    card.play({ player, game });

    const sectorInput = game.deferredActions.drain(game);
    expect(sectorInput?.type).toBe(EPlayerInputType.OPTION);

    const sectorModel = sectorInput?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    const sectorOptions = sectorModel?.options ?? [];
    const preferred = sectorOptions.find((option: { id: string }) =>
      option.id.includes('sector-5'),
    );
    const selectedOptionId = preferred?.id ?? sectorOptions[0]?.id;

    expect(selectedOptionId).toBeDefined();

    const finalInput = sectorInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: selectedOptionId as string,
    });

    expect(finalInput).toBeUndefined();
    expect(
      sectors.reduce(
        (sum, sector) => sum + sector.getPlayerMarkerCount(player.id),
        0,
      ),
    ).toBe(1);
  });
});
