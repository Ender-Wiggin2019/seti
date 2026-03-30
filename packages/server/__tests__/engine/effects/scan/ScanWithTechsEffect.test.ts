import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import type { IScanWithTechsResult } from '@/engine/effects/scan/ScanWithTechsEffect.js';
import { ScanWithTechsEffect } from '@/engine/effects/scan/ScanWithTechsEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createMockGame(): IGame {
  const sectors = [
    new Sector({ id: 'sector-0', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-1', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-2', color: ESector.BLUE, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-3', color: ESector.BLACK, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-4', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-5', color: ESector.BLACK, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-6', color: ESector.YELLOW, dataSlotCapacity: 3 }),
    new Sector({ id: 'sector-7', color: ESector.YELLOW, dataSlotCapacity: 3 }),
  ];
  const mainDeck = new Deck<string>();

  return {
    sectors,
    mainDeck,
    cardRow: [
      { id: 'card-row-1', sector: ESector.BLUE },
      { id: 'card-row-2', sector: ESector.RED },
    ],
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

function createPlayer(overrides: { techs?: ETechId[] } = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 5, energy: 5, publicity: 6 },
    hand: [
      { id: 'hand-blue', sector: ESector.BLUE },
      { id: 'hand-red', sector: ESector.RED },
    ],
    techs: overrides.techs ?? [],
  });
}

describe('ScanWithTechsEffect', () => {
  describe('no scan techs (fallback to base ScanEffect)', () => {
    it('runs base scan without tech menu', () => {
      const game = createMockGame();
      const player = createPlayer();
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.CARD);

      input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(completedResult).not.toBeNull();
      expect(completedResult!.baseScan.earthSectorSignal).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(0);
    });
  });

  describe('earth-neighbor tech', () => {
    it('presents sector choice for earth signal', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_EARTH_LOOK] });

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 3,
      });

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);
    });

    it('marks signal in chosen adjacent sector', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_EARTH_LOOK] });
      const adjacentSector = game.sectors[2] as Sector;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 3,
      });

      expect(input).toBeDefined();

      const cardInput = input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-2',
      });

      expect(
        adjacentSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(cardInput).toBeDefined();
      expect(cardInput!.type).toBe(EPlayerInputType.CARD);
    });

    it('allows choosing earth sector itself', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_EARTH_LOOK] });
      const earthSector = game.sectors[3] as Sector;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 3,
      });

      const cardInput = input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-3',
      });

      expect(
        earthSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(cardInput).toBeDefined();
    });
  });

  describe('mercury-signal tech only', () => {
    it('offers tech activation after base scan', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_POP_SIGNAL] });

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        mercurySectorIndex: 1,
      });

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.CARD);

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(techMenu).toBeDefined();
      expect(techMenu!.type).toBe(EPlayerInputType.OPTION);
    });

    it('activates mercury signal and spends publicity', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_POP_SIGNAL] });
      const beforePublicity = player.publicity;
      const mercurySector = game.sectors[1] as Sector;
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        mercurySectorIndex: 1,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_POP_SIGNAL}`,
      });

      expect(player.publicity).toBe(beforePublicity - 1);
      expect(
        mercurySector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(1);
      expect(completedResult!.techActivations[0].activated).toBe(true);
    });

    it('allows skipping mercury signal with done', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_POP_SIGNAL] });
      const beforePublicity = player.publicity;
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        mercurySectorIndex: 1,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'done',
      });

      expect(player.publicity).toBe(beforePublicity);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(1);
      expect(completedResult!.techActivations[0].activated).toBe(false);
    });

    it('skips mercury signal when publicity is insufficient', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_POP_SIGNAL] });
      player.resources.spend({ publicity: player.publicity });
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        mercurySectorIndex: 1,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(1);
      expect(completedResult!.techActivations[0].activated).toBe(false);
    });
  });

  describe('hand-signal tech only', () => {
    it('offers hand discard after base scan', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_HAND_SIGNAL] });

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(techMenu).toBeDefined();
      expect(techMenu!.type).toBe(EPlayerInputType.OPTION);
    });

    it('activates hand signal: discard card and mark sector', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_HAND_SIGNAL] });
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      const handSelect = techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_HAND_SIGNAL}`,
      });

      expect(handSelect).toBeDefined();
      expect(handSelect!.type).toBe(EPlayerInputType.CARD);

      handSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['hand-red@1'],
      });

      expect(player.hand).toHaveLength(1);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(1);
      expect(completedResult!.techActivations[0].activated).toBe(true);
    });
  });

  describe('energy-launch tech only', () => {
    it('offers energy launch choice after base scan', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_ENERGY_LAUNCH] });

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(techMenu).toBeDefined();
      expect(techMenu!.type).toBe(EPlayerInputType.OPTION);
    });

    it('activates energy launch: gain movement', () => {
      const game = createMockGame();
      const player = createPlayer({ techs: [ETechId.SCAN_ENERGY_LAUNCH] });
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      const launchMenu = techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_ENERGY_LAUNCH}`,
      });

      expect(launchMenu).toBeDefined();
      expect(launchMenu!.type).toBe(EPlayerInputType.OPTION);

      launchMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      expect(player.getMoveStash()).toBe(1);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(1);
      expect(completedResult!.techActivations[0].activated).toBe(true);
    });
  });

  describe('multiple techs', () => {
    it('allows activating multiple techs in player-chosen order', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [ETechId.SCAN_POP_SIGNAL, ETechId.SCAN_ENERGY_LAUNCH],
      });
      const mercurySector = game.sectors[1] as Sector;
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        mercurySectorIndex: 1,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      const energyMenu = techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_ENERGY_LAUNCH}`,
      });

      const secondTechMenu = energyMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      expect(secondTechMenu).toBeDefined();
      expect(secondTechMenu!.type).toBe(EPlayerInputType.OPTION);

      secondTechMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_POP_SIGNAL}`,
      });

      expect(player.getMoveStash()).toBe(1);
      expect(
        mercurySector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(2);
      expect(completedResult!.techActivations.every((a) => a.activated)).toBe(
        true,
      );
    });

    it('allows activating some techs and skipping others', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [ETechId.SCAN_POP_SIGNAL, ETechId.SCAN_ENERGY_LAUNCH],
      });
      const beforePublicity = player.publicity;
      let completedResult: IScanWithTechsResult | null = null;

      const input = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 0,
        mercurySectorIndex: 1,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      const techMenu = input!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      const energyMenu = techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_ENERGY_LAUNCH}`,
      });

      const secondTechMenu = energyMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      secondTechMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'done',
      });

      expect(player.publicity).toBe(beforePublicity);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(2);

      const energyActivation = completedResult!.techActivations.find(
        (a) => a.effectType === 'energy-launch',
      );
      const mercuryActivation = completedResult!.techActivations.find(
        (a) => a.effectType === 'mercury-signal',
      );
      expect(energyActivation?.activated).toBe(true);
      expect(mercuryActivation?.activated).toBe(false);
    });

    it('earth-neighbor + mercury + energy: full tech chain', () => {
      const game = createMockGame();
      const player = createPlayer({
        techs: [
          ETechId.SCAN_EARTH_LOOK,
          ETechId.SCAN_POP_SIGNAL,
          ETechId.SCAN_ENERGY_LAUNCH,
        ],
      });
      const adjacentSector = game.sectors[2] as Sector;
      const mercurySector = game.sectors[4] as Sector;
      let completedResult: IScanWithTechsResult | null = null;

      const sectorChoice = ScanWithTechsEffect.execute(player, game, {
        earthSectorIndex: 3,
        mercurySectorIndex: 4,
        onComplete: (result) => {
          completedResult = result;
          return undefined;
        },
      });

      expect(sectorChoice!.type).toBe(EPlayerInputType.OPTION);

      const cardInput = sectorChoice!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-2',
      });

      expect(
        adjacentSector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      const techMenu = cardInput!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-2'],
      });

      const energyMenu = techMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_ENERGY_LAUNCH}`,
      });

      const secondMenu = energyMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      secondMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: `tech-${ETechId.SCAN_POP_SIGNAL}`,
      });

      expect(
        mercurySector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(player.getMoveStash()).toBe(1);
      expect(completedResult).not.toBeNull();
      expect(completedResult!.techActivations).toHaveLength(2);
    });
  });

  describe('markSignalWithChoice (reusable helper)', () => {
    it('marks single candidate synchronously', () => {
      const game = createMockGame();
      const player = createPlayer();
      let markResult: unknown = undefined;

      ScanWithTechsEffect.markSignalWithChoice(player, game, [2], {
        onComplete: (result) => {
          markResult = result;
          return undefined;
        },
      });

      expect(markResult).not.toBeNull();
      const sector = game.sectors[2] as Sector;
      expect(
        sector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
    });

    it('presents choice for multiple candidates', () => {
      const game = createMockGame();
      const player = createPlayer();

      const input = ScanWithTechsEffect.markSignalWithChoice(
        player,
        game,
        [0, 1, 2],
        { title: 'Pick a sector' },
      );

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);
    });

    it('marks chosen sector from multiple candidates', () => {
      const game = createMockGame();
      const player = createPlayer();
      let markResult: unknown = undefined;

      const input = ScanWithTechsEffect.markSignalWithChoice(
        player,
        game,
        [0, 1, 2],
        {
          onComplete: (result) => {
            markResult = result;
            return undefined;
          },
        },
      );

      input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'sector-1',
      });

      expect(markResult).not.toBeNull();
      const sector = game.sectors[1] as Sector;
      expect(
        sector.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
    });

    it('returns null for empty candidates', () => {
      const game = createMockGame();
      const player = createPlayer();
      let markResult: unknown = 'not-called';

      ScanWithTechsEffect.markSignalWithChoice(player, game, [], {
        onComplete: (result) => {
          markResult = result;
          return undefined;
        },
      });

      expect(markResult).toBeNull();
    });
  });
});
