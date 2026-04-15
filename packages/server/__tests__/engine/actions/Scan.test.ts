import { ESector } from '@seti/common/types/element';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectCardInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ScanAction } from '@/engine/actions/Scan.js';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import { RefillCardRowEffect } from '@/engine/effects/cardRow/RefillCardRowEffect.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
import { getSectorIndexByPlanet } from '@/engine/effects/scan/ScanEffectUtils.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createMockGame(): IGame {
  const sectors = [
    new Sector({ id: 'sector-earth', color: ESector.RED, dataSlotCapacity: 3 }),
    new Sector({
      id: 'sector-target',
      color: ESector.BLUE,
      dataSlotCapacity: 3,
    }),
  ];
  const mainDeck = new Deck(['refill-1', 'refill-2']);
  return {
    solarSystem: null,
    planetaryBoard: null,
    techBoard: null,
    sectors,
    mainDeck,
    cardRow: [
      { id: 'card-row-1', sector: ESector.BLUE },
      { id: 'card-row-2', sector: ESector.RED },
      { id: 'card-row-3', sector: ESector.YELLOW },
    ],
    endOfRoundStacks: [],
    hiddenAliens: [],
    neutralMilestones: [],
    roundRotationReminderIndex: 0,
    hasRoundFirstPassOccurred: false,
    rotationCounter: 0,
    missionTracker: { recordEvent: () => undefined },
  } as unknown as IGame;
}

const basePlayer = () =>
  new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 4, energy: 3, publicity: 4 },
  });

function createIntegrationGame(seed: string) {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  game.cardRow = [
    { id: 'card-row-1', sector: ESector.BLUE },
    { id: 'card-row-2', sector: ESector.RED },
    { id: 'card-row-3', sector: ESector.YELLOW },
  ];
  game.mainDeck = new Deck(['refill-1', 'refill-2', 'refill-3']);
  const player = game.players.find((candidate) => candidate.id === 'p1');
  if (!player) {
    throw new Error('p1 not found');
  }
  return { game, player };
}

function advanceScanToPoolAfterDiscard(game: Game, player: { id: string }) {
  game.processInput(player.id, {
    type: EPlayerInputType.OPTION,
    optionId: EScanSubAction.MARK_CARD_ROW,
  });

  const cardInput = playerWaitingFor(
    game,
    player.id,
    EPlayerInputType.CARD,
  ) as ISelectCardInputModel;
  const firstCardId = cardInput.cards[0]?.id;
  if (!firstCardId) {
    throw new Error('expected a card-row choice');
  }

  game.processInput(player.id, {
    type: EPlayerInputType.CARD,
    cardIds: [firstCardId],
  });

  let optionInput = playerWaitingFor(
    game,
    player.id,
    EPlayerInputType.OPTION,
  ) as ISelectOptionInputModel;
  if (
    !optionInput.options.some(
      (option: { id: string }) => option.id === EScanSubAction.DONE,
    )
  ) {
    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: optionInput.options[0].id,
    });
    optionInput = playerWaitingFor(
      game,
      player.id,
      EPlayerInputType.OPTION,
    ) as ISelectOptionInputModel;
  }

  return optionInput;
}

function countSignals(
  sector: Sector,
  type: 'data' | 'player',
  playerId?: string,
): number {
  return sector.signals.filter((signal) => {
    if (type === 'data') {
      return signal.type === 'data';
    }
    if (signal.type !== 'player') {
      return false;
    }
    if (playerId) {
      return signal.playerId === playerId;
    }
    return true;
  }).length;
}

function playerWaitingFor(
  game: Game,
  playerId: string,
  expectedType: EPlayerInputType,
): IPlayerInputModel {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player?.waitingFor) {
    throw new Error(`expected player ${playerId} to be waiting for input`);
  }

  const model = player.waitingFor.toModel();
  expect(model.type).toBe(expectedType);
  return model;
}

describe('ScanAction', () => {
  describe('canExecute', () => {
    it('returns true with sufficient resources', () => {
      const game = createMockGame();
      const player = basePlayer();
      expect(ScanAction.canExecute(player, game)).toBe(true);
    });

    it('returns false without credits', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 0, energy: 3, publicity: 4 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(false);
    });

    it('returns false without energy', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 4, energy: 0, publicity: 4 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(false);
    });

    it('returns false without both credits and energy', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 0, energy: 0, publicity: 4 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(false);
    });

    it('returns true with exact cost amounts (1 credit, 2 energy)', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 1, energy: 2, publicity: 0 },
      });
      expect(ScanAction.canExecute(player, game)).toBe(true);
    });
  });

  describe('execute', () => {
    it('spends credits and energy', () => {
      const game = createMockGame();
      const player = basePlayer();
      ScanAction.execute(player, game);
      expect(player.resources.credits).toBe(3);
      expect(player.resources.energy).toBe(1);
    });

    it('returns a pool menu (SelectOption)', () => {
      const game = createMockGame();
      const player = basePlayer();
      const input = ScanAction.execute(player, game);
      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);
    });

    it('Mark Earth marks sector 0 (fallback) then returns to pool', () => {
      const game = createMockGame();
      const player = basePlayer();
      const earth = game.sectors[0] as Sector;

      const poolMenu = ScanAction.execute(player, game);
      const nextMenu = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(
        earth.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
      expect(nextMenu).toBeDefined();
      expect(nextMenu!.type).toBe(EPlayerInputType.OPTION);
    });

    it('Mark Card Row → select card → mark target sector → refills on done', () => {
      const game = createMockGame();
      const player = basePlayer();
      const target = game.sectors[1] as Sector;

      const poolMenu = ScanAction.execute(player, game);

      const cardSelect = poolMenu!.process({
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      expect(cardSelect).toBeDefined();
      expect(cardSelect!.type).toBe(EPlayerInputType.CARD);

      const afterCard = cardSelect!.process({
        type: EPlayerInputType.CARD,
        cardIds: ['card-row-1'],
      });

      expect(
        target.signals.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);

      afterCard!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'done',
      });

      expect(game.cardRow.length).toBe(3);
    });

    it('throws when the action is illegal (insufficient resources)', () => {
      const game = createMockGame();
      const player = new Player({
        id: 'p1',
        name: 'Alice',
        color: 'red',
        seatIndex: 0,
        resources: { credits: 0, energy: 0, publicity: 4 },
      });
      expect(() => ScanAction.execute(player, game)).toThrow();
    });

    it('integration: refills the card row only after the scan is fully resolved', () => {
      const { game, player } = createIntegrationGame('scan-row-refill');
      const initialCardIds = game.cardRow.map((card) =>
        typeof card === 'string' ? card : card.id,
      );
      const removedCardId = initialCardIds[0];

      game.processMainAction(player.id, { type: EMainAction.SCAN });
      const returnedPool = advanceScanToPoolAfterDiscard(game, player);

      const preDoneCardIds = game.cardRow.map((card) =>
        typeof card === 'string' ? card : card.id,
      );

      expect(preDoneCardIds).toHaveLength(2);
      expect(preDoneCardIds).not.toContain(removedCardId);
      expect(preDoneCardIds).not.toContain('refill-1');
      expect(
        (returnedPool as ISelectOptionInputModel).options.some(
          (option: { id: string }) => option.id === 'done',
        ),
      ).toBe(true);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'done',
      });

      const refilledCardIds = game.cardRow.map((card) =>
        typeof card === 'string' ? card : card.id,
      );

      expect(refilledCardIds).toHaveLength(3);
      expect(refilledCardIds).not.toContain(removedCardId);
      expect(refilledCardIds).toContain('refill-1');
    });

    it('integration: mark-earth uses the real solar-system sector and grants +1 data', () => {
      const { game, player } = createIntegrationGame('scan-mark-earth');
      const earthSectorIndex = getSectorIndexByPlanet(
        game.solarSystem!,
        EPlanet.EARTH,
      );
      expect(earthSectorIndex).not.toBeNull();

      const earthSector = game.sectors[earthSectorIndex!] as Sector;
      const signalCountBefore = earthSector.signals.length;
      const dataSignalsBefore = countSignals(earthSector, 'data');
      const playerSignalsBefore = countSignals(
        earthSector,
        'player',
        player.id,
      );
      const dataBefore = player.resources.data;
      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;

      game.processMainAction(player.id, { type: EMainAction.SCAN });
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      const returnedPool = playerWaitingFor(
        game,
        player.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;
      expect(
        earthSector.signals.some(
          (signal) => signal.type === 'player' && signal.playerId === player.id,
        ),
      ).toBe(true);
      expect(earthSector.signals).toHaveLength(signalCountBefore);
      expect(countSignals(earthSector, 'data')).toBe(dataSignalsBefore - 1);
      expect(countSignals(earthSector, 'player', player.id)).toBe(
        playerSignalsBefore + 1,
      );
      expect(player.resources.data).toBe(dataBefore + 1);
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(energyBefore - 2);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId:
          returnedPool.options.find(
            (option: { id: string }) => option.id === EScanSubAction.DONE,
          )?.id ?? EScanSubAction.DONE,
      });

      expect(player.waitingFor).toBeUndefined();
      expect(game.activePlayer.id).toBe('p2');
    });
  });

  describe('MarkSectorSignalEffect (atomic)', () => {
    it('marks signal by index', () => {
      const game = createMockGame();
      const player = basePlayer();
      const result = MarkSectorSignalEffect.markByIndex(player, game, 0);
      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-earth');
    });

    it('marks signal by color', () => {
      const game = createMockGame();
      const player = basePlayer();
      let result: { sectorId: string } | null = null;
      MarkSectorSignalEffect.markByColor(player, game, ESector.BLUE, (r) => {
        result = r;
        return undefined;
      });
      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-target');
    });

    it('returns null for invalid index', () => {
      const game = createMockGame();
      const player = basePlayer();
      expect(MarkSectorSignalEffect.markByIndex(player, game, 99)).toBeNull();
    });
  });

  describe('RefillCardRowEffect', () => {
    it('fills card row to target size', () => {
      const game = createMockGame();
      game.cardRow = [];
      const result = RefillCardRowEffect.execute(game, 3);
      expect(result.cardsAdded).toBe(2);
      expect(game.cardRow.length).toBe(2);
    });
  });
});
