import {
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { GameError } from '@/shared/errors/GameError.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolveCardId(card: string | { id?: string }): string | undefined {
  return typeof card === 'string' ? card : card.id;
}

function createIntegrationGame(seed: string) {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players.find((candidate) => candidate.id === 'p1');
  if (!player) {
    throw new Error('p1 not found');
  }
  return { game, player: player as Player };
}

/**
 * Drain the prompts that a PASS action can surface for the given player
 * (typically `other`): first a CARD-discard prompt if the hand exceeds
 * the 4-card limit, then the END_OF_ROUND card pick.
 *
 * Unlike the initial implementation, this helper keeps looping while a
 * prompt is pending so intermediate CARD-discard prompts don't leave the
 * game stuck (which otherwise stalls the main-action hand-off back to
 * `p1` and breaks the 2.6.11 mission-completion flow).
 */
function resolveEndOfRoundPickIfAny(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) return;

  while (player.waitingFor) {
    const model = player.waitingFor.toModel() as {
      type: EPlayerInputType;
      cards?: Array<{ id: string }>;
    };

    if (model.type === EPlayerInputType.CARD) {
      // Discard-down-to-4 prompt emitted by PassAction. Pick the first
      // available card ID to satisfy it; the helper is deliberately
      // opinion-free about which card goes.
      const firstCardId = model.cards?.[0]?.id;
      if (!firstCardId) {
        throw new Error('expected card input to have at least one card');
      }
      game.processInput(playerId, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });
      continue;
    }

    if (model.type === EPlayerInputType.END_OF_ROUND) {
      const picker = model as unknown as ISelectEndOfRoundCardInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: picker.cards[0].id,
      });
      continue;
    }

    // Unknown prompt type: stop to avoid masking real test failures.
    return;
  }
}

function resolveInputsUntilMissionPromptOrDone(
  game: Game,
  player: Player,
): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel() as {
      type: string;
      title?: string;
      cards?: Array<{ id: string }>;
      options?: Array<{ id: string }>;
    };

    if (model.title === 'Mission triggered! Claim reward?') {
      return;
    }

    if (model.type === EPlayerInputType.CARD) {
      const cardId = model.cards?.[0]?.id;
      if (!cardId) {
        throw new Error('expected card input');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.CARD,
        cardIds: [cardId],
      });
      continue;
    }

    if (model.type === EPlayerInputType.OPTION) {
      const optionId = model.options?.[0]?.id;
      if (!optionId) {
        throw new Error('expected option input');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId,
      });
      continue;
    }

    return;
  }
}

function resolveUntilMissionPrompt(game: Game, player: Player): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel() as {
      type: string;
      title?: string;
      options?: Array<{ id: string }>;
      cards?: Array<{ id: string }>;
    };

    if (model.title === 'Mission triggered! Claim reward?') {
      return;
    }

    if (model.type === EPlayerInputType.OPTION) {
      const doneOption = model.options?.find((option) => option.id === 'done');
      const selectedOptionId = doneOption?.id ?? model.options?.[0]?.id;
      if (!selectedOptionId) {
        throw new Error('expected option input to have at least one option');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: selectedOptionId,
      });
      continue;
    }

    if (model.type === EPlayerInputType.CARD) {
      const firstCardId = model.cards?.[0]?.id;
      if (!firstCardId) {
        throw new Error('expected card input to have at least one card');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });
      continue;
    }

    throw new Error(
      `unsupported input type while resolving test flow: ${model.type}`,
    );
  }
}

describe('PlayCardAction — integration', () => {
  describe('execute', () => {
    it('integration: ordinary immediate cards pay their own cost, apply their effect, and go to discard', () => {
      const { game, player } = createIntegrationGame(
        'play-card-ordinary-immediate',
      );
      player.hand = ['110'];
      game.mainDeck = new Deck(['row-1', 'row-2'], ['old-discard']);
      game.cardRow = ['50', '55', '71'];
      const creditsBefore = player.resources.credits;
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      game.processEndTurn(player.id);
      expect(player.hand).toEqual([]);
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.publicity).toBe(publicityBefore + 3);
      expect(game.mainDeck.getDiscardPile()).toEqual(['old-discard', '110']);
      expect(game.activePlayer.id).toBe('p2');
    });

    it('integration: launch-effect cards do not charge the normal launch action cost', () => {
      const { game, player } = createIntegrationGame(
        'play-card-launch-no-extra-cost',
      );
      player.hand = ['130'];
      player.resources.spend({
        credits: player.resources.credits - 1,
        energy: player.resources.energy,
      });
      game.mainDeck = new Deck(['row-1'], []);
      game.cardRow = ['50', '55', '71'];
      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;
      const probesBefore = player.probesInSpace;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      game.processEndTurn(player.id);
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(energyBefore);
      expect(player.probesInSpace).toBe(probesBefore + 1);
      expect(game.mainDeck.getDiscardPile()).toEqual(['130']);
      expect(game.activePlayer.id).toBe('p2');
    });

    it('integration: Centaurian alien cards spend energy instead of credits', () => {
      const { game, player } = createIntegrationGame(
        'play-card-centaurian-energy-cost',
      );
      player.hand = ['ET.31'];
      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.resources.credits).toBe(creditsBefore);
      expect(player.resources.energy).toBe(energyBefore - 1);
      expect(player.playedMissions.map(resolveCardId)).not.toContain('ET.31');
      expect(player.endGameCards.map(resolveCardId)).not.toContain('ET.31');
      expect(player.hand).not.toContain('ET.31');
    });

    it('integration: insufficient resources rejects the play without mutating turn state', () => {
      const { game, player } = createIntegrationGame(
        'play-card-insufficient-resources',
      );
      player.hand = ['110'];
      player.resources.spend({ credits: player.resources.credits });
      const handBefore = [...player.hand];
      const activePlayerBefore = game.activePlayer.id;
      const phaseBefore = game.phase;
      const eventsBefore = game.eventLog.size();

      expect(() =>
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0 },
        }),
      ).toThrow();

      expect(player.hand).toEqual(handBefore);
      expect(game.activePlayer.id).toBe(activePlayerBefore);
      expect(game.phase).toBe(phaseBefore);
      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(game.eventLog.size()).toBe(eventsBefore);
    });

    it('integration: an already-satisfied quick mission prompts complete-or-skip before handoff', () => {
      const { game, player } = createIntegrationGame(
        'play-card-quick-mission-prompt',
      );
      player.hand = ['51'];
      player.resources.gain({ publicity: 4 });
      game.mainDeck = new Deck(['refill-1', 'reward-card'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      resolveUntilMissionPrompt(game, player);

      const missionPrompt = player.waitingFor?.toModel() as {
        type: string;
        title?: string;
        options?: Array<{ id: string }>;
      };

      expect(game.activePlayer.id).toBe('p1');
      expect(missionPrompt.type).toBe(EPlayerInputType.OPTION);
      expect(missionPrompt.title).toBe('Mission triggered! Claim reward?');
      expect(
        missionPrompt.options?.some((option) => option.id === 'complete-51-0'),
      ).toBe(true);
      expect(
        missionPrompt.options?.some((option) => option.id === 'skip-missions'),
      ).toBe(true);
    });

    it('2.6.5 completes an already-satisfied quick mission immediately from the play-card prompt', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-5-complete-quick-mission-immediately',
      );
      player.hand = ['51'];
      player.resources.gain({ publicity: 4 });
      game.mainDeck = new Deck(['refill-1', 'reward-card'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveUntilMissionPrompt(game, player);

      const scoreBeforeCompletion = player.score;
      const handBeforeCompletion = player.hand.length;
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'complete-51-0',
      });

      expect(player.playedMissions.map(resolveCardId)).not.toContain('51');
      expect(player.completedMissions.map(resolveCardId)).toContain('51');
      expect(
        game.missionTracker.getMissionState(player.id, '51'),
      ).toBeUndefined();
      expect(player.score).toBe(scoreBeforeCompletion + 3);
      expect(player.hand).toHaveLength(handBeforeCompletion + 1);
      expect(game.activePlayer.id).toBe(player.id);
      expect(game.phase).toBe(EPhase.AWAIT_END_TURN);
    });

    it('2.6.6 keeps an already-satisfied quick mission completable after the player skips the play-card prompt', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-6-defer-quick-mission-completion',
      );
      const other = game.players.find((p) => p.id !== player.id) as Player;
      player.hand = ['51'];
      player.resources.gain({ publicity: 4 });
      game.mainDeck = new Deck(
        ['refill-1', 'refill-2', 'reward-card', 'later-reward'],
        [],
      );

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveUntilMissionPrompt(game, player);

      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'skip-missions',
      });

      expect(player.playedMissions.map(resolveCardId)).toContain('51');
      expect(player.completedMissions.map(resolveCardId)).not.toContain('51');
      expect(
        game.missionTracker.getMissionState(player.id, '51'),
      ).toBeDefined();
      expect(game.phase).toBe(EPhase.AWAIT_END_TURN);

      game.processEndTurn(player.id);
      game.processMainAction(other.id, { type: EMainAction.PASS });
      resolveEndOfRoundPickIfAny(game, other.id);
      expect(game.activePlayer.id).toBe(player.id);

      const scoreBeforeCompletion = player.score;
      const handBeforeCompletion = player.hand.length;
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '51',
      });

      expect(player.playedMissions.map(resolveCardId)).not.toContain('51');
      expect(player.completedMissions.map(resolveCardId)).toContain('51');
      expect(
        game.missionTracker.getMissionState(player.id, '51'),
      ).toBeUndefined();
      expect(player.score).toBe(scoreBeforeCompletion + 3);
      expect(player.hand).toHaveLength(handBeforeCompletion + 1);
    });

    it('integration: a full mission card does not trigger from its own play event', () => {
      const { game, player } = createIntegrationGame(
        'play-card-full-mission-self-trigger',
      );
      player.hand = ['106'];
      game.mainDeck = new Deck(['refill-1'], []);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.waitingFor).toBeUndefined();
      game.processEndTurn(player.id);
      expect(game.activePlayer.id).toBe('p2');
      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(
        game.missionTracker.getMissionState(player.id, '106'),
      ).toBeDefined();
      expect(player.playedMissions).toHaveLength(1);
    });

    it('2.6.4 a played end-game scoring card stays in front of the player and is not discarded', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-4-endgame-in-front',
      );
      player.hand = ['127'];
      game.mainDeck = new Deck(['refill-1'], []);
      const discardBefore = [...game.mainDeck.getDiscardPile()];
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.hand).not.toContain('127');
      expect(player.endGameCards.map(resolveCardId)).toContain('127');
      expect(game.mainDeck.getDiscardPile()).toEqual(discardBefore);
      expect(game.mainDeck.getDiscardPile()).not.toContain('127');
      // Immediate effects still fire before the card is filed away.
      expect(player.resources.publicity).toBe(publicityBefore + 2);
    });

    it('2.6.10 one DISPLAY_CARD effect placing two signals offers only one Control Center branch until the next trigger', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-10-single-signal-mission-stamp',
      );
      const other = game.players.find((p) => p.id !== player.id) as Player;
      player.hand = ['116', '45'];
      player.resources.gain({ credits: 10 });
      game.mainDeck = new Deck(['refill-1', 'refill-2', 'refill-3'], []);
      game.cardRow = ['55', '129'];

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      game.processEndTurn(player.id);
      game.processMainAction(other.id, { type: EMainAction.PASS });
      resolveEndOfRoundPickIfAny(game, other.id);

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveInputsUntilMissionPromptOrDone(game, player);

      const state = game.missionTracker.getMissionState(player.id, '116');
      expect(state?.branchStates.every((b) => !b.completed)).toBe(true);

      const prompt = player.waitingFor?.toModel() as {
        title?: string;
        options?: Array<{ id: string }>;
      };
      expect(prompt?.title).toBe('Mission triggered! Claim reward?');
      const controlCenterOptions =
        prompt?.options?.filter((o) => o.id.startsWith('complete-116')) ?? [];
      expect(controlCenterOptions).toHaveLength(1);
    });

    it('2.6E.1 rejects PLAY_CARD when declared cardId does not match the hand slot (stale client selection)', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6e-1-declared-card-mismatch',
      );
      player.hand = ['110', '50'];
      game.mainDeck = new Deck(['refill-1'], []);

      expect(() =>
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0, cardId: '50' },
        }),
      ).toThrow(GameError);

      try {
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0, cardId: '50' },
        });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.INVALID_ACTION);
      }
    });

    it('2.6E.3 a card discarded via the free-action corner cannot also be played as a main action the same turn', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6e-3-no-double-dip',
      );
      player.hand = ['110'];
      game.mainDeck = new Deck(['refill-1'], []);
      const creditsBefore = player.resources.credits;

      // Step 1: consume card '110' as a free-action corner discard.
      game.processFreeAction(player.id, {
        type: EFreeAction.USE_CARD_CORNER,
        cardId: '110',
      });
      expect(player.hand).not.toContain('110');
      expect(game.mainDeck.getDiscardPile()).toContain('110');
      expect(game.activePlayer.id).toBe(player.id);

      // Step 2: attempt to also play the same card as a main action → rejected,
      // because it has already left the hand. No credit spent on the second try.
      expect(() =>
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0 },
        }),
      ).toThrow();
      expect(player.resources.credits).toBe(creditsBefore);
      expect(game.activePlayer.id).toBe(player.id);
    });

    it('2.6.8/2.6.9 a trigger mission registered earlier stamps exactly one circle on a later matching CARD_PLAYED', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-8-trigger-mission',
      );
      const other = game.players.find((p) => p.id !== player.id) as Player;
      player.hand = ['106', '110'];
      game.mainDeck = new Deck(['refill-1', 'refill-2', 'refill-3'], []);
      game.cardRow = ['50', '55', '71'];

      // Step 1: register the trigger mission via real main action.
      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      expect(player.playedMissions.map(resolveCardId)).toEqual(['106']);
      game.processEndTurn(player.id);
      expect(game.activePlayer.id).toBe(other.id);

      // Step 2: other player passes so p1 regains the turn within the same round.
      game.processMainAction(other.id, { type: EMainAction.PASS });
      resolveEndOfRoundPickIfAny(game, other.id);
      expect(game.activePlayer.id).toBe(player.id);

      const scoreBefore = player.score;

      // Step 3: play a 1-credit card → CARD_PLAYED event matches branch 0 only.
      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      const promptModel = player.waitingFor?.toModel() as {
        type: EPlayerInputType;
        title?: string;
        options: Array<{ id: string }>;
      };
      expect(promptModel.type).toBe(EPlayerInputType.OPTION);
      expect(promptModel.title).toBe('Mission triggered! Claim reward?');
      const optionIds = promptModel.options.map((o) => o.id);
      expect(optionIds).toContain('complete-106-0');
      expect(optionIds).toContain('skip-missions');
      // 2.6.9 guard: only branch 0 is offered — branches 1 and 2 do not stamp
      // from the same single CARD_PLAYED(cost=1) event.
      expect(optionIds).not.toContain('complete-106-1');
      expect(optionIds).not.toContain('complete-106-2');

      // Step 4: claim the reward → branch 0 completes, rest remain open.
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'complete-106-0',
      });

      const missionState = game.missionTracker.getMissionState(
        player.id,
        '106',
      );
      expect(missionState).toBeDefined();
      expect(missionState?.branchStates[0].completed).toBe(true);
      expect(missionState?.branchStates[1].completed).toBe(false);
      expect(missionState?.branchStates[2].completed).toBe(false);
      expect(player.playedMissions.map(resolveCardId)).toContain('106');
      expect(player.score).toBe(scoreBefore + 2);
    });

    it('2.6.3 a played mission card stays in front of the player and is not discarded', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-3-mission-in-front',
      );
      player.hand = ['106'];
      game.mainDeck = new Deck(['refill-1'], []);
      const discardBefore = [...game.mainDeck.getDiscardPile()];

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.hand).not.toContain('106');
      expect(player.playedMissions.map(resolveCardId)).toContain('106');
      expect(game.mainDeck.getDiscardPile()).toEqual(discardBefore);
      expect(game.mainDeck.getDiscardPile()).not.toContain('106');
    });

    it('2.6.11 completing the final trigger branch moves the mission to completedMissions automatically', () => {
      const { game, player } = createIntegrationGame(
        'play-card-2-6-11-auto-complete',
      );
      const other = game.players.find((p) => p.id !== player.id) as Player;
      player.hand = ['106', '110', '29', '91'];
      player.resources.gain({ credits: 10 });
      game.mainDeck = new Deck(
        ['refill-1', 'refill-2', 'refill-3', 'refill-4'],
        [],
      );
      game.cardRow = ['50', '55', '71'];

      const handBackToPlayer = () => {
        if (game.activePlayer.id === other.id) {
          game.processMainAction(other.id, { type: EMainAction.PASS });
          resolveEndOfRoundPickIfAny(game, other.id);
        }
        expect(game.activePlayer.id).toBe(player.id);
      };

      const playTriggerCardAndClaim = (expectedOptionId: string) => {
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0 },
        });

        resolveUntilMissionPrompt(game, player);
        const promptModel = player.waitingFor?.toModel() as {
          type: EPlayerInputType;
          title?: string;
          options: Array<{ id: string }>;
        };
        expect(promptModel.title).toBe('Mission triggered! Claim reward?');
        expect(
          promptModel.options.some((option) => option.id === expectedOptionId),
        ).toBe(true);

        game.processInput(player.id, {
          type: EPlayerInputType.OPTION,
          optionId: expectedOptionId,
        });
        game.processEndTurn(player.id);
      };

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      expect(player.playedMissions.map(resolveCardId)).toContain('106');
      game.processEndTurn(player.id);

      handBackToPlayer();
      playTriggerCardAndClaim('complete-106-0');
      expect(player.playedMissions.map(resolveCardId)).toContain('106');

      handBackToPlayer();
      playTriggerCardAndClaim('complete-106-1');
      expect(player.playedMissions.map(resolveCardId)).toContain('106');

      handBackToPlayer();
      playTriggerCardAndClaim('complete-106-2');

      expect(player.playedMissions.map(resolveCardId)).not.toContain('106');
      expect(player.completedMissions.map(resolveCardId)).toContain('106');
      expect(
        game.missionTracker.getMissionState(player.id, '106'),
      ).toBeUndefined();
    });
  });
});
