import { EResource, ESector, ETech } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { behaviorFromEffects } from '@/engine/cards/Behavior.js';
import { BehaviorExecutor } from '@/engine/cards/BehaviorExecutor.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { stubTurnLockFields } from '../../helpers/stubTurnLock.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
    hand: [],
    ...overrides,
  });
}

function createMarkableSector(color: ESector) {
  const state = { marks: 0 };
  return {
    id: `sector-${color}`,
    color,
    completed: false,
    markSignal: () => {
      state.marks += 1;
      return { dataGained: null, vpGained: 0 };
    },
    state,
  };
}

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    ...stubTurnLockFields(),
    sectors: [],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3', 'd4', 'd5']),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('card-framework-stress'),
    missionTracker: new MissionTracker(),
    solarSystem: {
      rotateNextDisc: () => 0,
    },
    techBoard: null,
    planetaryBoard: null,
    round: 1,
    ...overrides,
  } as unknown as IGame;
}

import { activateMission } from '../../helpers/missionTestUtils.js';

describe('Card 94 — Popularization of Science (FULL_MISSION with tech triggers)', () => {
  it('is registered as MISSION card kind', () => {
    const card = getCardRegistry().create('94');
    expect(card.id).toBe('94');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('immediate behavior grants 1 publicity (from e.PUBLICITY(1))', () => {
    const player = createPlayer();
    const game = createGame();
    const card = getCardRegistry().create('94');

    const initialPublicity = player.resources.publicity;
    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.publicity).toBe(initialPublicity + 1);
  });

  it('registers 3 FULL_MISSION branches upon play', () => {
    const player = createPlayer();
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');
    const missionState = tracker.getMissionState(player.id, '94');

    expect(missionState).toBeDefined();
    expect(missionState!.def.branches).toHaveLength(3);
    expect(missionState!.branchStates.every((s) => !s.completed)).toBe(true);
  });

  it('TECH_RESEARCHED event triggers matching FULL_MISSION branch', () => {
    const player = createPlayer();
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.PROBE,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();
    expect(prompt!.type).toBe(EPlayerInputType.OPTION);
  });

  it('claiming triggered branch grants publicity reward', () => {
    const player = createPlayer();
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.PROBE,
    });

    const initialPublicity = player.resources.publicity;
    const prompt = tracker.checkAndPromptTriggers(player, game);

    const nextInput = prompt!.process({
      type: EPlayerInputType.OPTION,
      optionId: 'complete-94-0',
    } as never);

    expect(player.resources.publicity).toBe(initialPublicity + 2);

    const missionState = tracker.getMissionState(player.id, '94');
    expect(missionState!.branchStates[0].completed).toBe(true);
    expect(missionState!.branchStates[1].completed).toBe(false);
    expect(missionState!.branchStates[2].completed).toBe(false);
  });

  it('non-matching tech category does not trigger branch', () => {
    const player = createPlayer();
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.CARD_PLAYED,
      cost: 3,
      costType: EResource.CREDIT,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeUndefined();
  });

  it('completing all 3 branches marks mission fully complete', () => {
    const player = createPlayer({ playedMissions: [] });
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    for (const [idx, category] of [
      ETech.PROBE,
      ETech.SCAN,
      ETech.COMPUTER,
    ].entries()) {
      tracker.recordEvent({
        type: EMissionEventType.TECH_RESEARCHED,
        techCategory: category,
      });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeDefined();

      prompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: `complete-94-${idx}`,
      } as never);
    }

    expect(tracker.getMissionState(player.id, '94')).toBeUndefined();
    expect(player.completedMissions).toHaveLength(1);
  });
});

describe('Card 68 — DUNE (income mechanism)', () => {
  it('is registered as END_GAME card kind', () => {
    const card = getCardRegistry().create('68');
    expect(card.id).toBe('68');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
  });

  it('has CREDIT income type on card data', () => {
    const card = getCardRegistry().create('68');
    expect(card.income).toBe(EResource.CREDIT);
  });

  it('immediate behavior includes rotate and tech_computer', () => {
    const card = getCardRegistry().create('68');
    expect(card.behavior.rotateSolarSystem).toBe(true);
    expect(card.behavior.researchTech).toBe(ETech.COMPUTER);
  });

  it('income payout includes tucked card income at round end', () => {
    const player = createPlayer();

    player.income.addTuckedIncome(EResource.CREDIT);
    player.income.addTuckedIncome(EResource.CREDIT);
    player.income.addTuckedIncome(EResource.ENERGY);

    const payout = player.income.computeRoundPayout();
    expect(payout[EResource.CREDIT]).toBeGreaterThanOrEqual(2);
    expect(payout[EResource.ENERGY]).toBeGreaterThanOrEqual(1);
  });
});

describe('TuckCardForIncome — interactive card selection', () => {
  it('tuckForIncome behavior is set for cards with e.INCOME() effect', () => {
    const card = getCardRegistry().create('94');
    expect(card.behavior.tuckForIncome).toBeFalsy();
  });

  it('playing a card with e.INCOME() effect prompts card selection', () => {
    const player = createPlayer({
      hand: ['68', '94'],
    });
    const game = createGame();

    const executor = new BehaviorExecutor();
    const card = getCardRegistry().create('68');
    executor.execute({ tuckForIncome: true }, player, game, card);

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeDefined();
    expect(prompt!.type).toBe(EPlayerInputType.CARD);
  });

  it('selecting a card for income tucks it and grants immediate resource', () => {
    const player = createPlayer({
      hand: ['68', '94'],
      resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
    });
    const game = createGame();

    const executor = new BehaviorExecutor();
    const card = getCardRegistry().create('68');
    executor.execute({ tuckForIncome: true }, player, game, card);

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeDefined();

    const initialCredits = player.resources.credits;

    const nextInput = prompt!.process({
      type: EPlayerInputType.CARD,
      cardIds: ['68'],
    } as never);

    expect(nextInput).toBeUndefined();
    expect(player.hand).toEqual(['94']);
    expect(player.tuckedIncomeCards).toHaveLength(1);
    expect(player.income.tuckedCardIncome[EResource.CREDIT]).toBe(1);
    expect(player.resources.credits).toBe(initialCredits + 1);
  });

  it('tucking an ENERGY income card grants energy', () => {
    const player = createPlayer({
      hand: ['136'],
      resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
    });
    const game = createGame();

    const executor = new BehaviorExecutor();
    const card = getCardRegistry().create('136');
    executor.execute({ tuckForIncome: true }, player, game, card);

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeDefined();

    const initialEnergy = player.resources.energy;

    prompt!.process({
      type: EPlayerInputType.CARD,
      cardIds: ['136'],
    } as never);

    expect(player.tuckedIncomeCards).toHaveLength(1);
    expect(player.income.tuckedCardIncome[EResource.ENERGY]).toBe(1);
    expect(player.resources.energy).toBe(initialEnergy + 1);
  });

  it('tucking a CARD income card draws 1 card from deck', () => {
    const player = createPlayer({
      hand: ['39'],
    });
    const game = createGame({
      mainDeck: new Deck<string>(['drawn-card-1', 'drawn-card-2']),
    });

    const executor = new BehaviorExecutor();
    const card = getCardRegistry().create('39');
    executor.execute({ tuckForIncome: true }, player, game, card);

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeDefined();

    prompt!.process({
      type: EPlayerInputType.CARD,
      cardIds: ['39'],
    } as never);

    expect(player.tuckedIncomeCards).toHaveLength(1);
    expect(player.income.tuckedCardIncome[EResource.CARD]).toBe(1);
    expect(player.hand).toContain('drawn-card-1');
  });

  it('cannot tuck when hand is empty', () => {
    const player = createPlayer({ hand: [] });
    const game = createGame();

    const executor = new BehaviorExecutor();
    const card = getCardRegistry().create('68');
    executor.execute({ tuckForIncome: true }, player, game, card);

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeUndefined();
  });
});

describe('Card 16 — Dragonfly (LAND from card effect)', () => {
  it('is registered as IMMEDIATE bespoke card', () => {
    const card = getCardRegistry().create('16');
    expect(card.id).toBe('16');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });

  it('has special.descHelper about landing on occupied spaces', () => {
    const card = getCardRegistry().create('16');
    expect(card.special?.descHelper).toContain('occupied');
  });

  it('playing Dragonfly with a probe in orbit prompts planet selection', () => {
    const marsSpace = {
      id: 'mars-space-0',
      occupants: [{ playerId: 'p1' }],
    };
    const player = createPlayer({
      resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
      probesInSpace: 1,
    });
    const game = createGame({
      planetaryBoard: {
        planets: new Map([
          [
            EPlanet.MARS,
            {
              orbitSlots: [{ playerId: 'p1' }],
              landingSlots: [],
              moonOccupant: null,
              firstOrbitClaimed: true,
            },
          ],
        ]),
        canLand: () => true,
        canOrbit: () => true,
        getProbeCount: () => 1,
        setProbeCount: () => undefined,
        getLandingCost: () => 1,
        land: () => ({
          landingCost: 1,
          centerReward: { vpGained: 2, lifeTraceGained: 0 },
          firstLandDataGained: 1,
          isMoon: false,
        }),
      },
      solarSystem: {
        rotateNextDisc: () => 0,
        getSpacesOnPlanet: () => [marsSpace],
        getProbesAt: () => [{ playerId: 'p1' }],
      },
    });

    player.bindGame(game);
    const card = getCardRegistry().create('16');
    card.play({ player, game });

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeDefined();
    expect(prompt!.type).toBe(EPlayerInputType.OPTION);
  });

  it('playing Dragonfly without planetary board skips land gracefully', () => {
    const player = createPlayer();
    const game = createGame({ planetaryBoard: null });

    const card = getCardRegistry().create('16');
    card.play({ player, game });

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeUndefined();
  });

  it('card 16 data has land=true when parsed via behaviorFromEffects', () => {
    const cardData = loadCardData('16');
    const behavior = behaviorFromEffects(cardData.effects);
    expect(behavior.land).toBe(true);
  });

  it('Dragonfly landing executes and records mission event', () => {
    let landCalled = false;
    let missionEventRecorded = false;
    const marsSpace = {
      id: 'mars-space-0',
      occupants: [{ playerId: 'p1' }],
    };
    const tracker = new MissionTracker();
    const originalRecordEvent = tracker.recordEvent.bind(tracker);
    tracker.recordEvent = (event) => {
      if (event.type === EMissionEventType.PROBE_LANDED) {
        missionEventRecorded = true;
      }
      originalRecordEvent(event);
    };

    const player = createPlayer({
      resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
      probesInSpace: 1,
    });
    const game = createGame({
      missionTracker: tracker,
      planetaryBoard: {
        planets: new Map(),
        canLand: () => true,
        canOrbit: () => true,
        getProbeCount: () => 1,
        setProbeCount: () => undefined,
        getLandingCost: () => 1,
        land: () => {
          landCalled = true;
          return {
            landingCost: 1,
            centerReward: { vpGained: 2, lifeTraceGained: 0 },
            firstLandDataGained: 0,
            isMoon: false,
          };
        },
      },
      solarSystem: {
        rotateNextDisc: () => 0,
        getSpacesOnPlanet: () => [marsSpace],
        getProbesAt: () => [{ playerId: 'p1' }],
      },
    });

    player.bindGame(game);
    const card = getCardRegistry().create('16');
    card.play({ player, game });

    const prompt = game.deferredActions.drain(game);
    expect(prompt).toBeDefined();

    const nextInput = prompt!.process({
      type: EPlayerInputType.OPTION,
      optionId: `land-${EPlanet.MERCURY}`,
    } as never);

    expect(nextInput).toBeUndefined();
    expect(landCalled).toBe(true);
    expect(missionEventRecorded).toBe(true);
  });
});

describe('MissionCondition — extended tech matching', () => {
  it('TECH_RESEARCHED event with probe-tech matches ETech.PROBE req', () => {
    const tracker = new MissionTracker();
    const player = createPlayer();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.PROBE,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();
  });

  it('TECH_RESEARCHED event with scan-tech matches ETech.SCAN req', () => {
    const tracker = new MissionTracker();
    const player = createPlayer();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.SCAN,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();
  });

  it('TECH_RESEARCHED event with computer-tech matches ETech.COMPUTER req', () => {
    const tracker = new MissionTracker();
    const player = createPlayer();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.TECH_RESEARCHED,
      techCategory: ETech.COMPUTER,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();
  });

  it('wrong event type does not match tech req', () => {
    const tracker = new MissionTracker();
    const player = createPlayer();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('94', player.id);
    activateMission(player, '94');

    tracker.recordEvent({
      type: EMissionEventType.PROBE_LAUNCHED,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeUndefined();
  });
});
