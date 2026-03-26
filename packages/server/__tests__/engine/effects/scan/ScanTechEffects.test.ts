import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import {
  ScanEarthNeighborEffect,
  ScanEnergyLaunchEffect,
  ScanHandSignalEffect,
  ScanMercurySignalEffect,
} from '@/engine/effects/scan/ScanTechEffects.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createMockPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 5, energy: 3, publicity: 4 },
  });
}

function createMockGame(): IGame {
  const sectors = [
    new Sector({ id: 'sector-0', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-1', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-2', color: ESector.BLUE, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-3', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-4', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-5', color: ESector.BLUE, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-6', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-7', color: ESector.YELLOW, dataSlotCapacity: 3 }),
  ];
  const mainDeck = new Deck<string>();

  return {
    sectors,
    mainDeck,
    cardRow: [],
    solarSystem: {
      getSpacesOnPlanet: (planet: EPlanet) =>
        planet === EPlanet.EARTH ? [{ id: 'earth-space' }] : [],
      placeProbe: () => ({ id: 'probe-1', playerId: 'p1' }),
    },
    planetaryBoard: null,
    techBoard: null,
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
  } as unknown as IGame;
}

describe('Scan tech atomic effects', () => {
  it('computes adjacent sectors from earth sector', () => {
    expect(ScanEarthNeighborEffect.getAdjacentSectorIndexes(0, 8)).toEqual([
      7, 1,
    ]);
    expect(ScanEarthNeighborEffect.getAdjacentSectorIndexes(3, 8)).toEqual([
      2, 4,
    ]);
  });

  it('resolves selected adjacent sector for earth neighbor effect', () => {
    const resolved = ScanEarthNeighborEffect.resolveEarthSignalSector({
      earthSectorIndex: 3,
      selectedSectorIndex: 2,
      sectorCount: 8,
    });
    expect(resolved).toBe(2);
  });

  it('throws when earth neighbor selection is not adjacent', () => {
    expect(() =>
      ScanEarthNeighborEffect.resolveEarthSignalSector({
        earthSectorIndex: 3,
        selectedSectorIndex: 6,
        sectorCount: 8,
      }),
    ).toThrow();
  });

  it('spends publicity and marks mercury signal', () => {
    const game = createMockGame();
    const player = createMockPlayer();
    const beforePublicity = player.publicity;
    const mercurySector = game.sectors[1] as Sector;

    ScanMercurySignalEffect.execute(player, game, {
      mercurySectorIndex: 1,
    });

    expect(player.publicity).toBe(beforePublicity - 1);
    expect(
      mercurySector.markerSlots.some((m) => m.playerId === player.id),
    ).toBe(true);
  });

  it('discards hand card and marks signal by card sector color', () => {
    const game = createMockGame();
    const player = createMockPlayer();
    player.hand = [
      { id: 'hand-blue', sector: ESector.BLUE },
      { id: 'hand-red', sector: ESector.RED },
    ];

    const input = ScanHandSignalEffect.execute(player, game);
    expect(input).toBeDefined();
    expect(input!.type).toBe(EPlayerInputType.CARD);

    input!.process({
      type: EPlayerInputType.CARD,
      cardIds: ['hand-blue@0'],
    });

    expect(player.hand).toHaveLength(1);
    expect(game.mainDeck.getDiscardPile()).toEqual(['hand-blue']);
    const blueSector = game.sectors.find(
      (sector) =>
        sector instanceof Sector && (sector as Sector).color === ESector.BLUE,
    ) as Sector;
    expect(blueSector.markerSlots.some((m) => m.playerId === player.id)).toBe(
      true,
    );
  });

  it('allows choosing move in energy launch effect', () => {
    const game = createMockGame();
    const player = createMockPlayer();

    const input = ScanEnergyLaunchEffect.execute(player, game);
    expect(input.type).toBe(EPlayerInputType.OPTION);

    input.process({
      type: EPlayerInputType.OPTION,
      optionId: 'move',
    });

    expect(player.getMoveStash()).toBe(1);
  });

  it('allows paying energy to launch a probe in energy launch effect', () => {
    const game = createMockGame();
    const player = createMockPlayer();
    const beforeEnergy = player.resources.energy;

    const input = ScanEnergyLaunchEffect.execute(player, game);
    input.process({
      type: EPlayerInputType.OPTION,
      optionId: 'launch',
    });

    expect(player.resources.energy).toBe(beforeEnergy - 1);
    expect(player.probesInSpace).toBe(1);
  });
});
