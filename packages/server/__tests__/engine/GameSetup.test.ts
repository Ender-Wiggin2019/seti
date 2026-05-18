import { RIVAL_OBJECTIVE_IDS_BY_LEVEL } from '@seti/common/constant/solo';
import { baseCards } from '@seti/common/data/baseCards';
import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import { preludeCards } from '@seti/common/data/preludeCards';
import { spaceAgencyCards } from '@seti/common/data/spaceAgencyCards';
import { EEffectType, type Effect } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import {
  EAlienType,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import {
  DEFAULT_ALIEN_MODULES_ENABLED,
  EExpansion,
} from '@seti/common/types/protocol/options';
import {
  EPlayerInputType,
  ESetupChoiceStepKind,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import {
  FIRST_TAKE_VP_BONUS,
  TECH_CATEGORIES,
  TECH_LEVELS,
  TILES_PER_STACK,
} from '@seti/common/types/tech';
import { BaseCorporation } from '@/engine/corporation/BaseCorporation.js';
import { Game } from '@/engine/Game.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import type { ISetupRole } from '@/engine/setup/ISetupRole.js';

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Cathy', color: 'green', seatIndex: 2 },
  { id: 'p4', name: 'Dylan', color: 'yellow', seatIndex: 3 },
] as const;

function createBaseSpaceAgencyOptions(
  overrides: Partial<{
    enabled: boolean;
    agencies: boolean;
    startResourceCards: boolean;
    newDeck: boolean;
    newAlienSpecies: boolean;
  }> = {},
) {
  return {
    enabled: true,
    agencies: true,
    startResourceCards: false,
    newDeck: false,
    newAlienSpecies: false,
    ...overrides,
  };
}

function createAgenciesOptions(
  playerCount = 2,
  overrides: Partial<ReturnType<typeof createBaseSpaceAgencyOptions>> = {},
) {
  return {
    playerCount,
    expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
    spaceAgencyOptions: createBaseSpaceAgencyOptions(overrides),
  } as Parameters<typeof Game.create>[1];
}

function createSpaceAgencyOptions(
  playerCount = 2,
  overrides: Partial<ReturnType<typeof createBaseSpaceAgencyOptions>> = {},
) {
  return {
    playerCount,
    expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
    spaceAgencyOptions: createBaseSpaceAgencyOptions(overrides),
  } as Parameters<typeof Game.create>[1];
}

function collectInitialMainDeckCardIds(game: Game): string[] {
  return [
    ...game.mainDeck.getDrawPile(),
    ...game.cardRow.map(getCardItemId),
    ...game.endOfRoundStacks.flat().map(getCardItemId),
    ...game.players.flatMap((player) => [
      ...player.hand.map(getCardItemId),
      ...player.tuckedIncomeCards.map(getCardItemId),
    ]),
  ];
}

function getCardItemId(card: TCardItem): string {
  if (typeof card === 'string') {
    return card;
  }
  if (typeof card.id === 'string') {
    return card.id;
  }
  throw new Error('Expected setup card item to have an id');
}

function getSetupOrganizationOptions(
  player: Game['players'][number],
): EOrganizationId[] {
  const model = player.waitingFor?.toModel() as
    | ISelectOptionInputModel
    | undefined;
  return (model?.options ?? []).map((option) => option.id as EOrganizationId);
}

function chooseFirstOrganization(
  game: Game,
  playerId: string,
): EOrganizationId {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`expected player ${playerId}`);
  }
  const organizationId = getSetupOrganizationOptions(player)[0];
  game.processInput(playerId, {
    type: EPlayerInputType.OPTION,
    optionId: organizationId,
  });
  return organizationId;
}

function getCurrentSetupOptionIds(player: Game['players'][number]): string[] {
  const model = player.waitingFor?.toModel() as
    | ISelectOptionInputModel
    | undefined;
  return (model?.options ?? []).map((option) => option.id);
}

function chooseFirstQuickStartCards(
  game: Game,
  playerId: string,
  count = 2,
): string[] {
  const selected: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new Error(`expected player ${playerId}`);
    }
    const optionId = getCurrentSetupOptionIds(player)[0];
    selected.push(optionId);
    game.processInput(playerId, {
      type: EPlayerInputType.OPTION,
      optionId,
    });
  }
  return selected;
}

function sumLowerResource(
  cardIds: readonly string[],
  resource: EResource,
): number {
  return cardIds.reduce((total, cardId) => {
    const card = preludeCards.find((candidate) => candidate.id === cardId);
    return (
      total +
      (card?.lowerEffects ?? []).reduce((effectTotal, effect: Effect) => {
        if (
          effect.effectType !== EEffectType.BASE ||
          effect.type !== resource
        ) {
          return effectTotal;
        }
        return effectTotal + (effect.value ?? 1);
      }, 0)
    );
  }, 0);
}

function countNeutralSignals(game: Game): number {
  return game.sectors.reduce(
    (total, sector) =>
      total +
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === 'neutral',
      ).length,
    0,
  );
}

function countNeutralOrbiters(game: Game): number {
  return Array.from(game.planetaryBoard?.planets.values() ?? []).reduce(
    (total, planet) =>
      total +
      planet.orbitSlots.filter((slot) => slot.playerId === 'neutral').length,
    0,
  );
}

function countNeutralTraces(game: Game): number {
  return game.alienState.boards.reduce(
    (total, board) =>
      total +
      board
        .getTraceSlots()
        .reduce(
          (slotTotal, slot) =>
            slotTotal +
            slot.occupants.filter((occupant) => occupant.source === 'neutral')
              .length,
          0,
        ),
    0,
  );
}

function createSoloGame(soloDifficulty = 2, seed = 'seed-solo-random'): Game {
  return Game.create(
    [
      BASE_PLAYERS[0],
      {
        id: `rival:${seed}`,
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty,
    } as Parameters<typeof Game.create>[1],
    seed,
    seed,
  );
}

describe('GameSetup', () => {
  it('allows Space Agency games with agencies disabled', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createSpaceAgencyOptions(2, { agencies: false }),
      'space-agency-no-agencies',
    );

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.roundIndex).toBe(1);
    expect(game.endOfRoundStacks).toHaveLength(4);
    expect(game.players[0].publicity).toBe(4);
  });

  it('builds initial draw pool from base cards only', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-base-only',
    );

    expect([...collectInitialMainDeckCardIds(game)].sort()).toEqual(
      baseCards.map((card) => card.id).sort(),
    );
  });

  it('mixes Space Agency cards into the main deck only when newDeck is enabled', () => {
    const baseCardIds = baseCards.map((card) => card.id);
    const spaceAgencyCardIds = spaceAgencyCards.map((card) => card.id);

    const disabledGame = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createSpaceAgencyOptions(2, { agencies: false, newDeck: false }),
      'seed-sa-new-deck-disabled',
    );
    expect([...collectInitialMainDeckCardIds(disabledGame)].sort()).toEqual(
      [...baseCardIds].sort(),
    );

    const enabledGame = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createSpaceAgencyOptions(2, { agencies: false, newDeck: true }),
      'seed-sa-new-deck-enabled',
    );
    expect([...collectInitialMainDeckCardIds(enabledGame)].sort()).toEqual(
      [...baseCardIds, ...spaceAgencyCardIds].sort(),
    );
    expect(enabledGame.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('initializes 2-player setup values', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-2p',
    );

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.hiddenAliens).toHaveLength(2);
    expect(game.cardRow).toHaveLength(3);
    expect(game.endOfRoundStacks).toHaveLength(4);
    expect(game.endOfRoundStacks[0]).toHaveLength(3);
    expect(game.neutralMilestones).toEqual([20, 20, 30, 30]);
  });

  it('initializes 3-player and 4-player neutral milestones correctly', () => {
    const game3 = Game.create(
      BASE_PLAYERS.slice(0, 3),
      { playerCount: 3 },
      'seed-3p',
    );
    const game4 = Game.create(BASE_PLAYERS, { playerCount: 4 }, 'seed-4p');

    expect(game3.neutralMilestones).toEqual([20, 30]);
    expect(game4.neutralMilestones).toEqual([]);
  });

  it('assigns player defaults by seat and setup draw, then prompts tuck selection', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-setup',
    );

    expect(game.players[0].score).toBe(1);
    expect(game.players[1].score).toBe(2);
    expect(game.players[0].publicity).toBe(4);
    expect(game.players[0].resources.toObject()).toEqual({
      credits: 4,
      energy: 3,
      publicity: 4,
      data: 0,
      signalTokens: 0,
    });
    expect(game.players[0].hand).toHaveLength(5);
    expect(game.players[0].tuckedIncomeCards).toHaveLength(0);
    const tuckedIncome = game.players[0].income.tuckedCardIncome;
    const totalTuckedIncome = Object.values(tuckedIncome).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(totalTuckedIncome).toBe(0);
    expect(game.players[0].waitingFor?.toModel().type).toBe(
      EPlayerInputType.CARD,
    );
  });

  it('treats base corporation as a setup role without changing BASE output', () => {
    const setupRole: ISetupRole = BaseCorporation;
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-setup-role',
    );

    expect(setupRole.id).toBe('base-corporation');
    expect(game.players[0].publicity).toBe(4);
    expect(game.endOfRoundStacks).toHaveLength(4);
  });

  it('starts agencies games in setup choice with SA round and setup defaults', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createAgenciesOptions(2),
      'seed-agencies-setup-choice',
    );

    expect(game.phase).toBe(EPhase.SETUP_CHOICE);
    expect(game.roundIndex).toBe(2);
    expect(game.endOfRoundStacks).toHaveLength(3);
    expect(game.players[0].publicity).toBe(0);
    expect(game.players[0].pendingSetupTucks).toBe(0);
    expect(game.players[0].organizationIds).toEqual([]);
    expect(game.players[0].hand).toHaveLength(4);
    expect(game.players[0].waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      title: 'Choose organization',
    });
    expect(getSetupOrganizationOptions(game.players[0])).toHaveLength(2);
  });

  it('deals two deterministic organization candidates per agencies player', () => {
    const gameA = Game.create(
      BASE_PLAYERS.slice(0, 4),
      createAgenciesOptions(4),
      'seed-agencies-deterministic-deal',
    );
    const gameB = Game.create(
      BASE_PLAYERS.slice(0, 4),
      createAgenciesOptions(4),
      'seed-agencies-deterministic-deal',
    );

    const dealtA = gameA.players.map((player) =>
      getSetupOrganizationOptions(player),
    );
    const dealtB = gameB.players.map((player) =>
      getSetupOrganizationOptions(player),
    );

    expect(dealtA).toEqual(dealtB);
    expect(dealtA.every((candidates) => candidates.length === 2)).toBe(true);
    expect(new Set(dealtA.flat()).size).toBe(8);
  });

  it('rejects organization selections outside the player dealt candidates', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createAgenciesOptions(2),
      'seed-agencies-invalid-org',
    );
    const candidates = new Set(getSetupOrganizationOptions(game.players[0]));
    const missingOrganization = Object.values(EOrganizationId).find(
      (organizationId) => !candidates.has(organizationId),
    );
    if (!missingOrganization) {
      throw new Error('expected an organization outside the dealt candidates');
    }

    expect(() =>
      game.processInput('p1', {
        type: EPlayerInputType.OPTION,
        optionId: missingOrganization,
      }),
    ).toThrow('Unknown option id');
    expect(game.players[0].organizationIds).toEqual([]);
  });

  it('allows the supported Space Agency new alien species module', () => {
    expect(() =>
      Game.create(
        BASE_PLAYERS.slice(0, 2),
        {
          ...createAgenciesOptions(2, { newAlienSpecies: true }),
          alienModulesEnabled: {
            ...DEFAULT_ALIEN_MODULES_ENABLED,
            [EAlienType.GLYPHIDS]: true,
          },
        } as Parameters<typeof Game.create>[1],
        'seed-agencies-supported-new-aliens',
      ),
    ).not.toThrow();
  });

  it('can select Glyphids, Amoeba, and Arkhos when the Space Agency new-alien module is enabled', () => {
    const options = {
      ...createSpaceAgencyOptions(2, {
        agencies: false,
        newAlienSpecies: true,
      }),
      alienModulesEnabled: {
        ...DEFAULT_ALIEN_MODULES_ENABLED,
        [EAlienType.ANOMALIES]: false,
        [EAlienType.CENTAURIANS]: false,
        [EAlienType.EXERTIANS]: false,
        [EAlienType.GLYPHIDS]: true,
        [EAlienType.AMOEBA]: true,
        [EAlienType.ARKHOS]: true,
      },
    } as Parameters<typeof Game.create>[1];
    const observed = new Set<EAlienType>();

    for (let index = 0; index < 24; index += 1) {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        options,
        `space-agency-new-aliens-selected-${index}`,
      );
      for (const alienType of game.hiddenAliens) {
        observed.add(alienType);
      }
    }

    expect(observed).toContain(EAlienType.GLYPHIDS);
    expect(observed).toContain(EAlienType.AMOEBA);
    expect(observed).toContain(EAlienType.ARKHOS);
  });

  it('deals three quick start candidates and resolves two before organization setup', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createAgenciesOptions(2, { startResourceCards: true }),
      'seed-agencies-quick-start',
    );

    const p1OrganizationId = chooseFirstOrganization(game, 'p1');
    const p1QuickStartOptions = getCurrentSetupOptionIds(game.players[0]);
    expect(game.players[0].waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      title: 'Choose Quick Start Cards',
      setupChoice: {
        kind: ESetupChoiceStepKind.QUICK_START_CARDS,
        minSelections: 2,
        maxSelections: 2,
      },
    });
    expect(p1QuickStartOptions).toHaveLength(3);

    const p1QuickStartIds = chooseFirstQuickStartCards(game, 'p1');
    chooseFirstOrganization(game, 'p2');
    chooseFirstQuickStartCards(game, 'p2');

    const p1Organization = ORGANIZATIONS_BY_ID[p1OrganizationId];
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.players[0].quickStartCardIds).toEqual(p1QuickStartIds);
    expect(game.players[0].score).toBe(
      1 + sumLowerResource(p1QuickStartIds, EResource.SCORE),
    );
    expect(game.players[0].resources.toObject()).toMatchObject({
      credits:
        p1Organization.resources.credit +
        sumLowerResource(p1QuickStartIds, EResource.CREDIT),
      energy:
        p1Organization.resources.energy +
        sumLowerResource(p1QuickStartIds, EResource.ENERGY),
      publicity:
        p1Organization.resources.publicity +
        sumLowerResource(p1QuickStartIds, EResource.PUBLICITY),
      data:
        p1Organization.resources.data +
        sumLowerResource(p1QuickStartIds, EResource.DATA),
      signalTokens: sumLowerResource(p1QuickStartIds, EResource.SIGNAL_TOKEN),
    });
  });

  it('rejects quick start selections outside the player dealt candidates', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createAgenciesOptions(2, { startResourceCards: true }),
      'seed-agencies-invalid-quick-start',
    );
    chooseFirstOrganization(game, 'p1');
    const candidates = new Set(getCurrentSetupOptionIds(game.players[0]));
    const missingCard = preludeCards.find((card) => !candidates.has(card.id));
    if (!missingCard) {
      throw new Error('expected a Quick Start card outside dealt candidates');
    }

    expect(() =>
      game.processInput('p1', {
        type: EPlayerInputType.OPTION,
        optionId: missingCard.id,
      }),
    ).toThrow('Unknown option id');
    expect(game.players[0].quickStartCardIds).toEqual([]);
  });

  it('applies 1-2 player neutral Quick Start upper marks without lower rewards', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createAgenciesOptions(2, { startResourceCards: true }),
      'neutral-0',
    );

    expect(
      countNeutralSignals(game) +
        countNeutralOrbiters(game) +
        countNeutralTraces(game),
    ).toBe(5);
    expect(game.players[0].score).toBe(1);
    expect(game.players[1].score).toBe(2);
    expect(game.players[0].resources.toObject()).toEqual({
      credits: 0,
      energy: 0,
      publicity: 0,
      data: 0,
      signalTokens: 0,
    });
    expect(game.players[0].quickStartCardIds).toEqual([]);
  });

  it('resolves selected organizations after all players finish setup choice', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      createAgenciesOptions(2),
      'seed-agencies-resolve',
    );

    expect(() =>
      game.processMainAction(game.activePlayer.id, {
        type: EMainAction.PASS,
      }),
    ).toThrow(`Action not allowed during phase ${EPhase.SETUP_CHOICE}`);

    const p1OrganizationId = chooseFirstOrganization(game, 'p1');
    expect(game.phase).toBe(EPhase.SETUP_CHOICE);

    const p2OrganizationId = chooseFirstOrganization(game, 'p2');

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.players[0].organizationIds).toEqual([p1OrganizationId]);
    const p1Organization = ORGANIZATIONS_BY_ID[p1OrganizationId];
    expect(game.players[0].resources.toObject()).toMatchObject({
      credits: p1Organization.resources.credit,
      energy: p1Organization.resources.energy,
      publicity: p1Organization.resources.publicity,
    });
    expect(game.players[0].pendingSetupTucks).toBe(p1Organization.tuckIncome);
    if (p1Organization.tuckIncome > 0) {
      expect(game.players[0].waitingFor?.toModel().type).toBe(
        EPlayerInputType.CARD,
      );
    }
    expect(game.players[1].organizationIds).toEqual([p2OrganizationId]);
    expect(game.players[1].pendingSetupTucks).toBe(
      ORGANIZATIONS_BY_ID[p2OrganizationId].tuckIncome,
    );
  });

  it('initializes solo rival state without normal human setup resources', () => {
    const game = Game.create(
      [
        BASE_PLAYERS[0],
        {
          id: 'rival:solo-game',
          name: 'Rival Institution',
          color: 'blue',
          seatIndex: 1,
        },
      ],
      {
        playerCount: 2,
        isSoloMode: true,
        soloDifficulty: 3,
      } as Parameters<typeof Game.create>[1],
      'seed-solo-setup',
      'solo-game',
    );
    const rival = game.players[1];
    const rivalState = (
      game as Game & {
        rivalState?: {
          rivalPlayerId: string;
          difficulty: number;
          progress: number;
          progressSlot: number;
          boardConfigId: string;
          actionDeck: { getDrawPile: () => readonly string[] };
          computer: { filledSlots: boolean[]; dataPool: number };
        };
      }
    ).rivalState;

    expect(rivalState).toMatchObject({
      rivalPlayerId: 'rival:solo-game',
      difficulty: 3,
      progress: 12,
      progressSlot: 0,
      boardConfigId: 'rival-board-2',
      computer: {
        filledSlots: [false, false, false, false, false, false],
        dataPool: 0,
      },
    });
    expect(rivalState?.actionDeck.getDrawPile()).toHaveLength(5);
    expect(rival.resources.toObject()).toEqual({
      credits: 0,
      energy: 0,
      publicity: 4,
      data: 0,
      signalTokens: 0,
    });
    expect(rival.hand).toHaveLength(0);
    expect(rival.pendingSetupTucks).toBe(0);
    expect(rival.waitingFor).toBeUndefined();
  });

  it('builds the solo objective stack with level I on top, then level II, then level III', () => {
    const game = Game.create(
      [
        BASE_PLAYERS[0],
        {
          id: 'rival:solo-objectives',
          name: 'Rival Institution',
          color: 'blue',
          seatIndex: 1,
        },
      ],
      {
        playerCount: 2,
        isSoloMode: true,
        soloDifficulty: 2,
      } as Parameters<typeof Game.create>[1],
      'seed-solo-objectives',
      'solo-objectives',
    );
    const rivalState = game.rivalState;
    if (!rivalState) throw new Error('expected rival state');

    const level1Ids = new Set(RIVAL_OBJECTIVE_IDS_BY_LEVEL.level1);
    const level2Ids = new Set(RIVAL_OBJECTIVE_IDS_BY_LEVEL.level2);
    const level3Ids = new Set(RIVAL_OBJECTIVE_IDS_BY_LEVEL.level3);

    expect(rivalState.revealedObjectiveIds).toHaveLength(3);
    expect(
      rivalState.revealedObjectiveIds
        .slice(0, 2)
        .every((id) => level1Ids.has(id)),
    ).toBe(true);
    expect(level2Ids.has(rivalState.revealedObjectiveIds[2])).toBe(true);
    expect(
      rivalState.objectiveDrawPile.slice(0, 2).every((id) => level2Ids.has(id)),
    ).toBe(true);
    expect(
      rivalState.objectiveDrawPile.slice(-5).every((id) => level3Ids.has(id)),
    ).toBe(true);
  });

  it('samples solo objectives after shuffling each full level pool', () => {
    const seenLevel1Ids = new Set<string>();

    for (let index = 0; index < 20; index += 1) {
      const game = createSoloGame(2, `seed-solo-objective-sample-${index}`);
      const rivalState = game.rivalState;
      if (!rivalState) throw new Error('expected rival state');
      for (const objectiveId of [
        ...rivalState.revealedObjectiveIds,
        ...rivalState.objectiveDrawPile,
      ]) {
        if (RIVAL_OBJECTIVE_IDS_BY_LEVEL.level1.includes(objectiveId)) {
          seenLevel1Ids.add(objectiveId);
        }
      }
    }

    expect(seenLevel1Ids).toEqual(new Set(RIVAL_OBJECTIVE_IDS_BY_LEVEL.level1));
  });

  it('randomizes the solo starting player across seeds', () => {
    const starters = new Set<string>();

    for (let index = 0; index < 20; index += 1) {
      const game = createSoloGame(2, `solo-start-${index}`);
      starters.add(
        game.startPlayer.id.startsWith('rival:') ? 'rival' : 'human',
      );
    }

    expect(starters).toEqual(new Set(['human', 'rival']));
  });

  it('assigns 1 VP to the solo start player and 2 VP to the other player', () => {
    const game = createSoloGame(2, 'solo-start-score');
    const otherPlayer = game.players.find(
      (player) => player.id !== game.startPlayer.id,
    );

    expect(game.startPlayer.score).toBe(1);
    expect(otherPlayer?.score).toBe(2);
  });

  describe('shared board details', () => {
    it('1.1.1 builds exactly 8 sectors with unique sector ids', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-sectors',
      );

      expect(game.sectors).toHaveLength(8);
      const sectorIds = new Set(game.sectors.map((sector) => sector.id));
      expect(sectorIds.size).toBe(8);
      for (const sector of game.sectors) {
        expect(sector.dataSlotCapacity).toBeGreaterThanOrEqual(1);
        expect(sector.signals.length).toBe(sector.dataSlotCapacity);
        expect(sector.signals.every((s) => s.type === 'data')).toBe(true);
      }
    });

    it('1.1.2 hides exactly 2 distinct alien species from the non-DUMMY pool', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-aliens',
      );

      expect(game.hiddenAliens).toHaveLength(2);
      expect(new Set(game.hiddenAliens).size).toBe(2);
      expect(game.hiddenAliens).not.toContain(EAlienType.DUMMY);
    });

    it('1.1.2E selects random hidden aliens from enabled alien module pool', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        {
          playerCount: 2,
          alienModulesEnabled: {
            ...DEFAULT_ALIEN_MODULES_ENABLED,
            [EAlienType.CENTAURIANS]: false,
            [EAlienType.MASCAMITES]: false,
            [EAlienType.OUMUAMUA]: false,
          },
        },
        'seed-aliens-enabled-pool',
      );

      expect(game.hiddenAliens).toHaveLength(2);
      expect(new Set(game.hiddenAliens)).toEqual(
        new Set([EAlienType.ANOMALIES, EAlienType.EXERTIANS]),
      );
    });

    it('1.1.3 shuffles main deck and reveals exactly 3 cards to card row', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-card-row',
      );

      expect(game.cardRow).toHaveLength(3);
      const cardRowIds = new Set(game.cardRow);
      expect(cardRowIds.size).toBe(3);
      for (const cardId of game.cardRow) {
        expect(typeof cardId).toBe('string');
        if (typeof cardId === 'string') {
          expect(cardId.length).toBeGreaterThan(0);
        }
      }
    });

    it('1.1.4 fills each nearby star data slot completely with data tokens', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-data-slots',
      );

      expect(game.sectors).toHaveLength(8);
      for (const sector of game.sectors) {
        const dataCount = sector.signals.filter(
          (s) => s.type === 'data',
        ).length;
        expect(dataCount).toBe(sector.dataSlotCapacity);
        expect(sector.signals).toHaveLength(sector.dataSlotCapacity);
      }
    });

    it('1.1.7 builds 12 tech stacks, each with 4 tiles and a first-take VP bonus', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-tech',
      );

      if (game.techBoard === null) {
        throw new Error('Expected tech board to be initialized');
      }

      const expectedStackCount = TECH_CATEGORIES.length * TECH_LEVELS.length;
      expect(expectedStackCount).toBe(12);
      expect(game.techBoard.stacks.size).toBe(expectedStackCount);

      for (const stack of game.techBoard.stacks.values()) {
        expect(stack.tiles).toHaveLength(TILES_PER_STACK);
        expect(stack.firstTakeBonusAvailable).toBe(true);
      }
      expect(FIRST_TAKE_VP_BONUS).toBe(2);
    });

    it('1.1.8 builds 4 end-of-round stacks of size (playerCount + 1)', () => {
      const game2 = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-eor-2p',
      );
      const game3 = Game.create(
        BASE_PLAYERS.slice(0, 3),
        { playerCount: 3 },
        'seed-eor-3p',
      );
      const game4 = Game.create(
        BASE_PLAYERS,
        { playerCount: 4 },
        'seed-eor-4p',
      );

      for (const [game, expectedLen] of [
        [game2, 3],
        [game3, 4],
        [game4, 5],
      ] as const) {
        expect(game.endOfRoundStacks).toHaveLength(4);
        for (const stack of game.endOfRoundStacks) {
          expect(stack).toHaveLength(expectedLen);
        }
      }
    });

    it('1.1.9 starts with roundRotationReminderIndex at 0', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-rotation-reminder',
      );

      expect(game.roundRotationReminderIndex).toBe(0);
    });

    it('1.1.5 builds 4 gold scoring tiles with a randomly chosen A/B side', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-gold',
      );

      expect(game.goldScoringTiles).toHaveLength(4);
      for (const tile of game.goldScoringTiles) {
        expect(['A', 'B']).toContain(tile.side);
      }
    });

    it('1.2.4 assigns seat-order scores for 3- and 4-player games', () => {
      const game3 = Game.create(
        BASE_PLAYERS.slice(0, 3),
        { playerCount: 3 },
        'seed-scores-3p',
      );
      const game4 = Game.create(
        BASE_PLAYERS,
        { playerCount: 4 },
        'seed-scores-4p',
      );

      expect(game3.players.map((p) => p.score)).toEqual([1, 2, 3]);
      expect(game4.players.map((p) => p.score)).toEqual([1, 2, 3, 4]);
    });

    it('1.2.5 starting base income provides 3 credits, 2 energy, and 1 card per round', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-base-income',
      );

      for (const player of game.players) {
        const baseIncome = player.income.baseIncome;
        expect(baseIncome[EResource.CREDIT]).toBe(3);
        expect(baseIncome[EResource.ENERGY]).toBe(2);
        expect(baseIncome[EResource.CARD]).toBe(1);
      }
    });

    it('1.2.6 every player starts with publicity at 4', () => {
      const game = Game.create(
        BASE_PLAYERS.slice(0, 2),
        { playerCount: 2 },
        'seed-publicity',
      );

      for (const player of game.players) {
        expect(player.publicity).toBe(4);
      }
    });
  });
});
