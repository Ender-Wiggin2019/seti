import { EResource, ETech, ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { IBehavior } from '@/engine/cards/Behavior.js';
import {
  BehaviorExecutor,
  getBehaviorExecutor,
} from '@/engine/cards/BehaviorExecutor.js';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import type { ICard } from '@/engine/cards/ICard.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { discoverOumuamua } from '../../helpers/OumuamuaTestUtils.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed = 'behavior-executor-integration'): {
  game: Game;
  player: Player;
} {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  const player = game.players.find((p) => p.id === 'p1') as Player;
  return { game, player };
}

function drain(game: IGame) {
  return game.deferredActions.drain(game);
}

function requireSolarSystem(game: Game | IGame) {
  if (!game.solarSystem) {
    throw new Error('expected solar system to be initialized');
  }
  return game.solarSystem;
}

function sampleCard(cardId = '55'): ICard {
  return getCardRegistry().create(cardId);
}

// ─────────────────────────────────────────────────────────────
// §2.9 BehaviorExecutor — INTEGRATION tests (rule-simple §5, rule-raw)
// Replaces the prior MOCK-HEAVY suite.
// ─────────────────────────────────────────────────────────────

describe('BehaviorExecutor — integration', () => {
  describe('2.9.1 resource bundle effects', () => {
    it('spends and gains resources against a real player ledger', () => {
      const { game, player } = createIntegrationGame('beh-2-9-1-spend-gain');
      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;

      const behavior: IBehavior = {
        spendResources: { credits: 2 },
        gainResources: { energy: 1, publicity: 2 },
      };
      getBehaviorExecutor().execute(behavior, player, game, sampleCard());
      drain(game);

      expect(player.resources.credits).toBe(creditsBefore - 2);
      expect(player.resources.energy).toBe(energyBefore + 1);
      expect(player.resources.publicity).toBe(4 + 2);
    });

    it('stacks score, movement, and tucked income flags in one execution', () => {
      const { game, player } = createIntegrationGame('beh-2-9-1-composite');
      const scoreBefore = player.score;
      const moveBefore = player.getMoveStash();

      const behavior: IBehavior = {
        gainScore: 3,
        gainMovement: 2,
        gainIncome: EResource.ENERGY,
      };
      getBehaviorExecutor().execute(behavior, player, game, sampleCard());
      drain(game);

      expect(player.score).toBe(scoreBefore + 3);
      expect(player.getMoveStash()).toBe(moveBefore + 2);
      expect(player.income.tuckedCardIncome[EResource.ENERGY]).toBe(1);
    });

    it('applies exofossil gains from alien-icon behavior', () => {
      const { game, player } = createIntegrationGame('beh-2-9-1-exofossil');
      const before = player.exofossils;

      const behavior: IBehavior = {
        gainExofossils: 2,
      };
      getBehaviorExecutor().execute(behavior, player, game, sampleCard());
      drain(game);

      expect(player.exofossils).toBe(before + 2);
    });
  });

  describe('2.9.2 action behaviors go through real effect classes', () => {
    it('launchProbe places a probe on a real Earth space and ticks probesInSpace', () => {
      const { game, player } = createIntegrationGame('beh-2-9-2-launch');
      const probesBefore = player.probesInSpace;

      getBehaviorExecutor().execute(
        { launchProbe: true },
        player,
        game,
        sampleCard(),
      );
      drain(game);

      expect(player.probesInSpace).toBe(probesBefore + 1);
      const solarSystem = requireSolarSystem(game);
      const earthSpaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
      const earthId = earthSpaces[0]?.id;
      if (!earthId) {
        throw new Error('expected an Earth space for the launch test');
      }
      const probesAtEarth = solarSystem.getProbesAt(earthId);
      expect(probesAtEarth.some((probe) => probe.playerId === player.id)).toBe(
        true,
      );
    });

    it('rotateSolarSystem advances rotationCounter through the real SolarSystem', () => {
      const { game, player } = createIntegrationGame('beh-2-9-2-rotate');
      const solarSystem = requireSolarSystem(game);
      const before = solarSystem.rotationCounter;

      getBehaviorExecutor().execute(
        { rotateSolarSystem: true },
        player,
        game,
        sampleCard(),
      );
      drain(game);

      expect(solarSystem.rotationCounter).toBe(before + 1);
    });

    it('orbit presents a real planet choice and moves the selected probe into orbit', () => {
      const { game, player } = createIntegrationGame('beh-2-9-2-orbit');
      const marsSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0];
      if (!marsSpace) {
        throw new Error('expected a Mars space for the orbit integration test');
      }
      game.solarSystem?.placeProbe(player.id, marsSpace.id);
      player.probesInSpace = 1;

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { orbit: true },
          player,
          game,
          sampleCard(),
        );
      });

      expect(pending).toBeDefined();
      const model = pending?.toModel() as ISelectOptionInputModel;
      expect(
        model.options.some((option) => option.id === `orbit-${EPlanet.MARS}`),
      ).toBe(true);
      pending?.process({
        type: EPlayerInputType.OPTION,
        optionId: `orbit-${EPlanet.MARS}`,
      });

      expect(player.probesInSpace).toBe(0);
      expect(
        game.planetaryBoard?.planets.get(EPlanet.MARS)?.orbitSlots,
      ).toEqual([{ playerId: player.id }]);
    });

    it('drawCards pulls from the real mainDeck and refills the card row', () => {
      const { game, player } = createIntegrationGame('beh-2-9-2-draw');
      game.mainDeck = new Deck(['d1', 'd2', 'd3', 'refill-1', 'refill-2'], []);
      game.cardRow = ['r1', 'r2']; // missing one slot → refill should top it up
      const handBefore = [...player.hand];

      getBehaviorExecutor().execute(
        { drawCards: 2 },
        player,
        game,
        sampleCard(),
      );
      drain(game);

      expect(player.hand).toEqual([...handBefore, 'd1', 'd2']);
      // RefillCardRowEffect should restore card row to 3 using the next deck card.
      expect(game.cardRow.length).toBe(3);
      expect(game.cardRow[2]).toBe('d3');
    });
  });

  describe('2.9.3 research tech runs against the real TechBoard', () => {
    it('returns a SelectOption whose ids are real tech ids available on the board', () => {
      const { game, player } = createIntegrationGame('beh-2-9-3-tech');

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { researchTech: ETech.PROBE },
          player,
          game,
          sampleCard(),
        );
      });

      expect(pending).toBeDefined();
      const model = pending?.toModel() as ISelectOptionInputModel;
      expect(model.type).toBe(EPlayerInputType.OPTION);
      const available = game.techBoard?.getAvailableTechs(player.id);
      for (const option of model.options) {
        expect(available).toContain(option.id);
      }
    });
  });

  describe('2.9.4 markTrace dispatches through AlienState', () => {
    it('surfaces a real trace input that resolves against alien slots', () => {
      const { game, player } = createIntegrationGame('beh-2-9-4-trace');

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { markTrace: ETrace.BLUE },
          player,
          game,
          sampleCard(),
        );
      });

      expect(pending).toBeDefined();
      // The alien state always emits one of the standard interactive inputs —
      // either an option, card, or trace-placement prompt — never undefined
      // for a color that has unresolved alien species.
      const model = pending?.toModel() as { type: EPlayerInputType };
      expect(Object.values(EPlayerInputType)).toContain(model.type);
    });

    it('falls back to the player trace ledger when alienState is unavailable', () => {
      const { game, player } = createIntegrationGame('beh-2-9-4-fallback');
      const eventsBefore = game.eventLog.size();
      game.alienState = undefined as never;

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { markTrace: ETrace.BLUE },
          player,
          game,
          sampleCard(),
        );
      });

      expect(pending).toBeUndefined();
      expect(player.traces[ETrace.BLUE]).toBe(1);
      expect(game.eventLog.size()).toBe(eventsBefore + 1);
    });
  });

  describe('2.9.5 mark helpers delegate to the real game.mark pipeline', () => {
    it('markAnySignal surfaces a SelectOption with the four real sector colours', () => {
      const { game, player } = createIntegrationGame('beh-2-9-5-any');

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { markAnySignal: 1 },
          player,
          game,
          sampleCard(),
        );
      });

      expect(pending).toBeDefined();
      const model = pending?.toModel() as ISelectOptionInputModel;
      const labels = model.options.map((o) => o.id);
      expect(labels).toEqual([
        'any-signal-red',
        'any-signal-yellow',
        'any-signal-blue',
        'any-signal-black',
      ]);
    });

    it('markDisplayCardSignal surfaces a real SelectCard over the current card row', () => {
      const { game, player } = createIntegrationGame('beh-2-9-5-display');
      game.cardRow = ['55', '71', '110'];

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { markDisplayCardSignal: 1 },
          player,
          game,
          sampleCard(),
        );
      });

      expect(pending).toBeDefined();
      const model = pending?.toModel() as {
        type: EPlayerInputType;
        cards: Array<{ id: string }>;
      };
      expect(model.type).toBe(EPlayerInputType.CARD);
      expect(model.cards.map((c) => c.id)).toEqual(['55@0', '71@1', '110@2']);
    });
  });

  describe('2.9.6 scan behavior marks a real sector', () => {
    it('markEarthSectorIndex writes a signal into the active solar system sector', () => {
      const { game, player } = createIntegrationGame('beh-2-9-6-scan');
      const firstSector = game.sectors[0];
      const playerSignalsBefore = firstSector.signals.filter(
        (s) => s.type === 'player',
      ).length;

      getBehaviorExecutor().execute(
        { scan: { markEarthSectorIndex: 0 } },
        player,
        game,
        sampleCard(),
      );
      drain(game);

      const playerSignalsAfter = firstSector.signals.filter(
        (s) => s.type === 'player',
      );
      expect(playerSignalsAfter.length).toBe(playerSignalsBefore + 1);
      expect(
        playerSignalsAfter.some(
          (s) => s.type === 'player' && s.playerId === player.id,
        ),
      ).toBe(true);
    });

    it('markEarthSectorIndex offers sector/tile choice when targeting oumuamua', () => {
      const { game, player } = createIntegrationGame('beh-2-9-6-oumuamua-scan');
      const { sectorIndex } = discoverOumuamua(game);

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(
          { scan: { markEarthSectorIndex: sectorIndex } },
          player,
          game,
          sampleCard(),
        );
      });

      const model = pending?.toModel() as ISelectOptionInputModel | undefined;
      expect(model?.type).toBe(EPlayerInputType.OPTION);
      expect(model?.options.map((option) => option.id)).toEqual(
        expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
      );
    });

    it('ET.23 desc handler targets the oumuamua sector and preserves tile choice', () => {
      const { game, player } = createIntegrationGame('beh-2-9-6-et-23');
      const { plugin } = discoverOumuamua(game);
      const card = sampleCard('ET.23');

      const pending = drainReturningInput(game, () => {
        getBehaviorExecutor().execute(card.behavior, player, game, card);
      });

      const model = pending?.toModel() as ISelectOptionInputModel | undefined;
      expect(card.behavior.custom).toEqual(
        expect.arrayContaining(['desc.et-23']),
      );
      expect(model?.type).toBe(EPlayerInputType.OPTION);
      expect(model?.options.map((option) => option.id)).toEqual(
        expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
      );

      const tileDataBefore = plugin.getRuntimeState(game)?.tileDataRemaining;
      pending?.process({
        type: EPlayerInputType.OPTION,
        optionId: 'oumuamua-tile',
      });

      expect(plugin.getRuntimeState(game)?.tileDataRemaining).toBe(
        (tileDataBefore ?? 0) - 1,
      );
    });
  });

  describe('2.9.7 custom DESC handlers fire against real game state', () => {
    it('desc.card-119 applies +4 VP through the registered handler', () => {
      const { game, player } = createIntegrationGame('beh-2-9-7-custom');
      const scoreBefore = player.score;
      const card = sampleCard('119');

      getBehaviorExecutor().execute(
        { custom: ['desc.card-119'] },
        player,
        game,
        card,
      );
      drain(game);

      expect(player.score).toBe(scoreBefore + 4);
    });

    it('unknown custom id is recorded in the event log without crashing', () => {
      const { game, player } = createIntegrationGame('beh-2-9-7-unknown');
      const card = sampleCard();
      const eventsBefore = game.eventLog.size();
      const scoreBefore = player.score;
      const creditsBefore = player.resources.credits;

      getBehaviorExecutor().execute(
        { custom: ['desc.does-not-exist'] },
        player,
        game,
        card,
      );
      drain(game);

      expect(game.eventLog.size()).toBeGreaterThan(eventsBefore);
      expect(player.score).toBe(scoreBefore);
      expect(player.resources.credits).toBe(creditsBefore);
    });
  });

  describe('2.9.8 canExecute honors real prerequisites', () => {
    it('canExecute returns false for launchProbe when spendResources cannot be paid', () => {
      const { game, player } = createIntegrationGame('beh-2-9-8-spend');
      player.resources.spend({ credits: player.resources.credits });

      const behavior: IBehavior = {
        spendResources: { credits: 1 },
        launchProbe: true,
      };
      expect(new BehaviorExecutor().canExecute(behavior, player, game)).toBe(
        false,
      );
    });

    it('canExecute returns false for researchTech when the board has no matching tech', () => {
      const { game, player } = createIntegrationGame('beh-2-9-8-tech');
      // Drain every PROBE tech by giving them to p1.
      const probeTechs =
        game.techBoard
          ?.getAvailableTechs(player.id)
          .filter((id) => id.startsWith('probe-')) ?? [];
      for (const techId of probeTechs) {
        game.techBoard?.take(player.id, techId);
        player.gainTech(techId);
      }

      expect(
        new BehaviorExecutor().canExecute(
          { researchTech: ETech.PROBE },
          player,
          game,
        ),
      ).toBe(false);
    });

    it('canExecute returns false for launchProbe when probe slots are exhausted', () => {
      const { game, player } = createIntegrationGame('beh-2-9-8-limit');
      player.probesInSpace = player.probeSpaceLimit;

      expect(
        new BehaviorExecutor().canExecute({ launchProbe: true }, player, game),
      ).toBe(false);
    });
  });

  describe('2.9.9 composite behavior runs all steps in order', () => {
    it('combines spend + gain + score + movement + tuck income + rotate in one execute', () => {
      const { game, player } = createIntegrationGame('beh-2-9-9-composite');
      const solarSystem = requireSolarSystem(game);
      const rotationBefore = solarSystem.rotationCounter;
      const scoreBefore = player.score;
      const creditsBefore = player.resources.credits;

      getBehaviorExecutor().execute(
        {
          spendResources: { credits: 1 },
          gainResources: { energy: 2 },
          gainScore: 3,
          gainMovement: 1,
          gainIncome: EResource.CREDIT,
          rotateSolarSystem: true,
        },
        player,
        game,
        sampleCard(),
      );
      drain(game);

      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(3 + 2);
      expect(player.score).toBe(scoreBefore + 3);
      expect(player.getMoveStash()).toBe(1);
      expect(player.income.tuckedCardIncome[EResource.CREDIT]).toBe(1);
      expect(solarSystem.rotationCounter).toBe(rotationBefore + 1);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function drainReturningInput(game: IGame, enqueue: () => void) {
  enqueue();
  return game.deferredActions.drain(game);
}
