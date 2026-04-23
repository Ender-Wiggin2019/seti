import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

// ─────────────────────────────────────────────────────────────
// §2.10  CardEffectsIntegration — exercise representative real
// cards through Game.processMainAction(PLAY_CARD) instead of the
// legacy single-card harnesses that mostly call card.execute()
// against hand-rolled IGame fakes.
//
// Goal: lock the "card → behavior → deferred → real engine" path
// so that any drift in BehaviorExecutor wiring is caught end-to-end.
// ─────────────────────────────────────────────────────────────

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame(seed: string): { game: Game; player: Player } {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const player = game.players.find((p) => p.id === 'p1') as Player;
  return { game, player };
}

function requireSolarSystem(game: Game): NonNullable<Game['solarSystem']> {
  if (!game.solarSystem) {
    throw new Error('expected solar system to be initialized');
  }
  return game.solarSystem;
}

function resolveFirstOptionUntilDone(game: Game, player: IPlayer): void {
  let safety = 0;
  while (player.waitingFor) {
    safety += 1;
    if (safety > 20) {
      throw new Error('input resolution loop did not converge within 20 steps');
    }
    const model = player.waitingFor.toModel() as {
      type: EPlayerInputType;
      options?: Array<{ id: string }>;
      cards?: Array<{ id: string }>;
      title?: string;
    };

    if (model.type === EPlayerInputType.OPTION) {
      const opts = model.options ?? [];
      const done = opts.find((o) => o.id === 'done');
      const skip = opts.find((o) => o.id === 'skip-missions');
      const pick = done?.id ?? skip?.id ?? opts[0]?.id;
      if (!pick) {
        throw new Error('option input had no options');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: pick,
      });
      continue;
    }

    if (model.type === EPlayerInputType.CARD) {
      const cards = model.cards ?? [];
      if (cards.length === 0) {
        throw new Error('card input had no cards');
      }
      game.processInput(player.id, {
        type: EPlayerInputType.CARD,
        cardIds: [cards[0].id],
      });
      continue;
    }

    break;
  }
}

describe('CardEffectsIntegration — representative cards through processMainAction(PLAY_CARD)', () => {
  describe('2.10.1 probe card grants LAUNCH without double-charging the action', () => {
    it('card 130 costs 1 credit, launches a probe, and does not charge the 2-credit launch fee', () => {
      const { game, player } = createGame('2-10-1-probe-card');
      player.hand = ['130'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '71'];
      const creditsBefore = player.resources.credits;
      const probesBefore = player.probesInSpace;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveFirstOptionUntilDone(game, player);

      game.processEndTurn(player.id);
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.probesInSpace).toBe(probesBefore + 1);
      expect(game.mainDeck.getDiscardPile()).toContain('130');
      expect(game.activePlayer.id).toBe('p2');
    });
  });

  describe('2.10.2 telescope card marks a real sector signal on the solar system', () => {
    it('card 55 plays SCAN + DESC and writes a player signal into sector index 0', () => {
      const { game, player } = createGame('2-10-2-telescope-card');
      player.hand = ['55'];
      game.mainDeck = new Deck(['refill-1', 'refill-2'], []);
      game.cardRow = ['50', '71', '110'];

      const firstSector = game.sectors[0];
      const mySignalsBefore = firstSector.signals.filter(
        (s) => s.type === 'player' && s.playerId === player.id,
      ).length;
      const creditsBefore = player.resources.credits;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveFirstOptionUntilDone(game, player);

      expect(player.resources.credits).toBe(creditsBefore - 3);
      const mySignalsAfter = firstSector.signals.filter(
        (s) => s.type === 'player' && s.playerId === player.id,
      ).length;
      expect(mySignalsAfter).toBeGreaterThan(mySignalsBefore);
    });
  });

  describe('2.10.3 resource card applies gain through the real ledger', () => {
    it('card 110 pays 1 credit and grants +3 publicity with no extra state drift', () => {
      const { game, player } = createGame('2-10-3-resource-card');
      player.hand = ['110'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '71'];
      const credits = player.resources.credits;
      const publicity = player.resources.publicity;
      const energy = player.resources.energy;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveFirstOptionUntilDone(game, player);

      expect(player.resources.credits).toBe(credits - 1);
      expect(player.resources.publicity).toBe(publicity + 3);
      expect(player.resources.energy).toBe(energy);
      expect(player.hand).toEqual([]);
    });
  });

  describe('2.10.3b oumuamua exofossil icon grants exofossils on play', () => {
    it('ET.26 pays card cost, launches, and gains 1 exofossil', () => {
      const { game, player } = createGame('2-10-3b-oumuamua-exofossil');
      player.hand = ['ET.26'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '71'];
      const creditsBefore = player.resources.credits;
      const exofossilsBefore = player.exofossils;
      const probesBefore = player.probesInSpace;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveFirstOptionUntilDone(game, player);

      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.exofossils).toBe(exofossilsBefore + 1);
      expect(player.probesInSpace).toBe(probesBefore + 1);
    });
  });

  describe('2.10.4 tech card triggers rotation and presents a real tech choice', () => {
    it('card 71 rotates the solar system and prompts tech selection with board-valid ids', () => {
      const { game, player } = createGame('2-10-4-tech-card');
      player.hand = ['71'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '110'];
      const solarSystem = requireSolarSystem(game);
      const rotationBefore = solarSystem.rotationCounter;
      const publicityBefore = player.resources.publicity;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      // A tech selection input is surfaced; we should NOT have been
      // charged the 6-publicity research cost (card-granted tech). The card
      // still rotates exactly once overall; its printed ROTATE covers the
      // research rotation for this effect.
      expect(player.resources.publicity).toBe(publicityBefore);
      expect(solarSystem.rotationCounter).toBe(rotationBefore + 1);
      expect(player.waitingFor).toBeDefined();
      const waitingFor = player.waitingFor;
      if (!waitingFor) {
        throw new Error('expected a pending tech-selection input');
      }
      const model = waitingFor.toModel() as ISelectOptionInputModel;
      expect(model.type).toBe(EPlayerInputType.OPTION);

      const techBoard = game.techBoard;
      if (!techBoard) {
        throw new Error('expected tech board to be initialized');
      }
      const available = techBoard.getAvailableTechs(player.id);
      for (const opt of model.options) {
        expect(available).toContain(opt.id);
      }

      // Picking a tech should actually acquire it.
      const pickedTechId = model.options[0].id;
      resolveFirstOptionUntilDone(game, player);
      expect(player.techs).toContain(pickedTechId);
    });
  });

  describe('2.10.5 multi-effect card runs every step in order', () => {
    it('card 109 gains energy, rotates, and routes into COMPUTER tech selection', () => {
      const { game, player } = createGame('2-10-5-multi-effect');
      player.hand = ['109'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '71'];
      const energyBefore = player.resources.energy;
      const solarSystem = requireSolarSystem(game);
      const rotationBefore = solarSystem.rotationCounter;

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });

      expect(player.resources.energy).toBe(energyBefore + 1);
      // Printed ROTATE + card-granted tech should still add only one total
      // rotation for the card resolution.
      expect(solarSystem.rotationCounter).toBe(rotationBefore + 1);

      // All options offered should be COMPUTER-tier techs.
      const waitingFor = player.waitingFor;
      if (!waitingFor) {
        throw new Error('expected a pending computer-tech input');
      }
      const model = waitingFor.toModel() as ISelectOptionInputModel;
      expect(model.type).toBe(EPlayerInputType.OPTION);
      expect(model.options.length).toBeGreaterThan(0);
      for (const opt of model.options) {
        expect(opt.id.startsWith('comp-')).toBe(true);
      }

      resolveFirstOptionUntilDone(game, player);
      game.processEndTurn(player.id);
      expect(player.techs.some((id) => id.startsWith('comp-'))).toBe(true);
      expect(game.activePlayer.id).toBe('p2');
    });
  });

  describe('2.10.6 ordinary cards go to discard, hand shrinks by one', () => {
    it('card 110 leaves the hand and lands on the discard pile', () => {
      const { game, player } = createGame('2-10-6-discard');
      player.hand = ['110', '55'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '71', '109'];

      game.processMainAction(player.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveFirstOptionUntilDone(game, player);

      expect(player.hand).toEqual(['55']);
      expect(game.mainDeck.getDiscardPile()).toContain('110');
    });
  });

  describe('2.10.7 hand-index validation', () => {
    it('out-of-range cardIndex throws without mutating the turn state', () => {
      const { game, player } = createGame('2-10-7-invalid-index');
      player.hand = ['110'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '71'];
      const before = [...player.hand];
      const phaseBefore = game.phase;
      const activeBefore = game.activePlayer.id;

      expect(() =>
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 5 },
        }),
      ).toThrow();
      expect(player.hand).toEqual(before);
      expect(game.phase).toBe(phaseBefore);
      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(game.activePlayer.id).toBe(activeBefore);
    });
  });

  describe('2.10.8 insufficient cost', () => {
    it('drains credits below 1 and rejects playing card 110', () => {
      const { game, player } = createGame('2-10-8-insufficient');
      player.hand = ['110'];
      game.mainDeck = new Deck(['refill-1'], []);
      game.cardRow = ['50', '55', '71'];
      player.resources.spend({ credits: player.resources.credits });
      const handBefore = [...player.hand];

      expect(() =>
        game.processMainAction(player.id, {
          type: EMainAction.PLAY_CARD,
          payload: { cardIndex: 0 },
        }),
      ).toThrow();
      expect(player.hand).toEqual(handBefore);
      expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
      expect(game.activePlayer.id).toBe('p1');
    });
  });
});
