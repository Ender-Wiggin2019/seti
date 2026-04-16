import { EResource } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

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

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3', 'd4', 'd5']),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('strategic-planning-test'),
    missionTracker: new MissionTracker(),
    solarSystem: { rotateNextDisc: () => 0 },
    techBoard: null,
    planetaryBoard: null,
    round: 1,
    ...overrides,
  } as unknown as IGame;
}

import { activateMission } from '../../../helpers/missionTestUtils.js';

describe('Card 106 — Strategic Planning (FULL_MISSION with credit-cost triggers)', () => {
  it('is registered as a MISSION card kind', () => {
    const card = getCardRegistry().create('106');
    expect(card.id).toBe('106');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });

  it('has no immediate behavior (pure mission card)', () => {
    const card = getCardRegistry().create('106');
    expect(card.behavior.gainResources).toBeUndefined();
    expect(card.behavior.gainScore).toBeUndefined();
    expect(card.behavior.drawCards).toBeUndefined();
    expect(card.behavior.launchProbe).toBeUndefined();
  });

  it('registers 3 FULL_MISSION branches upon registerMissionFromCard', () => {
    const player = createPlayer();
    const tracker = new MissionTracker();
    const game = createGame({ missionTracker: tracker });

    tracker.registerMissionFromCard('106', player.id);
    activateMission(player, '106');
    const state = tracker.getMissionState(player.id, '106');

    expect(state).toBeDefined();
    expect(state!.def.branches).toHaveLength(3);
    expect(state!.branchStates.every((s) => !s.completed)).toBe(true);
  });

  describe('branch 0 — play a 1-credit card → gain 2 score', () => {
    it('triggers when CARD_PLAYED with cost=1 credit', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeDefined();
      expect(prompt!.type).toBe(EPlayerInputType.OPTION);
    });

    it('grants 2 score when claimed', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });

      const initialScore = player.score;
      const prompt = tracker.checkAndPromptTriggers(player, game);
      prompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-0',
      } as never);

      expect(player.score).toBe(initialScore + 2);
      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[0].completed,
      ).toBe(true);
    });
  });

  describe('branch 1 — play a 2-credit card → gain 1 card', () => {
    it('triggers when CARD_PLAYED with cost=2 credit', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 2,
        costType: EResource.CREDIT,
      });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeDefined();
    });

    it('grants 1 card from deck when claimed', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 2,
        costType: EResource.CREDIT,
      });

      const initialHandSize = player.hand.length;
      const prompt = tracker.checkAndPromptTriggers(player, game);
      prompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-1',
      } as never);

      expect(player.hand.length).toBe(initialHandSize + 1);
      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[1].completed,
      ).toBe(true);
    });
  });

  describe('branch 2 — play a 3-credit card → gain 2 publicity', () => {
    it('triggers when CARD_PLAYED with cost=3 credit', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 3,
        costType: EResource.CREDIT,
      });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeDefined();
    });

    it('grants 2 publicity when claimed', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 3,
        costType: EResource.CREDIT,
      });

      const initialPublicity = player.resources.publicity;
      const prompt = tracker.checkAndPromptTriggers(player, game);
      prompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-2',
      } as never);

      expect(player.resources.publicity).toBe(initialPublicity + 2);
      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[2].completed,
      ).toBe(true);
    });
  });

  describe('non-matching events', () => {
    it('does not trigger for wrong credit cost (e.g. 4)', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 4,
        costType: EResource.CREDIT,
      });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeUndefined();
    });

    it('does not trigger for energy cost even if value matches', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.ENERGY,
      });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeUndefined();
    });

    it('does not trigger for non-CARD_PLAYED events', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({ type: EMissionEventType.PROBE_LAUNCHED });

      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeUndefined();
    });
  });

  describe('branch completion lifecycle', () => {
    it('allows branches to be completed in any order', () => {
      const player = createPlayer({ playedMissions: [] });
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 3,
        costType: EResource.CREDIT,
      });
      const prompt1 = tracker.checkAndPromptTriggers(player, game);
      prompt1!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-2',
      } as never);
      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[2].completed,
      ).toBe(true);

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });
      const prompt2 = tracker.checkAndPromptTriggers(player, game);
      prompt2!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-0',
      } as never);
      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[0].completed,
      ).toBe(true);

      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[1].completed,
      ).toBe(false);
    });

    it('does not re-trigger an already completed branch', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });
      const prompt1 = tracker.checkAndPromptTriggers(player, game);
      prompt1!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-0',
      } as never);

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });
      const prompt2 = tracker.checkAndPromptTriggers(player, game);
      expect(prompt2).toBeUndefined();
    });

    it('player can skip a triggered mission', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');
      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });

      const initialScore = player.score;
      const prompt = tracker.checkAndPromptTriggers(player, game);
      prompt!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'skip-missions',
      } as never);

      expect(player.score).toBe(initialScore);
      expect(
        tracker.getMissionState(player.id, '106')!.branchStates[0].completed,
      ).toBe(false);
    });

    it('completing all 3 branches marks mission fully complete', () => {
      const player = createPlayer({ playedMissions: [] });
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');

      for (const [idx, cost] of [1, 2, 3].entries()) {
        tracker.recordEvent({
          type: EMissionEventType.CARD_PLAYED,
          cost,
          costType: EResource.CREDIT,
        });

        const prompt = tracker.checkAndPromptTriggers(player, game);
        expect(prompt).toBeDefined();

        prompt!.process({
          type: EPlayerInputType.OPTION,
          optionId: `complete-106-${idx}`,
        } as never);
      }

      expect(tracker.getMissionState(player.id, '106')).toBeUndefined();
      expect(player.completedMissions).toHaveLength(1);
    });
  });

  describe('FULL_MISSION vs QUICK_MISSION semantics', () => {
    it('events before mission registration do not trigger branches', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });
      tracker.checkAndPromptTriggers(player, game);

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 2,
        costType: EResource.CREDIT,
      });
      const prompt = tracker.checkAndPromptTriggers(player, game);
      expect(prompt).toBeDefined();

      const state = tracker.getMissionState(player.id, '106')!;
      expect(state.branchStates[0].completed).toBe(false);
    });

    it('event buffer is cleared after each checkAndPromptTriggers call', () => {
      const player = createPlayer();
      const tracker = new MissionTracker();
      const game = createGame({ missionTracker: tracker });

      tracker.registerMissionFromCard('106', player.id);
      activateMission(player, '106');

      tracker.recordEvent({
        type: EMissionEventType.CARD_PLAYED,
        cost: 1,
        costType: EResource.CREDIT,
      });
      const prompt1 = tracker.checkAndPromptTriggers(player, game);
      expect(prompt1).toBeDefined();
      prompt1!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'skip-missions',
      } as never);

      const prompt2 = tracker.checkAndPromptTriggers(player, game);
      expect(prompt2).toBeUndefined();
    });
  });
});
