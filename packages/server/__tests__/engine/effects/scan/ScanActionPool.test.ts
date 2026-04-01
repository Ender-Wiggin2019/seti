import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import {
  EScanSubAction,
  type IScanActionPoolResult,
  ScanActionPool,
} from '@/engine/effects/scan/ScanActionPool.js';
import type { IGame } from '@/engine/IGame.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { Player } from '@/engine/player/Player.js';

// ── Helpers ─────────────────────────────────────────────────────────────

function createMockGame(options?: {
  solarSystem?: unknown;
  cardRow?: unknown[];
}): IGame {
  const sectors = [
    new Sector({ id: 'sector-0', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-1', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-2', color: ESector.BLUE, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-3', color: ESector.BLACK, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-4', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-5', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-6', color: ESector.BLUE, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-7', color: ESector.BLACK, dataSlotCapacity: 3 }),
  ];
  const mainDeck = new Deck<string>(['refill-1', 'refill-2', 'refill-3']);

  return {
    sectors,
    mainDeck,
    cardRow: options?.cardRow ?? [
      { id: 'card-row-1', sector: ESector.BLUE },
      { id: 'card-row-2', sector: ESector.RED },
      { id: 'card-row-3', sector: ESector.YELLOW },
    ],
    solarSystem: options?.solarSystem ?? null,
    solarSystemSetup: null,
    planetaryBoard: null,
    techBoard: null,
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
    missionTracker: { recordEvent: () => undefined },
  } as unknown as IGame;
}

function createMockSolarSystem(
  planetPositions: Partial<
    Record<EPlanet, { ringIndex: number; indexInRing: number }>
  >,
) {
  return {
    getSpacesOnPlanet: (planet: EPlanet) => {
      const pos = planetPositions[planet];
      if (!pos) return [];
      return [{ ringIndex: pos.ringIndex, indexInRing: pos.indexInRing }];
    },
    placeProbe: () => ({ id: 'probe', playerId: 'p1' }),
  };
}

function createPlayer(
  overrides: {
    techs?: ETechId[];
    hand?: TCardItem[];
    resources?: { credits?: number; energy?: number; publicity?: number };
  } = {},
): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: {
      credits: 5,
      energy: 5,
      publicity: 6,
      ...(overrides.resources ?? {}),
    },
    hand: overrides.hand ?? [
      { id: 'hand-blue', sector: ESector.BLUE },
      { id: 'hand-red', sector: ESector.RED },
    ],
    techs: overrides.techs ?? [],
  });
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('ScanActionPool', () => {
  describe('no techs (base scan)', () => {
    it('presents pool with Mark Earth and Mark Card Row', () => {
      const game = createMockGame();
      const player = createPlayer();

      const input = ScanActionPool.execute(player, game);

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);

      const model = input!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).toContain(EScanSubAction.MARK_EARTH);
      expect(optionIds).toContain(EScanSubAction.MARK_CARD_ROW);
      expect(optionIds).toContain(EScanSubAction.DONE);
      expect(optionIds).not.toContain(EScanSubAction.MARK_MERCURY);
      expect(optionIds).not.toContain(EScanSubAction.MARK_HAND);
      expect(optionIds).not.toContain(EScanSubAction.ENERGY_LAUNCH_OR_MOVE);
    });

    it('Mark Earth auto-marks sector 0 (fallback without solar system)', () => {
      const game = createMockGame();
      const player = createPlayer();
      const earthSector = game.sectors[0] as Sector;

      const poolMenu = ScanActionPool.execute(player, game);
      const nextMenu = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(
        earthSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(nextMenu).toBeDefined();
      expect(nextMenu!.type).toBe(EPlayerInputType.OPTION);
    });

    it('Mark Earth uses markByPlanet when solar system is present', () => {
      const solarSystem = createMockSolarSystem({
        [EPlanet.EARTH]: { ringIndex: 1, indexInRing: 3 },
      });
      const game = createMockGame({ solarSystem });
      const player = createPlayer();

      const poolMenu = ScanActionPool.execute(player, game);
      poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      const earthSector = game.sectors[3] as Sector;
      expect(
        earthSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
    });

    it('Mark Card Row → select card → pick sector → mark target sector', () => {
      const game = createMockGame();
      const player = createPlayer();

      const poolMenu = ScanActionPool.execute(player, game);
      const cardSelect = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });

      expect(cardSelect).toBeDefined();
      expect(cardSelect!.type).toBe(EPlayerInputType.CARD);

      // card-row-1 is BLUE — there are 2 blue sectors, so markByColor presents a choice
      const sectorChoice = cardSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(sectorChoice).toBeDefined();
      expect(sectorChoice!.type).toBe(EPlayerInputType.OPTION);

      const afterSectorPick = sectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-2',
      });

      const blueSector = game.sectors[2] as Sector;
      expect(
        blueSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(game.cardRow).toHaveLength(2);

      expect(afterSectorPick).toBeDefined();
      expect(afterSectorPick!.type).toBe(EPlayerInputType.OPTION);
    });

    it('Done ends scan immediately', () => {
      const game = createMockGame();
      const player = createPlayer();
      let completedResult: IScanActionPoolResult | null = null;

      const poolMenu = ScanActionPool.execute(player, game, {
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.DONE,
      });

      expect(completedResult).not.toBeNull();
      expect(completedResult!.subActions).toHaveLength(2);
      expect(completedResult!.subActions.every((a) => !a.executed)).toBe(true);
    });

    it('completes when all sub-actions are executed', () => {
      const game = createMockGame();
      const player = createPlayer();
      let completedResult: IScanActionPoolResult | null = null;

      const poolMenu = ScanActionPool.execute(player, game, {
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const afterEarth = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      const cardSelect = afterEarth!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });

      // card-row-1 is BLUE — 2 blue sectors, needs sector choice
      const sectorChoice = cardSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      sectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-2',
      });

      expect(completedResult).not.toBeNull();
      expect(completedResult!.subActions).toHaveLength(2);
      expect(completedResult!.subActions.every((a) => a.executed)).toBe(true);
    });
  });

  describe('free-order execution', () => {
    it('allows executing Card Row before Earth', () => {
      const game = createMockGame();
      const player = createPlayer();

      const poolMenu = ScanActionPool.execute(player, game);

      const cardSelect = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });

      expect(cardSelect).toBeDefined();
      expect(cardSelect!.type).toBe(EPlayerInputType.CARD);

      // card-row-2 is RED — 2 red sectors, needs sector choice
      const sectorChoice = cardSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-2'],
      });

      expect(sectorChoice).toBeDefined();
      expect(sectorChoice!.type).toBe(EPlayerInputType.OPTION);

      const afterSectorPick = sectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-0',
      });

      const redSector = game.sectors[0] as Sector;
      expect(
        redSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      expect(afterSectorPick).toBeDefined();
      const model = afterSectorPick!.toModel();
      const remainingIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(remainingIds).toContain(EScanSubAction.MARK_EARTH);
      expect(remainingIds).not.toContain(EScanSubAction.MARK_CARD_ROW);
    });
  });

  describe('earth-neighbor tech', () => {
    it('presents sector choice (earth + adjacent) for Mark Earth', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_EARTH_LOOK] });

      const poolMenu = ScanActionPool.execute(player, game);

      const model = poolMenu!.toModel();
      const markEarthOption = (
        model as { options: { id: string; label: string }[] }
      ).options.find((o) => o.id === EScanSubAction.MARK_EARTH);
      expect(markEarthOption?.label).toContain('Adjacent');

      const sectorChoice = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(sectorChoice).toBeDefined();
      expect(sectorChoice!.type).toBe(EPlayerInputType.OPTION);
    });

    it('marks chosen adjacent sector', () => {
      const solarSystem = createMockSolarSystem({
        [EPlanet.EARTH]: { ringIndex: 1, indexInRing: 3 },
      });
      const game = createMockGame({ solarSystem });
      const player = createPlayer({ techs: [ETechId.SCAN_EARTH_LOOK] });

      const poolMenu = ScanActionPool.execute(player, game);
      const sectorChoice = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      const afterChoice = sectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-2',
      });

      const adjacentSector = game.sectors[2] as Sector;
      expect(
        adjacentSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      expect(afterChoice).toBeDefined();
      expect(afterChoice!.type).toBe(EPlayerInputType.OPTION);
    });
  });

  describe('mercury tech', () => {
    it('shows Mark Mercury when player has tech', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_POP_SIGNAL] });

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).toContain(EScanSubAction.MARK_MERCURY);
    });

    it('Mark Mercury spends publicity and marks sector', () => {
      const solarSystem = createMockSolarSystem({
        [EPlanet.MERCURY]: { ringIndex: 1, indexInRing: 7 },
      });
      const game = createMockGame({ solarSystem });
      const player = createPlayer({ techs: [ETechId.SCAN_POP_SIGNAL] });
      const beforePublicity = player.publicity;

      const poolMenu = ScanActionPool.execute(player, game);
      poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_MERCURY,
      });

      expect(player.publicity).toBe(beforePublicity - 1);
      const mercurySector = game.sectors[7] as Sector;
      expect(
        mercurySector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
    });

    it('hides Mark Mercury when publicity is insufficient', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [ETechId.SCAN_POP_SIGNAL],
        resources: { publicity: 0 },
      });

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).not.toContain(EScanSubAction.MARK_MERCURY);
    });
  });

  describe('hand-signal tech', () => {
    it('shows Mark Hand when player has tech and cards in hand', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_HAND_SIGNAL] });

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).toContain(EScanSubAction.MARK_HAND);
    });

    it('Mark Hand → select hand card → mark sector', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_HAND_SIGNAL] });
      const initialHandSize = player.hand.length;

      const poolMenu = ScanActionPool.execute(player, game);
      const handSelect = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_HAND,
      });

      expect(handSelect).toBeDefined();
      expect(handSelect!.type).toBe(EPlayerInputType.CARD);

      handSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['hand-red@1'],
      });

      expect(player.hand).toHaveLength(initialHandSize - 1);
    });

    it('hides Mark Hand when hand is empty', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [ETechId.SCAN_HAND_SIGNAL],
        hand: [],
      });

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).not.toContain(EScanSubAction.MARK_HAND);
    });
  });

  describe('energy-launch tech', () => {
    it('shows Energy Launch/Move when player has tech', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_ENERGY_LAUNCH] });

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).toContain(EScanSubAction.ENERGY_LAUNCH_OR_MOVE);
    });

    it('Energy Launch/Move → choose movement → returns to pool', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_ENERGY_LAUNCH] });

      const poolMenu = ScanActionPool.execute(player, game);
      const launchChoice = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });

      expect(launchChoice).toBeDefined();
      expect(launchChoice!.type).toBe(EPlayerInputType.OPTION);

      const afterMove = launchChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      expect(player.getMoveStash()).toBe(1);
      expect(afterMove).toBeDefined();
      expect(afterMove!.type).toBe(EPlayerInputType.OPTION);

      const remainingModel = afterMove!.toModel();
      const remainingIds = (
        remainingModel as { options: { id: string }[] }
      ).options.map((o) => o.id);
      expect(remainingIds).not.toContain(EScanSubAction.ENERGY_LAUNCH_OR_MOVE);
    });
  });

  describe('full tech chain (all techs)', () => {
    it('presents all sub-actions', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [
          ETechId.SCAN_EARTH_LOOK,
          ETechId.SCAN_POP_SIGNAL,
          ETechId.SCAN_HAND_SIGNAL,
          ETechId.SCAN_ENERGY_LAUNCH,
        ],
      });

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );

      expect(optionIds).toContain(EScanSubAction.MARK_EARTH);
      expect(optionIds).toContain(EScanSubAction.MARK_CARD_ROW);
      expect(optionIds).toContain(EScanSubAction.MARK_MERCURY);
      expect(optionIds).toContain(EScanSubAction.MARK_HAND);
      expect(optionIds).toContain(EScanSubAction.ENERGY_LAUNCH_OR_MOVE);
      expect(optionIds).toContain(EScanSubAction.DONE);
    });

    it('allows executing in arbitrary order: mercury → energy → earth → card → hand', () => {
      const solarSystem = createMockSolarSystem({
        [EPlanet.EARTH]: { ringIndex: 1, indexInRing: 3 },
        [EPlanet.MERCURY]: { ringIndex: 1, indexInRing: 7 },
      });
      const game = createMockGame({ solarSystem });
      const player = createPlayer({
        techs: [
          ETechId.SCAN_EARTH_LOOK,
          ETechId.SCAN_POP_SIGNAL,
          ETechId.SCAN_HAND_SIGNAL,
          ETechId.SCAN_ENERGY_LAUNCH,
        ],
      });
      let completedResult: IScanActionPoolResult | null = null;

      const pool1 = ScanActionPool.execute(player, game, {
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      // 1. Mercury
      const pool2 = pool1!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_MERCURY,
      });
      const mercurySector = game.sectors[7] as Sector;
      expect(
        mercurySector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      // 2. Energy → move
      const energyChoice = pool2!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });
      const pool3 = energyChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });
      expect(player.getMoveStash()).toBe(1);

      // 3. Earth (with neighbor tech) → choose adjacent
      const earthChoice = pool3!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      const pool4 = earthChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-2',
      });
      const adjacentSector = game.sectors[2] as Sector;
      expect(
        adjacentSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      // 4. Card Row
      const cardSelect = pool4!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      // card-row-1 is BLUE — 2 blue sectors, needs choice
      const sectorChoice = cardSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });
      const pool5 = sectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-6',
      });
      const blueSector = game.sectors[6] as Sector;
      expect(
        blueSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      // 5. Hand — discard RED card, 2 red sectors → needs sector choice
      const handSelect = pool5!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_HAND,
      });
      const handSectorChoice = handSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['hand-red@1'],
      });
      handSectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-0',
      });

      expect(completedResult).not.toBeNull();
      expect(completedResult!.subActions).toHaveLength(5);
      expect(completedResult!.subActions.every((a) => a.executed)).toBe(true);
    });

    it('allows partial execution then done', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [ETechId.SCAN_POP_SIGNAL, ETechId.SCAN_ENERGY_LAUNCH],
      });
      let completedResult: IScanActionPoolResult | null = null;

      const pool1 = ScanActionPool.execute(player, game, {
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      // Execute only Mark Earth
      const pool2 = pool1!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      // Then done
      pool2!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.DONE,
      });

      expect(completedResult).not.toBeNull();
      const executed = completedResult!.subActions.filter((a) => a.executed);
      const skipped = completedResult!.subActions.filter((a) => !a.executed);
      expect(executed).toHaveLength(1);
      expect(executed[0].id).toBe(EScanSubAction.MARK_EARTH);
      expect(skipped.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('empty card row hides Mark Card Row', () => {
      const game = createMockGame({ cardRow: [] });
      const player = createPlayer();

      const poolMenu = ScanActionPool.execute(player, game);
      const model = poolMenu!.toModel();
      const optionIds = (model as { options: { id: string }[] }).options.map(
        (o) => o.id,
      );
      expect(optionIds).not.toContain(EScanSubAction.MARK_CARD_ROW);
    });

    it('auto-completes when no sub-actions are affordable', () => {
      const game = createMockGame({ cardRow: [] });
      const player = createPlayer({
        techs: [ETechId.SCAN_POP_SIGNAL],
        resources: { publicity: 0 },
        hand: [],
      });

      let completedResult: IScanActionPoolResult | null = null;

      const poolMenu = ScanActionPool.execute(player, game, {
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      // Only Mark Earth should be available
      expect(poolMenu).toBeDefined();

      // Execute Mark Earth → pool should check remaining (card row=hidden, mercury=can't afford)
      poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(completedResult).not.toBeNull();
    });
  });
});
