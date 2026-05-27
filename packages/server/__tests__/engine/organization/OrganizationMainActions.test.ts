import { EAlienType } from '@seti/common/types/BaseCard';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  EFreeAction,
  EMainAction,
  EPhase,
  ETrace,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Deck } from '@/engine/deck/Deck.js';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import { Game } from '@/engine/Game.js';
import { OrganizationRegistry } from '@/engine/organization/OrganizationRegistry.js';
import { Resources } from '@/engine/player/Resources.js';
import { skipSetupTucks } from '../../helpers/TestGameBuilder.js';

function createCleanGame(seed = 'organization-main-actions') {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    seed,
    seed,
  );
  skipSetupTucks(game);
  return game;
}

function setResources(
  player: ReturnType<typeof createCleanGame>['players'][number],
  resources: ConstructorParameters<typeof Resources>[0],
): void {
  player.resources = new Resources(resources, { dataController: player.data });
}

describe('Organization main actions', () => {
  it('Futurespan Institute prepares, delays, then plays the prepared card for free', () => {
    const game = createCleanGame('futurespan-main-action');
    const player = game.players[0];
    player.hand = ['130'];
    player.score = 10;
    setResources(player, {
      credits: 0,
      energy: 0,
      publicity: 0,
      data: 0,
      signalTokens: 0,
    });
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {};
    player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE] = false;
    game.cardRow = [];
    game.mainDeck = new Deck(['128']);

    const prepareInput = game.processFreeAction(player.id, {
      type: EFreeAction.USE_ORGANIZATION_POWER,
      organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
    });
    expect(prepareInput).toBeUndefined();
    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.CARD,
      cards: [{ id: '130@0', cardId: '130' }],
    });

    game.processInput(player.id, {
      type: EPlayerInputType.CARD,
      cardIds: ['130@0'],
    });

    expect(player.hand).toEqual([]);
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({
      preparedCardId: '130',
      unlockScore: 25,
    });
    expect(player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE]).toBe(
      false,
    );

    game.processFreeAction(player.id, {
      type: EFreeAction.USE_ORGANIZATION_POWER,
      organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
    });

    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({
      preparedCardId: '130',
      unlockScore: 28,
    });
    expect(player.hand).toEqual(['128']);
    expect(player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE]).toBe(
      true,
    );

    player.score = 28;
    game.processMainAction(player.id, {
      type: EMainAction.USE_ORGANIZATION_ACTION,
      payload: { organizationId: EOrganizationId.FUTURESPAN_INSTITUTE },
    });

    expect(player.resources.credits).toBe(0);
    expect(player.hand).toEqual(['128']);
    expect(game.mainDeck.getDiscardPile()).toContain('130');
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toEqual({});
    expect(player.probesInSpace).toBe(1);
    expect(game.phase).toBe(EPhase.AWAIT_END_TURN);

    player.hand.push('136');
    game.processFreeAction(player.id, {
      type: EFreeAction.USE_ORGANIZATION_POWER,
      organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
    });
    const prepareAgainModel = player.waitingFor?.toModel();
    expect(prepareAgainModel).toMatchObject({ type: EPlayerInputType.CARD });
    expect(
      prepareAgainModel?.type === EPlayerInputType.CARD
        ? prepareAgainModel.cards
        : [],
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '136@1', cardId: '136' }),
      ]),
    );
  });

  it('does not offer Centaurians energy-cost cards for Futurespan preparation', () => {
    const game = createCleanGame('futurespan-prepare-filter');
    const player = game.players[0];
    player.hand = ['ET.34', '130'];
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {};
    player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE] = false;

    game.processFreeAction(player.id, {
      type: EFreeAction.USE_ORGANIZATION_POWER,
      organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
    });

    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.CARD,
      cards: [{ id: '130@1', cardId: '130' }],
    });
  });

  it('does not allow Futurespan Institute to play a prepared energy-cost card', () => {
    const game = createCleanGame('futurespan-energy-card-main-action');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {
      preparedCard: 'ET.34',
      preparedCardId: 'ET.34',
      unlockScore: player.score,
    };
    setResources(player, {
      credits: 0,
      energy: 10,
      publicity: 0,
      data: 0,
      signalTokens: 0,
    });
    OrganizationRegistry.create(EOrganizationId.FUTURESPAN_INSTITUTE).restore(
      player,
      game,
    );

    expect(OrganizationRegistry.getUsableMainActionIds(player, game)).toEqual(
      [],
    );
    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.USE_ORGANIZATION_ACTION,
        payload: { organizationId: EOrganizationId.FUTURESPAN_INSTITUTE },
      }),
    ).toThrow('Organization main action requirements are not met');
    expect(player.hand).not.toContain('ET.34');
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({ preparedCardId: 'ET.34' });
  });

  it('does not spend Futurespan Institute when trying to delay an unlocked prepared card', () => {
    const game = createCleanGame('futurespan-unlocked-delay');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {
      preparedCard: '130',
      preparedCardId: '130',
      unlockScore: player.score,
    };
    player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE] = false;
    game.cardRow = ['128'];
    OrganizationRegistry.create(EOrganizationId.FUTURESPAN_INSTITUTE).restore(
      player,
      game,
    );

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.USE_ORGANIZATION_POWER,
        organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
      }),
    ).toThrow('Organization power is not currently available');
    expect(player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE]).toBe(
      false,
    );
    expect(player.hand).not.toContain('128');
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({ unlockScore: player.score });
  });

  it('lets Futurespan Institute delay by gaining a card from the card row', () => {
    const game = createCleanGame('futurespan-delay-card-row');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {
      preparedCard: '130',
      preparedCardId: '130',
      unlockScore: player.score + 5,
    };
    player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE] = false;
    game.cardRow = ['128', '136'];
    game.mainDeck = new Deck(['39']);
    OrganizationRegistry.create(EOrganizationId.FUTURESPAN_INSTITUTE).restore(
      player,
      game,
    );

    const input = game.processFreeAction(player.id, {
      type: EFreeAction.USE_ORGANIZATION_POWER,
      organizationId: EOrganizationId.FUTURESPAN_INSTITUTE,
    });
    expect(input).toBeUndefined();
    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      options: expect.arrayContaining([
        expect.objectContaining({ id: 'row:0:128' }),
        expect.objectContaining({ id: 'deck' }),
      ]),
    });

    game.processInput(player.id, {
      type: EPlayerInputType.OPTION,
      optionId: 'row:0:128',
    });

    expect(player.hand).toContain('128');
    expect(game.cardRow).toEqual(['136', '39']);
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({ preparedCardId: '130', unlockScore: player.score + 8 });
    expect(player.oncePerRoundUsed[EOrganizationId.FUTURESPAN_INSTITUTE]).toBe(
      true,
    );
  });

  it('keeps locked Futurespan cards unavailable as organization main actions', () => {
    const game = createCleanGame('futurespan-locked-main-action');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {
      preparedCard: '130',
      preparedCardId: '130',
      unlockScore: player.score + 1,
    };
    OrganizationRegistry.create(EOrganizationId.FUTURESPAN_INSTITUTE).restore(
      player,
      game,
    );

    expect(OrganizationRegistry.getUsableMainActionIds(player, game)).toEqual(
      [],
    );
    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.USE_ORGANIZATION_ACTION,
        payload: { organizationId: EOrganizationId.FUTURESPAN_INSTITUTE },
      }),
    ).toThrow('Organization main action requirements are not met');
    expect(player.hand).not.toContain('130');
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({ preparedCardId: '130' });
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('does not leak an unplayable Futurespan prepared card into hand or discard', () => {
    const game = createCleanGame('futurespan-unplayable-main-action');
    const player = game.players[0];
    const preparedCard = {
      id: 'blocked-exertian',
      alien: EAlienType.EXERTIANS,
    };
    player.organizationIds = [EOrganizationId.FUTURESPAN_INSTITUTE];
    player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE] = {
      preparedCard,
      preparedCardId: 'blocked-exertian',
      unlockScore: player.score,
    };
    OrganizationRegistry.create(EOrganizationId.FUTURESPAN_INSTITUTE).restore(
      player,
      game,
    );

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.USE_ORGANIZATION_ACTION,
        payload: { organizationId: EOrganizationId.FUTURESPAN_INSTITUTE },
      }),
    ).toThrow('Organization main action requirements are not met');
    expect(player.hand).not.toContain(preparedCard);
    expect(game.mainDeck.getDiscardPile()).not.toContain('blocked-exertian');
    expect(
      player.organizationState[EOrganizationId.FUTURESPAN_INSTITUTE],
    ).toMatchObject({ preparedCardId: 'blocked-exertian' });
  });

  it('Xenolab launch tile costs 1 credit and flips inactive', () => {
    const game = createCleanGame('xenolab-launch');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);
    setResources(player, {
      credits: 1,
      energy: 0,
      publicity: 0,
      data: 0,
      signalTokens: 0,
    });

    game.processMainAction(player.id, {
      type: EMainAction.USE_ORGANIZATION_ACTION,
      payload: {
        organizationId: EOrganizationId.XENOLAB,
        actionId: 'launch',
      },
    });

    expect(player.resources.credits).toBe(0);
    expect(player.probesInSpace).toBe(1);
    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: false, scan: true, research: true },
    });
  });

  it('Xenolab scan tile costs 2 energy and flips inactive', () => {
    const game = createCleanGame('xenolab-scan');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);
    setResources(player, {
      credits: 0,
      energy: 2,
      publicity: 0,
      data: 0,
      signalTokens: 0,
    });

    game.processMainAction(player.id, {
      type: EMainAction.USE_ORGANIZATION_ACTION,
      payload: {
        organizationId: EOrganizationId.XENOLAB,
        actionId: 'scan',
      },
    });

    expect(player.resources.energy).toBe(0);
    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
    });
    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: true, scan: false, research: true },
    });
  });

  it('Xenolab research tile costs 4 publicity and flips inactive', () => {
    const game = createCleanGame('xenolab-research');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);
    setResources(player, {
      credits: 0,
      energy: 0,
      publicity: 4,
      data: 0,
      signalTokens: 0,
    });

    game.processMainAction(player.id, {
      type: EMainAction.USE_ORGANIZATION_ACTION,
      payload: {
        organizationId: EOrganizationId.XENOLAB,
        actionId: 'research',
      },
    });

    expect(player.resources.publicity).toBe(0);
    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
    });
    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: true, scan: true, research: false },
    });
  });

  it('Xenolab trace colors reactivate matching inactive tiles', () => {
    const game = createCleanGame('xenolab-trace-reactivation');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];
    player.organizationState[EOrganizationId.XENOLAB] = {
      tiles: { launch: false, scan: false, research: false },
    };
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);

    game.eventBus.emit({
      type: EGameRuntimeEvent.TRACE_PLACED,
      game,
      player,
      traceColor: ETrace.BLUE,
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.TRACE_PLACED,
      game,
      player,
      traceColor: ETrace.YELLOW,
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.TRACE_PLACED,
      game,
      player,
      traceColor: ETrace.PINK,
    });

    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: true, scan: true, research: true },
    });
  });

  it('Xenolab ignores matching traces for other players and already active tiles', () => {
    const game = createCleanGame('xenolab-trace-owner');
    const player = game.players[0];
    const otherPlayer = game.players[1];
    player.organizationIds = [EOrganizationId.XENOLAB];
    player.organizationState[EOrganizationId.XENOLAB] = {
      tiles: { launch: false, scan: true, research: false },
    };
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);

    game.eventBus.emit({
      type: EGameRuntimeEvent.TRACE_PLACED,
      game,
      player: otherPlayer,
      traceColor: ETrace.BLUE,
    });
    game.eventBus.emit({
      type: EGameRuntimeEvent.TRACE_PLACED,
      game,
      player,
      traceColor: ETrace.YELLOW,
    });

    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: false, scan: true, research: false },
    });
  });

  it('rejects unavailable Xenolab main actions without changing resources or tile state', () => {
    const game = createCleanGame('xenolab-unavailable-action');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];
    player.organizationState[EOrganizationId.XENOLAB] = {
      tiles: { launch: false, scan: true, research: true },
    };
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);
    setResources(player, {
      credits: 1,
      energy: 0,
      publicity: 0,
      data: 0,
      signalTokens: 0,
    });

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.USE_ORGANIZATION_ACTION,
        payload: {
          organizationId: EOrganizationId.XENOLAB,
          actionId: 'launch',
        },
      }),
    ).toThrow('Organization main action requirements are not met');

    expect(player.resources.credits).toBe(1);
    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: false, scan: true, research: true },
    });
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('rolls back invalid Xenolab action ids without spending resources', () => {
    const game = createCleanGame('xenolab-invalid-action-id');
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];
    OrganizationRegistry.create(EOrganizationId.XENOLAB).restore(player, game);
    setResources(player, {
      credits: 1,
      energy: 2,
      publicity: 4,
      data: 0,
      signalTokens: 0,
    });

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.USE_ORGANIZATION_ACTION,
        payload: {
          organizationId: EOrganizationId.XENOLAB,
          actionId: 'invalid',
        },
      }),
    ).toThrow('Xenolab requires an actionId of launch, scan, or research');

    expect(player.resources.credits).toBe(1);
    expect(player.resources.energy).toBe(2);
    expect(player.resources.publicity).toBe(4);
    expect(player.organizationState[EOrganizationId.XENOLAB]).toMatchObject({
      tiles: { launch: true, scan: true, research: true },
    });
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('rejects organization main actions for unowned organizations', () => {
    const game = createCleanGame('organization-main-action-unowned');
    const player = game.players[0];

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.USE_ORGANIZATION_ACTION,
        payload: {
          organizationId: EOrganizationId.XENOLAB,
          actionId: 'scan',
        },
      }),
    ).toThrow('Organization main action requirements are not met');
  });
});
