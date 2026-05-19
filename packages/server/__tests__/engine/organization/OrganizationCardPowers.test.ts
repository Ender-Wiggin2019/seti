import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { Deck } from '@/engine/deck/Deck.js';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import { UseOrganizationPowerFreeAction } from '@/engine/freeActions/UseOrganizationPower.js';
import { Game } from '@/engine/Game.js';
import { OrganizationRegistry } from '@/engine/organization/OrganizationRegistry.js';
import { Income } from '@/engine/player/Income.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { Resources } from '@/engine/player/Resources.js';
import { skipSetupTucks } from '../../helpers/TestGameBuilder.js';

function createCleanGame() {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'organization-card-powers-seed',
  );
  skipSetupTucks(game);
  return game;
}

function resetPlayer(player: IPlayer): void {
  player.hand = [];
  player.tuckedIncomeCards = [];
  player.resources = new Resources(
    { credits: 0, energy: 0, publicity: 0, data: 0, signalTokens: 0 },
    { dataController: player.data },
  );
  player.income = new Income();
  player.pendingSetupTucks = 0;
  player.organizationIds = [];
  player.organizationState = {};
  player.oncePerRoundUsed = {};
}

function restoreOrganization(
  player: IPlayer,
  game: Game,
  organizationId: EOrganizationId,
): void {
  player.organizationIds = [organizationId];
  player.organizationState[organizationId] = {};
  player.oncePerRoundUsed[organizationId] = false;
  OrganizationRegistry.create(organizationId).restore(player, game);
}

describe('organization card powers', () => {
  it('Deep Sky Survey swaps exactly one hand card, including alien items, with one card-row card', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.DEEP_SKY_SURVEY);
    const alienCard = { id: 'ET.5', source: 'alien-row-object' };
    player.hand = ['136', alienCard];
    game.cardRow = ['128', '39'];

    const handInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.DEEP_SKY_SURVEY,
    );
    expect(handInput?.toModel()).toMatchObject({
      type: EPlayerInputType.CARD,
      minSelections: 1,
      maxSelections: 1,
      cards: [{ id: '136@0' }, { id: 'ET.5@1' }],
    });

    const rowInput = handInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['ET.5@1'],
    });
    expect(rowInput?.toModel()).toMatchObject({
      type: EPlayerInputType.CARD,
      minSelections: 1,
      maxSelections: 1,
      cards: [{ id: '128@0' }, { id: '39@1' }],
    });

    const nextInput = rowInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['128@0'],
    });

    expect(nextInput).toBeUndefined();
    expect(player.hand).toEqual(['136', '128']);
    expect(game.cardRow).toEqual([alienCard, '39']);
    expect(player.oncePerRoundUsed[EOrganizationId.DEEP_SKY_SURVEY]).toBe(true);
  });

  it('Deep Sky Survey does not spend the power before both swap choices are made', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.DEEP_SKY_SURVEY);
    player.hand = ['136'];
    game.cardRow = ['128'];

    const handInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.DEEP_SKY_SURVEY,
    );
    const rowInput = handInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['136@0'],
    });

    expect(rowInput?.toModel()).toMatchObject({
      type: EPlayerInputType.CARD,
      cards: [{ id: '128@0' }],
    });
    expect(player.hand).toEqual(['136']);
    expect(game.cardRow).toEqual(['128']);
    expect(player.oncePerRoundUsed[EOrganizationId.DEEP_SKY_SURVEY]).toBe(
      false,
    );
  });

  it('Mission Relay gains publicity for mission cards and resolves selected row card income with refill', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.MISSION_RELAY);
    player.hand = ['128'];
    player.resources.gain({ credits: 10 });

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(player.resources.publicity).toBe(1);

    player.resources.gain({ publicity: 1 });
    game.cardRow = ['136', '128'];
    game.mainDeck = new Deck(['39']);

    const sourceInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.MISSION_RELAY,
    );
    expect(sourceInput?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      options: [
        { id: 'card-row', label: 'Card row' },
        { id: 'main-deck', label: 'Main deck' },
      ],
    });

    const cardInput = sourceInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'card-row',
    });
    const nextInput = cardInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['136@0'],
    });

    expect(nextInput).toBeUndefined();
    expect(player.resources.publicity).toBe(0);
    expect(player.resources.energy).toBe(1);
    expect(player.hand).toContain('136');
    expect(game.cardRow).toEqual(['128', '39']);
    expect(player.oncePerRoundUsed[EOrganizationId.MISSION_RELAY]).toBe(true);
  });

  it('Mission Relay ignores non-mission played cards for its publicity trigger', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.MISSION_RELAY);

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '136' },
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player: game.players[1],
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '128', destination: 'mission' },
    });

    expect(player.resources.publicity).toBe(0);
  });

  it('Stratus Core chains CARD_ANY card-row corners in row order without discarding row cards', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.STRATUS_CORE);
    const cardData = loadCardData('39');
    const originalFreeAction = cardData.freeAction;
    cardData.freeAction = [{ type: EResource.CARD_ANY, value: 1 }];
    game.cardRow = ['39', '136'];
    game.mainDeck = new Deck(['90']);

    try {
      const cardChoice = UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.STRATUS_CORE,
      );

      expect(player.resources.data).toBe(0);
      expect(cardChoice?.toModel()).toMatchObject({
        type: EPlayerInputType.OPTION,
      });

      const nextInput = cardChoice?.process({
        type: EPlayerInputType.OPTION,
        optionId: 'deck',
      });

      expect(nextInput).toBeUndefined();
      expect(player.hand).toContain('90');
      expect(player.resources.data).toBe(1);
      expect(game.cardRow).toEqual(['39', '136']);
      expect(player.oncePerRoundUsed[EOrganizationId.STRATUS_CORE]).toBe(true);
    } finally {
      cardData.freeAction = originalFreeAction;
    }
  });

  it('Cosmos Strategy Group marks unmarked sector rewards, ignores alien cards, and clears marks on power', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.COSMOS_STRATEGY_GROUP);

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '93' },
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '93' },
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '136' },
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: 'ET.5' },
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '122' },
    });

    expect(player.resources.credits).toBe(1);
    expect(player.resources.publicity).toBe(1);
    expect(player.resources.data).toBe(1);
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toMatchObject({
      markedRewards: {
        [EResource.CREDIT]: true,
        [EResource.PUBLICITY]: true,
        [EResource.DATA]: true,
      },
    });

    game.cardRow = [];
    game.mainDeck = new Deck(['39']);
    const nextInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.COSMOS_STRATEGY_GROUP,
    );

    expect(nextInput).toBeUndefined();
    expect(player.hand).toEqual(['39']);
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toMatchObject({ markedRewards: {} });
    expect(player.oncePerRoundUsed[EOrganizationId.COSMOS_STRATEGY_GROUP]).toBe(
      true,
    );
  });

  it('Cosmos Strategy Group can mark the same sector reward again after its free action clears marks', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.COSMOS_STRATEGY_GROUP);

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '136' },
    });
    expect(player.resources.publicity).toBe(1);

    game.mainDeck = new Deck(['39']);
    const clearInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.COSMOS_STRATEGY_GROUP,
    );
    clearInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'deck',
    });
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toMatchObject({ markedRewards: {} });

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '136' },
    });

    expect(player.resources.publicity).toBe(2);
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toMatchObject({
      markedRewards: { [EResource.PUBLICITY]: true },
    });
  });

  it('Cosmos Strategy Group lets black-sector cards choose the reward mark', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayer(player);
    restoreOrganization(player, game, EOrganizationId.COSMOS_STRATEGY_GROUP);

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '122' },
    });

    const rewardInput = game.deferredActions.drain(game);
    expect(rewardInput?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      options: [
        { id: EResource.CREDIT },
        { id: EResource.PUBLICITY },
        { id: EResource.DATA },
      ],
    });

    const done = rewardInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: EResource.PUBLICITY,
    });

    expect(done).toBeUndefined();
    expect(player.resources.credits).toBe(0);
    expect(player.resources.publicity).toBe(1);
    expect(player.resources.data).toBe(0);
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toMatchObject({
      markedRewards: {
        [EResource.PUBLICITY]: true,
      },
    });
  });
});
