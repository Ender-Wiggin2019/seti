import { ESector } from '@seti/common/types/element';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Sector } from '@/engine/board/Sector.js';
import { Deck } from '@/engine/deck/Deck.js';
import {
  EScanSubAction,
  ScanActionPool,
} from '@/engine/effects/scan/ScanActionPool.js';
import { processFreeAction } from '@/engine/freeActions/processFreeAction.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { GameError } from '@/shared/errors/GameError.js';

function createMockGame(): IGame {
  return {
    sectors: [
      new Sector({ id: 'sector-0', color: ESector.RED, dataSlotCapacity: 3 }),
      new Sector({
        id: 'sector-1',
        color: ESector.YELLOW,
        dataSlotCapacity: 3,
      }),
      new Sector({ id: 'sector-2', color: ESector.BLUE, dataSlotCapacity: 3 }),
      new Sector({
        id: 'sector-3',
        color: ESector.BLACK,
        dataSlotCapacity: 3,
      }),
      new Sector({ id: 'sector-4', color: ESector.RED, dataSlotCapacity: 3 }),
      new Sector({
        id: 'sector-5',
        color: ESector.YELLOW,
        dataSlotCapacity: 3,
      }),
      new Sector({ id: 'sector-6', color: ESector.BLUE, dataSlotCapacity: 3 }),
      new Sector({
        id: 'sector-7',
        color: ESector.BLACK,
        dataSlotCapacity: 3,
      }),
    ],
    cardRow: [
      { id: 'card-row-1', sector: ESector.BLUE },
      { id: 'card-row-2', sector: ESector.RED },
      { id: 'card-row-3', sector: ESector.YELLOW },
    ],
    mainDeck: new Deck<string>(['refill-1', 'refill-2', 'refill-3']),
    solarSystem: null,
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
    lockCurrentTurn: () => undefined,
  } as unknown as IGame;
}

function createPlayer(signalTokens = 1): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: {
      credits: 5,
      energy: 5,
      publicity: 4,
      signalTokens,
    },
  });
}

describe('SpendSignalToken free action', () => {
  it('spends one signal token, marks by selected card row color, and returns to the scan pool without refilling', () => {
    const game = createMockGame();
    const player = createPlayer(1);
    const scanPoolInput = ScanActionPool.execute(player, game);
    player.waitingFor = scanPoolInput;

    const cardInput = processFreeAction(player, game, {
      type: EFreeAction.SPEND_SIGNAL_TOKEN,
    });

    expect(player.resources.signalTokens).toBe(0);
    expect(cardInput).toBeDefined();
    if (!cardInput) {
      throw new Error('Expected signal token free action to request a card');
    }
    expect(cardInput.type).toBe(EPlayerInputType.CARD);

    const sectorChoice = cardInput.process({
      type: EPlayerInputType.CARD,
      cardIds: ['card-row-1'],
    });
    expect(sectorChoice).toBeDefined();
    if (!sectorChoice) {
      throw new Error('Expected selected card color to request a sector');
    }
    expect(sectorChoice.type).toBe(EPlayerInputType.OPTION);

    const returnedInput = sectorChoice.process({
      type: EPlayerInputType.OPTION,
      optionId: 'sector-2',
    });

    const blueSector = game.sectors[2] as Sector;
    expect(
      blueSector.signals.some(
        (signal) => signal.type === 'player' && signal.playerId === player.id,
      ),
    ).toBe(true);
    expect(game.mainDeck.getDiscardPile()).toEqual(['card-row-1']);
    expect(game.cardRow).toHaveLength(2);
    expect(returnedInput?.title).toBe('Scan: choose sub-action');

    const returnedModel = returnedInput?.toModel();
    if (!returnedModel || returnedModel.type !== EPlayerInputType.OPTION) {
      throw new Error('Expected refreshed scan pool after spending token');
    }
    expect(returnedModel.options.map((option) => option.id)).toContain(
      EScanSubAction.MARK_CARD_ROW,
    );
    expect(returnedInput).not.toBe(scanPoolInput);
  });

  it('refreshes the scan pool after spending a token so an emptied card row cannot be marked again', () => {
    const game = createMockGame();
    game.cardRow.splice(1);
    const player = createPlayer(1);
    player.waitingFor = ScanActionPool.execute(player, game);

    const cardInput = processFreeAction(player, game, {
      type: EFreeAction.SPEND_SIGNAL_TOKEN,
    });
    if (!cardInput) {
      throw new Error('Expected signal token free action to request a card');
    }

    const sectorChoice = cardInput.process({
      type: EPlayerInputType.CARD,
      cardIds: ['card-row-1'],
    });
    if (!sectorChoice) {
      throw new Error('Expected selected card color to request a sector');
    }

    const returnedInput = sectorChoice.process({
      type: EPlayerInputType.OPTION,
      optionId: 'sector-2',
    });

    const returnedModel = returnedInput?.toModel();
    if (!returnedModel || returnedModel.type !== EPlayerInputType.OPTION) {
      throw new Error('Expected refreshed scan pool after spending token');
    }
    expect(returnedModel.options.map((option) => option.id)).not.toContain(
      EScanSubAction.MARK_CARD_ROW,
    );
  });

  it('rejects outside the scan pool', () => {
    const game = createMockGame();
    const player = createPlayer(1);

    expect(() =>
      processFreeAction(player, game, {
        type: EFreeAction.SPEND_SIGNAL_TOKEN,
      }),
    ).toThrow(GameError);
  });

  it('rejects when the player has no signal tokens', () => {
    const game = createMockGame();
    const player = createPlayer(0);
    player.waitingFor = ScanActionPool.execute(player, game);

    expect(() =>
      processFreeAction(player, game, {
        type: EFreeAction.SPEND_SIGNAL_TOKEN,
      }),
    ).toThrow(GameError);
  });

  it('rejects when the card row is empty', () => {
    const game = createMockGame();
    game.cardRow.splice(0);
    const player = createPlayer(1);
    player.waitingFor = ScanActionPool.execute(player, game);

    expect(() =>
      processFreeAction(player, game, {
        type: EFreeAction.SPEND_SIGNAL_TOKEN,
      }),
    ).toThrow(GameError);
  });
});
