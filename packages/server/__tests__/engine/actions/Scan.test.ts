import { ESector } from '@seti/common/types/element';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ScanAction } from '@/engine/actions/Scan.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import { Sector } from '@/engine/board/Sector.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
import {
  extractSectorColorFromCardItem,
  getSectorIndexByPlanet,
} from '@/engine/effects/scan/ScanEffectUtils.js';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function finishScanWithDone(game: Game, playerId: string): void {
  const optionInput = playerWaitingFor(
    game,
    playerId,
    EPlayerInputType.OPTION,
  ) as ISelectOptionInputModel;

  game.processInput(playerId, {
    type: EPlayerInputType.OPTION,
    optionId:
      optionInput.options.find(
        (option: { id: string }) => option.id === EScanSubAction.DONE,
      )?.id ?? EScanSubAction.DONE,
  });
}

function requireValue<T>(value: T, message: string): NonNullable<T> {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

function playerWaitingFor(
  game: Game,
  playerId: string,
  expectedType: EPlayerInputType,
): IPlayerInputModel {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player?.waitingFor) {
    throw new Error(`expected player ${playerId} to be waiting for input`);
  }

  const model = player.waitingFor.toModel();
  expect(model.type).toBe(expectedType);
  return model;
}

// -----------------------------------------------------------------------------
// Integration test suite (rewrite of the prior mock-heavy legacy suite).
// Each test drives `Game.create()` + `processMainAction(SCAN)` to exercise the
// real engine pipeline.  Helpers live inline for now; shared builders can be
// extracted into `__tests__/helpers/` in a later refactor pass.
// -----------------------------------------------------------------------------

const INTEGRATION_TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createScanIntegrationGame(seed: string): {
  game: Game;
  p1: Player;
  p2: Player;
} {
  const game = Game.create(
    INTEGRATION_TEST_PLAYERS,
    { playerCount: 2 },
    seed,
    seed,
  );
  resolveSetupTucks(game);
  const p1 = requireValue(
    game.players.find((candidate) => candidate.id === 'p1'),
    'p1 missing',
  ) as Player;
  const p2 = requireValue(
    game.players.find((candidate) => candidate.id === 'p2'),
    'p2 missing',
  ) as Player;
  return { game, p1, p2 };
}

function discoverOumuamuaForScan(game: Game): OumuamuaAlienPlugin {
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.OUMUAMUA]);
  const board = game.alienState.getBoardByType(EAlienType.OUMUAMUA);
  if (!board) throw new Error('expected oumuamua board');
  board.discovered = true;
  const plugin = new OumuamuaAlienPlugin();
  plugin.onDiscover(game, []);
  return plugin;
}

describe('ScanAction — integration (rewrite)', () => {
  describe('2.4.1 cost payment', () => {
    it('deducts 1 credit and 2 energy when processMainAction(SCAN) starts', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-1');
      const creditsBefore = p1.resources.credits;
      const energyBefore = p1.resources.energy;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });

      expect(p1.resources.credits).toBe(creditsBefore - 1);
      expect(p1.resources.energy).toBe(energyBefore - 2);
    });
  });

  describe('2.4.3 MARK_CARD_ROW discards chosen card and marks matching-color sector', () => {
    it('discards picked card and marks a sector of matching color, granting +1 data', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-3');
      // Find the first card-row entry whose underlying card data has a sector.
      let firstCardId: string | null = null;
      let sectorColor: ESector | null = null;
      for (const entry of game.cardRow) {
        const id = typeof entry === 'string' ? entry : entry.id;
        const color = extractSectorColorFromCardItem(entry);
        if (color && id) {
          firstCardId = id;
          sectorColor = color;
          break;
        }
      }
      if (!firstCardId || !sectorColor) {
        throw new Error('expected a card-row card with sector color');
      }
      const matchingSectorIds = game.sectors
        .filter((sector) => sector.color === sectorColor)
        .map((sector) => sector.id);
      expect(matchingSectorIds.length).toBeGreaterThan(0);

      const totalDataBefore = p1.resources.data;
      const cardRowSizeBefore = game.cardRow.length;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });

      // If color maps to >1 sector, resolve the forced sector choice.
      let chosenSectorId: string | null = null;
      if (matchingSectorIds.length > 1) {
        const sectorPick = playerWaitingFor(
          game,
          p1.id,
          EPlayerInputType.OPTION,
        ) as ISelectOptionInputModel;
        const option = sectorPick.options.find((o) =>
          matchingSectorIds.includes(o.id),
        );
        chosenSectorId = requireValue(option, 'expected sector choice').id;
        game.processInput(p1.id, {
          type: EPlayerInputType.OPTION,
          optionId: chosenSectorId,
        });
      } else {
        chosenSectorId = matchingSectorIds[0];
      }

      const markedSector = requireValue(
        game.sectors.find((s) => s.id === chosenSectorId),
        'expected marked sector to exist',
      ) as Sector;

      expect(markedSector.getPlayerMarkerCount(p1.id)).toBe(1);
      expect(p1.resources.data).toBe(totalDataBefore + 1);
      expect(
        game.cardRow.some((c) =>
          typeof c === 'string' ? c === firstCardId : c.id === firstCardId,
        ),
      ).toBe(false);
      // Card row not yet refilled (happens on scan Done — covered in 2.4.7).
      expect(game.cardRow.length).toBe(cardRowSizeBefore - 1);
    });

    it('routes a real card-row scan into oumuamua sector/tile choice', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-3-oumuamua');
      const plugin = discoverOumuamuaForScan(game);
      const state = plugin.getRuntimeState(game);
      if (!state?.meta) throw new Error('expected oumuamua metadata');
      const oumuamuaSector = requireValue(
        game.sectors.find((sector) => sector.id === state.meta?.sectorId),
        'expected oumuamua sector',
      ) as Sector;
      game.cardRow = [{ id: 'oumuamua-match', sector: oumuamuaSector.color }];

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      const afterEarth = p1.waitingFor?.toModel();
      if (
        afterEarth?.type === EPlayerInputType.OPTION &&
        (afterEarth as ISelectOptionInputModel).options.some(
          (option) => option.id === 'oumuamua-sector',
        )
      ) {
        game.processInput(p1.id, {
          type: EPlayerInputType.OPTION,
          optionId: 'oumuamua-sector',
        });
      }
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: ['oumuamua-match'],
      });

      const sectorPick = playerWaitingFor(
        game,
        p1.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;
      const oumuamuaSectorOption = requireValue(
        sectorPick.options.find((option) => option.id === oumuamuaSector.id),
        'expected oumuamua sector option',
      );
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: oumuamuaSectorOption.id,
      });

      const branchPick = playerWaitingFor(
        game,
        p1.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;
      expect(branchPick.options.map((option) => option.id)).toEqual(
        expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
      );

      const dataBefore = plugin.getRuntimeState(game)?.tileDataRemaining ?? 0;
      const sectorMarkerCountBeforeTileChoice =
        oumuamuaSector.getPlayerMarkerCount(p1.id);
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'oumuamua-tile',
      });

      expect(plugin.getRuntimeState(game)?.tileDataRemaining).toBe(
        dataBefore - 1,
      );
      expect(oumuamuaSector.getPlayerMarkerCount(p1.id)).toBe(
        sectorMarkerCountBeforeTileChoice,
      );
    });
  });

  describe('2.4.4 second data slot awards +2 VP', () => {
    it('grants +2 VP on the 2nd signal placed in the same sector within one scan', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-4');
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      // Inject a single card-row card matching earth's color so MARK_CARD_ROW
      // targets earth too — both marks land in the same sector.
      game.cardRow = [{ id: 'earth-match', sector: earthSector.color }];
      const scoreBefore = p1.score;
      const dataBefore = p1.resources.data;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: ['earth-match'],
      });

      // The card row card's color may match multiple sectors; if a sector
      // picker appears, pick earth explicitly.
      const sectorIds = game.sectors
        .filter((s) => s.color === earthSector.color)
        .map((s) => s.id);
      if (sectorIds.length > 1) {
        const pick = playerWaitingFor(
          game,
          p1.id,
          EPlayerInputType.OPTION,
        ) as ISelectOptionInputModel;
        const earthChoice = pick.options.find((o) => o.id === earthSector.id);
        game.processInput(p1.id, {
          type: EPlayerInputType.OPTION,
          optionId: requireValue(earthChoice, 'expected earth option').id,
        });
      }

      expect(earthSector.getPlayerMarkerCount(p1.id)).toBe(2);
      expect(p1.score).toBe(scoreBefore + 2);
      // Both marks yielded a data each (they displaced data tokens).
      expect(p1.resources.data).toBe(dataBefore + 2);
    });
  });

  describe('2.4.5 overflow signals beyond slot capacity', () => {
    it('appends a player marker without data/VP gain when the sector has no data tokens left', () => {
      const { game, p1, p2 } = createScanIntegrationGame('scan-2-4-5');
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      // Pre-fill every data slot with p2's markers so the sector is fulfilled
      // but not yet resolved.
      for (let i = 0; i < earthSector.dataSlotCapacity; i += 1) {
        earthSector.markSignal(p2.id);
      }
      expect(earthSector.getDataCount()).toBe(0);
      expect(earthSector.isFulfilled()).toBe(true);

      const dataBefore = p1.resources.data;
      const scoreBefore = p1.score;
      const signalsBefore = earthSector.signals.length;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      // Assert overflow state *before* the scan's Done resolves fulfillment.
      expect(earthSector.signals.length).toBe(signalsBefore + 1);
      expect(earthSector.getPlayerMarkerCount(p1.id)).toBe(1);
      expect(p1.resources.data).toBe(dataBefore);
      expect(p1.score).toBe(scoreBefore);
    });
  });

  describe('2.4.11 FAQ timing: free action can interrupt a main action', () => {
    it('allows PLACE_DATA between SCAN sub-actions, then resumes SCAN to DONE', () => {
      const { game, p1 } = createScanIntegrationGame(
        'scan-2-4-11-interrupt-main',
      );

      expect(p1.dataPool.count).toBe(0);

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      // MARK_EARTH grants one data; spend it via a free action while SCAN is still pending.
      expect(p1.dataPool.count).toBe(1);
      game.processFreeAction(p1.id, {
        type: EFreeAction.PLACE_DATA,
        slotIndex: 0,
      });
      expect(p1.dataPool.count).toBe(0);
      expect(p1.computer.getTopSlots()[0]).toBe(true);

      const afterInterrupt = playerWaitingFor(
        game,
        p1.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;
      expect(
        afterInterrupt.options.some((o) => o.id === EScanSubAction.DONE),
      ).toBe(true);

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.DONE,
      });
      expect(p1.waitingFor).toBeUndefined();
    });
  });

  describe('2.4.6 completing a sector via scan triggers deferred resolution', () => {
    it('resolves the sector (winner recorded, reset) after the scan finishes', () => {
      const { game, p1, p2 } = createScanIntegrationGame('scan-2-4-6');
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      // Leave 1 data token remaining; scan's MARK_EARTH will displace it.
      for (let i = 0; i < earthSector.dataSlotCapacity - 1; i += 1) {
        earthSector.markSignal(p2.id);
      }
      expect(earthSector.getDataCount()).toBe(1);
      expect(earthSector.sectorWinners).toHaveLength(0);

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      // End scan → triggers SectorFulfillmentEffect.checkAll.
      finishScanWithDone(game, p1.id);

      // p2 has more markers → p2 wins; p1 is 2nd-place marker at idx 0.
      expect(earthSector.sectorWinners).toEqual([p2.id]);
      expect(earthSector.signals.length).toBe(earthSector.dataSlotCapacity);
      expect(earthSector.signals[0]).toEqual({
        type: 'player',
        playerId: p1.id,
      });
      // Other slots refilled with data.
      expect(earthSector.getDataCount()).toBe(earthSector.dataSlotCapacity - 1);
      expect(earthSector.completed).toBe(false);
    });
  });

  describe('2.4.7 card row refill is deferred until scan Done', () => {
    it('does not refill the card row immediately after MARK_CARD_ROW; only after Done', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-7');
      const initialIds = game.cardRow.map((c) =>
        typeof c === 'string' ? c : (c.id ?? ''),
      );
      const pickedId = requireValue(initialIds[0], 'expected card-row card');

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: [pickedId],
      });

      // Resolve any sector picker that may appear when the card's color
      // matches multiple sectors.
      const maybePick = p1.waitingFor?.toModel();
      if (
        maybePick?.type === EPlayerInputType.OPTION &&
        !(maybePick as ISelectOptionInputModel).options.some(
          (o) => o.id === EScanSubAction.DONE,
        )
      ) {
        game.processInput(p1.id, {
          type: EPlayerInputType.OPTION,
          optionId: (maybePick as ISelectOptionInputModel).options[0].id,
        });
      }

      // Between pick and Done: card row is short by 1 and NOT refilled.
      const midIds = game.cardRow.map((c) =>
        typeof c === 'string' ? c : c.id,
      );
      expect(midIds).toHaveLength(initialIds.length - 1);
      expect(midIds).not.toContain(pickedId);

      // MARK_EARTH is required before the scan can finish. When it is the
      // last remaining sub-action, the pool auto-closes after it resolves.
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      if (p1.waitingFor) {
        finishScanWithDone(game, p1.id);
      }

      // After Done: card row refilled to original size.
      expect(game.cardRow).toHaveLength(3);
      expect(
        game.cardRow.map((c) => (typeof c === 'string' ? c : c.id)),
      ).not.toContain(pickedId);
    });
  });

  describe('2.4.8 MARK_EARTH is mandatory before scan can finish', () => {
    it('does not offer DONE until MARK_EARTH has been executed', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-8-a');

      game.processMainAction(p1.id, { type: EMainAction.SCAN });

      const initialPool = playerWaitingFor(
        game,
        p1.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;

      expect(
        initialPool.options.some((o) => o.id === EScanSubAction.MARK_EARTH),
      ).toBe(true);
      expect(
        initialPool.options.some((o) => o.id === EScanSubAction.DONE),
      ).toBe(false);
    });

    it('offers DONE after MARK_EARTH is executed', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-8-b');

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      const poolAfterMark = playerWaitingFor(
        game,
        p1.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;

      expect(
        poolAfterMark.options.some((o) => o.id === EScanSubAction.DONE),
      ).toBe(true);
    });
  });

  describe('2.4.9 data pool full → discard excess data', () => {
    it('marks the signal but discards scan data when data pool is already at max', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-9');
      p1.resources.gain({ data: p1.dataPool.max });
      expect(p1.dataPool.count).toBe(p1.dataPool.max);
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      const totalDataBefore = p1.resources.data;
      const poolBefore = p1.dataPool.count;
      const stashBefore = p1.data.getState().stash;
      const markersBefore = earthSector.getPlayerMarkerCount(p1.id);

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(earthSector.getPlayerMarkerCount(p1.id)).toBe(markersBefore + 1);
      expect(p1.dataPool.count).toBe(poolBefore);
      expect(p1.data.getState().stash).toBe(stashBefore);
      expect(p1.resources.data).toBe(totalDataBefore);
    });
  });

  describe('2.4.10 missionTracker records SIGNAL_PLACED events', () => {
    it('emits one SIGNAL_PLACED event per mark, carrying the sector color', async () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-10');
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      const { EMissionEventType } = await import(
        '@/engine/missions/IMission.js'
      );
      const captured: Array<{ type: string; color?: string }> = [];
      const originalRecord = game.missionTracker.recordEvent.bind(
        game.missionTracker,
      );
      game.missionTracker.recordEvent = (event) => {
        captured.push(event as { type: string; color?: string });
        originalRecord(event);
      };

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      const signalPlacedEvents = captured.filter(
        (e) => e.type === EMissionEventType.SIGNAL_PLACED,
      );
      expect(signalPlacedEvents).toHaveLength(1);
      expect(signalPlacedEvents[0].color).toBe(earthSector.color);
    });
  });

  describe('2.4E.1 insufficient resources', () => {
    it('cannot scan when player has fewer than 1 credit', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-e1-credits');
      p1.resources.spend({ credits: p1.resources.credits });

      expect(ScanAction.canExecute(p1, game)).toBe(false);
      expect(() =>
        game.processMainAction(p1.id, { type: EMainAction.SCAN }),
      ).toThrowError(/Scan/i);
    });

    it('cannot scan when player has fewer than 2 energy', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-e1-energy');
      p1.resources.spend({ energy: p1.resources.energy - 1 });
      expect(p1.resources.energy).toBeLessThan(2);

      expect(ScanAction.canExecute(p1, game)).toBe(false);
      expect(() =>
        game.processMainAction(p1.id, { type: EMainAction.SCAN }),
      ).toThrowError(/Scan/i);
    });
  });

  describe('2.4E.2 empty card row still allows scan (earth-only)', () => {
    it('offers only MARK_EARTH when card row is empty, and scan completes after it', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-e2');
      game.cardRow = [];
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });

      const initialPool = playerWaitingFor(
        game,
        p1.id,
        EPlayerInputType.OPTION,
      ) as ISelectOptionInputModel;
      const optionIds = initialPool.options.map((o) => o.id);
      expect(optionIds).toContain(EScanSubAction.MARK_EARTH);
      expect(optionIds).not.toContain(EScanSubAction.MARK_CARD_ROW);
      expect(optionIds).not.toContain(EScanSubAction.DONE);

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(earthSector.getPlayerMarkerCount(p1.id)).toBe(1);
      expect(p1.waitingFor).toBeUndefined();
    });
  });

  describe('2.4.2 MARK_EARTH displaces data token and routes it to player', () => {
    it('replaces the rightmost data signal on the earth sector with a player marker and gains 1 data', () => {
      const { game, p1 } = createScanIntegrationGame('scan-2-4-2');
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'expected solar system'),
          EPlanet.EARTH,
        ),
        'expected earth sector index',
      );
      const earthSector = game.sectors[earthIdx] as Sector;

      const signalsCountBefore = earthSector.signals.length;
      const dataCountBefore = earthSector.getDataCount();
      const playerMarksBefore = earthSector.getPlayerMarkerCount(p1.id);
      const totalDataBefore = p1.resources.data;
      const dataPoolBefore = p1.dataPool.count;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      expect(earthSector.signals.length).toBe(signalsCountBefore);
      expect(earthSector.getDataCount()).toBe(dataCountBefore - 1);
      expect(earthSector.getPlayerMarkerCount(p1.id)).toBe(
        playerMarksBefore + 1,
      );
      expect(p1.resources.data).toBe(totalDataBefore + 1);
      expect(p1.dataPool.count).toBe(dataPoolBefore + 1);
    });
  });
});
