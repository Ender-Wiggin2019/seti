import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  EMainAction,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Deck } from '@/engine/deck/Deck.js';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import { UseOrganizationPowerFreeAction } from '@/engine/freeActions/UseOrganizationPower.js';
import { Game } from '@/engine/Game.js';
import { OrganizationRegistry } from '@/engine/organization/OrganizationRegistry.js';
import { Income } from '@/engine/player/Income.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { Resources } from '@/engine/player/Resources.js';
import {
  GoldScoringTile,
  scoreEndGameCard,
} from '@/engine/scoring/GoldScoringTile.js';
import {
  resolveAllInputsDefault,
  skipSetupTucks,
} from '../../helpers/TestGameBuilder.js';

function createCleanGame() {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'organization-runtime-seed',
  );
  skipSetupTucks(game);
  return game;
}

function resetPlayerForOrganizationSetup(player: IPlayer): void {
  player.hand = ['seed-a', 'seed-b', 'seed-c', 'seed-d'];
  player.tuckedIncomeCards = [];
  player.resources = new Resources(
    { credits: 0, energy: 0, publicity: 0, data: 0, signalTokens: 0 },
    { dataController: player.data },
  );
  player.income = new Income();
  player.pendingSetupTucks = 0;
  player.probesInSpace = 0;
  player.organizationIds = [];
  player.organizationState = {};
  player.oncePerRoundUsed = {};
  player.actionCosts = {
    analyzeDataEnergy: 1,
    researchTechPublicity: 6,
  };
}

const ONCE_PER_ROUND_ORGANIZATIONS = [
  EOrganizationId.COSMOS_STRATEGY_GROUP,
  EOrganizationId.DEEP_SKY_SURVEY,
  EOrganizationId.FENWICK_RESEARCH_CENTER,
  EOrganizationId.FUTURESPAN_INSTITUTE,
  EOrganizationId.HELION_ASSEMBLY,
  EOrganizationId.MISSION_RELAY,
  EOrganizationId.ORBITAL_DYNAMICS,
  EOrganizationId.SENTINEL_PROBE_NETWORK,
  EOrganizationId.STRATUS_CORE,
  EOrganizationId.TURING_SYSTEMS,
] as const;

function passActivePlayer(game: Game): void {
  const player = game.activePlayer;
  game.processMainAction(player.id, { type: EMainAction.PASS });
  resolveAllInputsDefault(game, player);
}

describe('Organization', () => {
  it('applies documented setup resources, income, tuck count, and starting probes', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);

    OrganizationRegistry.create(EOrganizationId.ORBITAL_DYNAMICS).resolve(
      player,
      game,
    );

    expect(player.organizationIds).toEqual([EOrganizationId.ORBITAL_DYNAMICS]);
    expect(player.resources.toObject()).toEqual({
      credits: 2,
      energy: 2,
      publicity: 3,
      data: 0,
      signalTokens: 0,
    });
    expect(player.income.baseIncome).toMatchObject({
      [EResource.CREDIT]: 3,
      [EResource.ENERGY]: 1,
      [EResource.CARD]: 1,
    });
    expect(player.hand).toHaveLength(4);
    expect(player.pendingSetupTucks).toBe(2);
    expect(player.probesInSpace).toBe(2);
    expect(
      game.solarSystem?.spaces.flatMap((space) =>
        space.occupants.filter((probe) => probe.playerId === player.id),
      ),
    ).toHaveLength(2);
  });

  it('keeps main-action-only organizations unavailable as free-action powers', () => {
    const organization = OrganizationRegistry.create(EOrganizationId.XENOLAB);

    expect(organization.hasImplementedPower()).toBe(false);
    expect(organization.hasImplementedMainAction()).toBe(true);
  });

  it('rejects free-action powers for unowned organizations', () => {
    const game = createCleanGame();
    const player = game.players[0];

    let thrown: unknown;
    try {
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.ORBITAL_DYNAMICS,
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      code: EErrorCode.INVALID_FREE_ACTION,
      message: 'Player does not own this organization',
    });
  });

  it('rejects organizations without free-action powers even when owned', () => {
    const game = createCleanGame();
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.XENOLAB];

    let thrown: unknown;
    try {
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.XENOLAB,
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      code: EErrorCode.INVALID_FREE_ACTION,
      message:
        'Organization free-action powers are not implemented for this organization',
    });
  });

  it('executes Stratus Core card-row corner power once per round', () => {
    const game = createCleanGame();
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.STRATUS_CORE];
    player.oncePerRoundUsed = { [EOrganizationId.STRATUS_CORE]: false };
    game.cardRow = ['128', '136', '39'];

    UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.STRATUS_CORE,
    );

    expect(player.resources.publicity).toBe(5);
    expect(player.resources.data).toBe(1);
    expect(player.getMoveStash()).toBe(1);
    expect(game.cardRow).toEqual(['128', '136', '39']);
    expect(player.oncePerRoundUsed[EOrganizationId.STRATUS_CORE]).toBe(true);
    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.STRATUS_CORE,
      ),
    ).toThrow('Organization power already used this round');
  });

  it('rejects Stratus Core when the card row is empty without spending it', () => {
    const game = createCleanGame();
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.STRATUS_CORE];
    player.oncePerRoundUsed = { [EOrganizationId.STRATUS_CORE]: false };
    game.cardRow = [];

    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.STRATUS_CORE,
      ),
    ).toThrow('Organization power is not currently available');
    expect(player.oncePerRoundUsed[EOrganizationId.STRATUS_CORE]).toBe(false);
  });

  it('executes Fenwick Research Center from a selected card-row card', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.FENWICK_RESEARCH_CENTER];
    player.oncePerRoundUsed = {
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: false,
    };
    player.resources.gain({ publicity: 1 });
    game.cardRow = ['136', '128', '39'];
    game.mainDeck = new Deck(['13']);

    const sourceInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.FENWICK_RESEARCH_CENTER,
    );
    expect(
      player.oncePerRoundUsed[EOrganizationId.FENWICK_RESEARCH_CENTER],
    ).toBe(false);
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
    expect(
      player.oncePerRoundUsed[EOrganizationId.FENWICK_RESEARCH_CENTER],
    ).toBe(false);
    expect(cardInput?.toModel()).toMatchObject({
      type: EPlayerInputType.CARD,
      cards: [{ id: '136' }, { id: '128' }, { id: '39' }],
    });

    const nextInput = cardInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['128'],
    });

    expect(nextInput).toBeUndefined();
    expect(player.hand).toContain('128');
    expect(player.resources.publicity).toBe(1);
    expect(game.cardRow).toEqual(['136', '39', '13']);
    expect(
      player.oncePerRoundUsed[EOrganizationId.FENWICK_RESEARCH_CENTER],
    ).toBe(true);
  });

  it('does not spend Fenwick Research Center if the source selection is abandoned', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.FENWICK_RESEARCH_CENTER];
    player.oncePerRoundUsed = {
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: false,
    };
    player.resources.gain({ publicity: 1 });
    game.cardRow = ['136'];
    game.mainDeck = new Deck(['128']);

    UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.FENWICK_RESEARCH_CENTER,
    );

    expect(player.resources.publicity).toBe(1);
    expect(
      player.oncePerRoundUsed[EOrganizationId.FENWICK_RESEARCH_CENTER],
    ).toBe(false);
  });

  it('rejects Fenwick Research Center when no cards are available without spending it', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.FENWICK_RESEARCH_CENTER];
    player.oncePerRoundUsed = {
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: false,
    };
    player.resources.gain({ publicity: 1 });
    game.cardRow = [];
    game.mainDeck = new Deck([]);

    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.FENWICK_RESEARCH_CENTER,
      ),
    ).toThrow('Organization power is not currently available');
    expect(
      player.oncePerRoundUsed[EOrganizationId.FENWICK_RESEARCH_CENTER],
    ).toBe(false);
  });

  it('executes Fenwick Research Center from a random deck card', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.FENWICK_RESEARCH_CENTER];
    player.oncePerRoundUsed = {
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: false,
    };
    player.resources.gain({ publicity: 1 });
    game.cardRow = ['136', '39'];
    game.mainDeck = new Deck(['128']);

    const sourceInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.FENWICK_RESEARCH_CENTER,
    );
    const nextInput = sourceInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'main-deck',
    });

    expect(nextInput).toBeUndefined();
    expect(player.hand).toContain('128');
    expect(player.resources.publicity).toBe(1);
    expect(game.cardRow).toEqual(['136', '39']);
    expect(
      player.oncePerRoundUsed[EOrganizationId.FENWICK_RESEARCH_CENTER],
    ).toBe(true);
  });

  it('rejects organization powers while another action is resolving', () => {
    const game = createCleanGame();
    const player = game.players[0];
    player.organizationIds = [EOrganizationId.FENWICK_RESEARCH_CENTER];
    player.oncePerRoundUsed = {
      [EOrganizationId.FENWICK_RESEARCH_CENTER]: false,
    };
    player.resources.gain({ publicity: 1 });
    game.phase = EPhase.IN_RESOLUTION;

    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.FENWICK_RESEARCH_CENTER,
      ),
    ).toThrow('Organization powers cannot interrupt pending resolution');
  });

  it('lets Cosmos Strategy Group gain a card from the card row and clear marked rewards', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.COSMOS_STRATEGY_GROUP];
    player.oncePerRoundUsed = {
      [EOrganizationId.COSMOS_STRATEGY_GROUP]: false,
    };
    player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP] = {
      markedRewards: { [EResource.CREDIT]: true },
    };
    game.cardRow = ['128', '136'];
    game.mainDeck = new Deck(['39']);

    const input = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.COSMOS_STRATEGY_GROUP,
    );
    expect(input?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      options: expect.arrayContaining([
        expect.objectContaining({ id: 'row:0:128' }),
        expect.objectContaining({ id: 'deck' }),
      ]),
    });

    const done = input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'row:0:128',
    });

    expect(done).toBeUndefined();
    expect(player.hand).toContain('128');
    expect(game.cardRow).toEqual(['136', '39']);
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toEqual({ markedRewards: {} });
    expect(player.oncePerRoundUsed[EOrganizationId.COSMOS_STRATEGY_GROUP]).toBe(
      true,
    );
  });

  it('rejects Cosmos Strategy Group when no cards are available without clearing marks', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.COSMOS_STRATEGY_GROUP];
    player.oncePerRoundUsed = {
      [EOrganizationId.COSMOS_STRATEGY_GROUP]: false,
    };
    player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP] = {
      markedRewards: { [EResource.CREDIT]: true },
    };
    game.cardRow = [];
    game.mainDeck = new Deck([]);

    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.COSMOS_STRATEGY_GROUP,
      ),
    ).toThrow('Organization power is not currently available');
    expect(
      player.organizationState[EOrganizationId.COSMOS_STRATEGY_GROUP],
    ).toEqual({ markedRewards: { [EResource.CREDIT]: true } });
    expect(player.oncePerRoundUsed[EOrganizationId.COSMOS_STRATEGY_GROUP]).toBe(
      false,
    );
  });

  it('stores a resolved non-alien card corner for Sentinel Probe Network and replays it on power use', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.hand = ['128'];
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    OrganizationRegistry.create(EOrganizationId.SENTINEL_PROBE_NETWORK).restore(
      player,
      game,
    );
    player.resources.gain({ credits: 10 });

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(player.resources.publicity).toBe(0);
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toMatchObject({ lastCardCornerCardId: '128' });

    const pendingInput = UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.SENTINEL_PROBE_NETWORK,
    );
    expect(pendingInput).toBeUndefined();
    expect(player.resources.publicity).toBe(1);
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toEqual({});
    expect(
      player.oncePerRoundUsed[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toBe(true);
  });

  it('stores only the latest Sentinel Probe Network card corner and consumes it once', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    OrganizationRegistry.create(EOrganizationId.SENTINEL_PROBE_NETWORK).restore(
      player,
      game,
    );

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
      actionDetails: { cardId: '128' },
    });

    UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.SENTINEL_PROBE_NETWORK,
    );

    expect(player.resources.data).toBe(0);
    expect(player.resources.publicity).toBe(1);
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toEqual({});
    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.SENTINEL_PROBE_NETWORK,
      ),
    ).toThrow('Organization power already used this round');
  });

  it('does not let Sentinel Probe Network interrupt pending card resolution', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK] = {
      lastCardCornerCardId: '128',
    };
    player.waitingFor = {} as IPlayer['waitingFor'];

    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.SENTINEL_PROBE_NETWORK,
      ),
    ).toThrow('Organization powers cannot interrupt pending resolution');
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toMatchObject({ lastCardCornerCardId: '128' });
    expect(
      player.oncePerRoundUsed[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toBe(false);
  });

  it('does not spend Sentinel Probe Network on alien cards', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.hand = ['ET.5'];
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    OrganizationRegistry.create(EOrganizationId.SENTINEL_PROBE_NETWORK).restore(
      player,
      game,
    );
    player.resources.gain({ credits: 10 });
    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(player.score).toBe(1);
    expect(player.getMoveStash()).toBe(0);
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toEqual({});
    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.SENTINEL_PROBE_NETWORK,
      ),
    ).toThrow('Organization power is not currently available');
  });

  it('does not store other players resolved card corners for Sentinel Probe Network', () => {
    const game = createCleanGame();
    const player = game.players[0];
    const otherPlayer = game.players[1];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    OrganizationRegistry.create(EOrganizationId.SENTINEL_PROBE_NETWORK).restore(
      player,
      game,
    );

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player: otherPlayer,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '128' },
    });

    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toEqual({});
    expect(() =>
      UseOrganizationPowerFreeAction.execute(
        player,
        game,
        EOrganizationId.SENTINEL_PROBE_NETWORK,
      ),
    ).toThrow('Organization power is not currently available');
  });

  it('marks a signal in the launched probe sector for Sentinel Probe Network', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    OrganizationRegistry.create(EOrganizationId.SENTINEL_PROBE_NETWORK).restore(
      player,
      game,
    );
    player.resources.gain({ credits: 4 });

    const earthSpaceId = game.solarSystem?.getPlanetLocation(EPlanet.EARTH)
      ?.space.id;
    const sectorIndex =
      earthSpaceId !== undefined
        ? game.solarSystem?.getSectorIndexOfSpace(earthSpaceId)
        : null;
    expect(sectorIndex).not.toBeNull();
    const sector = game.sectors[sectorIndex ?? 0];
    const before = sector.signals.filter(
      (signal) => signal.type === 'player' && signal.playerId === player.id,
    ).length;

    game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });

    expect(
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === player.id,
      ),
    ).toHaveLength(before + 1);
  });

  it('clears Sentinel Probe Network stored corner state at turn end', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    OrganizationRegistry.create(EOrganizationId.SENTINEL_PROBE_NETWORK).restore(
      player,
      game,
    );
    player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK] = {
      lastCardCornerCardId: '128',
    };

    game.processMainAction(player.id, { type: EMainAction.PASS });
    resolveAllInputsDefault(game, player);

    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toEqual({});
  });

  it.each(ONCE_PER_ROUND_ORGANIZATIONS)(
    'resets once-per-round organization power usage at round end for %s',
    (organizationId) => {
      const game = createCleanGame();
      const player = game.players[0];
      player.organizationIds = [organizationId];
      player.oncePerRoundUsed = { [organizationId]: true };

      passActivePlayer(game);
      passActivePlayer(game);

      expect(player.oncePerRoundUsed[organizationId]).toBe(false);
    },
  );

  it('puts organization starting data into the data pool, not the turn stash', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);

    OrganizationRegistry.create(EOrganizationId.DEEP_SKY_SURVEY).resolve(
      player,
      game,
    );

    expect(player.resources.toObject().data).toBe(1);
    expect(player.dataPool.count).toBe(1);
    expect(player.data.getState().stash).toBe(0);
    expect(PlaceDataFreeAction.canExecute(player, game)).toBe(true);
  });

  it('lets organizations modify player action cost configuration during setup', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);

    OrganizationRegistry.create(
      EOrganizationId.FENWICK_RESEARCH_CENTER,
    ).resolve(player, game);

    expect(player.actionCosts.researchTechPublicity).toBe(5);
    expect(player.actionCosts.analyzeDataEnergy).toBe(1);

    const deepSkyPlayer = game.players[1];
    resetPlayerForOrganizationSetup(deepSkyPlayer);
    OrganizationRegistry.create(EOrganizationId.DEEP_SKY_SURVEY).resolve(
      deepSkyPlayer,
      game,
    );

    expect(deepSkyPlayer.actionCosts.analyzeDataEnergy).toBe(0);
    expect(deepSkyPlayer.actionCosts.researchTechPublicity).toBe(6);
  });

  it('restores organization event listeners through the registry', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    player.organizationIds = [EOrganizationId.SENTINEL_PROBE_NETWORK];
    player.oncePerRoundUsed = {
      [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
    };
    player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK] = {};

    (
      OrganizationRegistry as unknown as {
        restorePlayerOrganizations: (game: Game, player: IPlayer) => void;
      }
    ).restorePlayerOrganizations(game, player);

    game.eventBus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      game,
      player,
      action: { type: EMainAction.PLAY_CARD },
      actionDetails: { cardId: '128' },
    });
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toMatchObject({ lastCardCornerCardId: '128' });

    UseOrganizationPowerFreeAction.execute(
      player,
      game,
      EOrganizationId.SENTINEL_PROBE_NETWORK,
    );
    expect(player.resources.publicity).toBe(1);
    expect(
      player.organizationState[EOrganizationId.SENTINEL_PROBE_NETWORK],
    ).toEqual({});
  });

  it('marks Mission Relay mission gold tile lowest slot during setup', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    const missionTile = game.goldScoringTiles.find(
      (tile) => tile.id === 'mission',
    );
    const lowestSlotValue =
      missionTile?.slotValues[missionTile.slotValues.length - 1];

    OrganizationRegistry.create(EOrganizationId.MISSION_RELAY).resolve(
      player,
      game,
    );

    expect(missionTile?.claims).toContainEqual({
      playerId: player.id,
      value: lowestSlotValue,
    });
    expect(missionTile?.canClaim(player.id)).toBe(false);
  });

  it('counts Mission Relay setup mark as marked for Solvay Conference', () => {
    const game = createCleanGame();
    const player = game.players[0];
    resetPlayerForOrganizationSetup(player);
    game.goldScoringTiles = [
      new GoldScoringTile({ id: 'mission', side: 'A', slotValues: [8, 6, 4] }),
      new GoldScoringTile({ id: 'tech', side: 'A' }),
      new GoldScoringTile({ id: 'income', side: 'A' }),
      new GoldScoringTile({ id: 'other', side: 'A' }),
    ];

    OrganizationRegistry.create(EOrganizationId.MISSION_RELAY).resolve(
      player,
      game,
    );
    for (const tile of game.goldScoringTiles.filter(
      (tile) => tile.id !== 'mission',
    )) {
      tile.claim(player.id);
    }
    player.completedMissions = ['completed-mission' as never];

    expect(scoreEndGameCard('113', player, game)).toBe(0);
  });
});
