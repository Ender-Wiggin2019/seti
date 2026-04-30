import {
  LAUNCH_PROBE_CREDIT_COST,
  SCAN_CREDIT_COST,
} from '@seti/common/constant/actionCosts';
import { ESector } from '@seti/common/types/element';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { Sector } from '@/engine/board/Sector.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
import {
  extractSectorColorFromCardItem,
  getSectorIndexByPlanet,
} from '@/engine/effects/scan/ScanEffectUtils.js';
import { ScanEarthNeighborEffect } from '@/engine/effects/scan/ScanTechEffects.js';
import { Game } from '@/engine/Game.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { Player } from '@/engine/player/Player.js';
import {
  ScanEarthLookTech,
  ScanEnergyLaunchTech,
  ScanHandSignalTech,
  ScanPopSignalTech,
} from '@/engine/tech/techs/ScanTechs.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

// ── Modifier metadata (tech classes) ───────────────────────────────────────

describe('Scan tech modifiers', () => {
  it('exposes earth neighbor scan modifier', () => {
    const tech = new ScanEarthLookTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_EARTH_LOOK,
        effectType: 'earth-neighbor',
        description:
          'During Scan, earth signal may be placed in a sector adjacent to earth.',
      },
    ]);
  });

  it('exposes mercury signal scan modifier', () => {
    const tech = new ScanPopSignalTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_POP_SIGNAL,
        effectType: 'mercury-signal',
        description:
          'Pay 1 publicity to place one extra signal in mercury sector.',
        cost: { publicity: 1 },
      },
    ]);
  });

  it('exposes hand signal scan modifier', () => {
    const tech = new ScanHandSignalTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_HAND_SIGNAL,
        effectType: 'hand-signal',
        description:
          'Discard one hand card, then place one signal in the discarded card sector.',
      },
    ]);
  });

  it('exposes energy launch scan modifier', () => {
    const tech = new ScanEnergyLaunchTech();
    expect(tech.getScanModifiers()).toEqual([
      {
        techId: ETechId.SCAN_ENERGY_LAUNCH,
        effectType: 'energy-launch',
        description:
          'Choose one: pay 1 energy to launch a probe, or gain 1 free movement.',
        cost: { energy: 1 },
      },
    ]);
  });
});

// ── Phase 8.2 — Game + SCAN integration ───────────────────────────────────

const INTEGRATION_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

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
  const player = game.players.find((c) => c.id === playerId);
  if (!player?.waitingFor) {
    throw new Error(`expected player ${playerId} to be waiting for input`);
  }
  const model = player.waitingFor.toModel();
  expect(model.type).toBe(expectedType);
  return model;
}

function createScanTechGame(seed: string): { game: Game; p1: Player } {
  const game = Game.create(INTEGRATION_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  const p1 = requireValue(
    game.players.find((c) => c.id === 'p1'),
    'p1 missing',
  ) as Player;
  return { game, p1 };
}

/** Sector color disambiguation (not the scan sub-action pool). */
function resolveOptionalSectorChoice(game: Game, playerId: string): void {
  const wf = game.players.find((p) => p.id === playerId)?.waitingFor;
  if (!wf) return;
  const model = wf.toModel();
  if (model.type !== EPlayerInputType.OPTION) return;
  const opts = (model as ISelectOptionInputModel).options;
  const scanMenu = new Set<string>(Object.values(EScanSubAction));
  if (opts.some((o) => scanMenu.has(o.id))) return;
  game.processInput(playerId, {
    type: EPlayerInputType.OPTION,
    optionId: opts[0].id,
  });
}

function countSignalsOnBoard(game: Game, playerId: string): number {
  return game.sectors.reduce(
    (sum, s) => sum + (s as Sector).getPlayerMarkerCount(playerId),
    0,
  );
}

describe('Phase 8.2 — Telescope tech (Game + SCAN)', () => {
  describe('8.2.0 earthLook: earth signal may be placed in an adjacent sector', () => {
    it('lets the player mark a sector adjacent to Earth instead of Earth', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-0');
      p1.techs = [ETechId.SCAN_EARTH_LOOK];

      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'solar system'),
          EPlanet.EARTH,
        ),
        'earth index',
      );
      const [adjacentIdx] = ScanEarthNeighborEffect.getAdjacentSectorIndexes(
        earthIdx,
        game.sectors.length,
      );
      const targetIdx = adjacentIdx;

      const earthSector = game.sectors[earthIdx] as Sector;
      const targetSector = game.sectors[targetIdx] as Sector;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: `sector-${targetIdx}`,
      });

      expect(earthSector.getPlayerMarkerCount(p1.id)).toBe(0);
      expect(targetSector.getPlayerMarkerCount(p1.id)).toBe(1);
    });
  });

  describe('8.2.1 popSignal: pay 1 publicity for an extra signal on Mercury', () => {
    it('spends 1 publicity and marks Mercury when choosing that sub-action', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-1');
      p1.techs = [ETechId.SCAN_POP_SIGNAL];

      const mercuryIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'solar system'),
          EPlanet.MERCURY,
        ),
        'mercury index',
      );
      const mercurySector = game.sectors[mercuryIdx] as Sector;
      const pubBefore = p1.publicity;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_MERCURY,
      });

      expect(p1.publicity).toBe(pubBefore - 1);
      expect(mercurySector.getPlayerMarkerCount(p1.id)).toBe(1);
    });
  });

  describe('8.2.2 handSignal: discard from hand to mark by card sector color', () => {
    it('discards a hand card and marks a matching-color sector', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-2');
      p1.techs = [ETechId.SCAN_HAND_SIGNAL];
      p1.hand = [{ id: 'hand-sig', sector: ESector.RED }];

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_HAND,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: ['hand-sig@0'],
      });
      resolveOptionalSectorChoice(game, p1.id);

      expect(p1.hand).toHaveLength(0);
      const redSectors = game.sectors.filter(
        (s) => (s as Sector).color === ESector.RED,
      ) as Sector[];
      const marked = redSectors.some((s) => s.getPlayerMarkerCount(p1.id) >= 1);
      expect(marked).toBe(true);
    });
  });

  describe('8.2.3 energyLaunch: pay 1 energy to launch or gain 1 free movement', () => {
    it('offers launch or move; move grants 1 movement in stash', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-3-move');
      p1.techs = [ETechId.SCAN_ENERGY_LAUNCH];
      // Default start: 3 energy → scan spends 2 → 1 left for launch, or move without extra energy
      expect(p1.resources.energy).toBeGreaterThanOrEqual(3);

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      expect(p1.getMoveStash()).toBe(1);
    });

    it('launch branch places a probe without using the main Launch action', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-3-launch');
      p1.techs = [ETechId.SCAN_ENERGY_LAUNCH];
      const probesBefore = p1.probesInSpace;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'launch',
      });

      expect(p1.probesInSpace).toBe(probesBefore + 1);
    });
  });

  describe('8.2.4 FAQ: scan launch does not charge 2 credits', () => {
    it('does not deduct LAUNCH_PROBE_CREDIT_COST when launching from scan energy tech', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-4');
      p1.techs = [ETechId.SCAN_ENERGY_LAUNCH];

      const creditsBefore = p1.resources.credits;

      game.processMainAction(p1.id, { type: EMainAction.SCAN });
      const creditsAfterScanPaid = creditsBefore - SCAN_CREDIT_COST;
      expect(p1.resources.credits).toBe(creditsAfterScanPaid);

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'launch',
      });

      expect(p1.resources.credits).toBe(creditsAfterScanPaid);
      expect(p1.resources.credits).not.toBe(
        creditsAfterScanPaid - LAUNCH_PROBE_CREDIT_COST,
      );
    });
  });

  describe('8.2.5 multiple telescope techs can be activated in any order', () => {
    it('allows Mercury → Energy(move) → Earth → Card row → Hand', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-5');
      p1.techs = [
        ETechId.SCAN_EARTH_LOOK,
        ETechId.SCAN_POP_SIGNAL,
        ETechId.SCAN_HAND_SIGNAL,
        ETechId.SCAN_ENERGY_LAUNCH,
      ];
      p1.hand = [{ id: 'hand-sig', sector: ESector.YELLOW }];

      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'solar system'),
          EPlanet.EARTH,
        ),
        'earth',
      );

      let firstCardId: string | null = null;
      for (const entry of game.cardRow) {
        const id = typeof entry === 'string' ? entry : entry.id;
        const color = extractSectorColorFromCardItem(entry);
        if (id && color) {
          firstCardId = id;
          break;
        }
      }
      if (!firstCardId) {
        throw new Error('expected a card-row card with sector color');
      }

      game.processMainAction(p1.id, { type: EMainAction.SCAN });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_MERCURY,
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: `sector-${earthIdx}`,
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });
      resolveOptionalSectorChoice(game, p1.id);

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_HAND,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: ['hand-sig@0'],
      });
      resolveOptionalSectorChoice(game, p1.id);

      expect(p1.waitingFor).toBeUndefined();
    });
  });

  describe('8.2.6 with all four telescope techs, at most four signals are marked', () => {
    it('places exactly four player signals when using every signal sub-action', () => {
      const { game, p1 } = createScanTechGame('scan-tech-8-2-6');
      p1.techs = [
        ETechId.SCAN_EARTH_LOOK,
        ETechId.SCAN_POP_SIGNAL,
        ETechId.SCAN_HAND_SIGNAL,
        ETechId.SCAN_ENERGY_LAUNCH,
      ];
      const handColor = (game.sectors[0] as Sector).color;
      p1.hand = [{ id: 'hand-sig', sector: handColor }];

      const signalsBefore = countSignalsOnBoard(game, p1.id);
      const markersBefore = p1.pieces.deployed(EPieceType.SECTOR_MARKER);

      let firstCardId: string | null = null;
      for (const entry of game.cardRow) {
        const id = typeof entry === 'string' ? entry : entry.id;
        const color = extractSectorColorFromCardItem(entry);
        if (id && color) {
          firstCardId = id;
          break;
        }
      }
      if (!firstCardId) {
        throw new Error('expected a card-row card with sector color');
      }

      game.processMainAction(p1.id, { type: EMainAction.SCAN });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_EARTH,
      });
      const earthIdx = requireValue(
        getSectorIndexByPlanet(
          requireValue(game.solarSystem, 'solar system'),
          EPlanet.EARTH,
        ),
        'earth',
      );
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: `sector-${earthIdx}`,
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_CARD_ROW,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });
      resolveOptionalSectorChoice(game, p1.id);

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_MERCURY,
      });

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.MARK_HAND,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: ['hand-sig@0'],
      });
      resolveOptionalSectorChoice(game, p1.id);

      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      });
      game.processInput(p1.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'move',
      });

      expect(p1.waitingFor).toBeUndefined();

      expect(countSignalsOnBoard(game, p1.id)).toBe(signalsBefore + 4);
      expect(p1.pieces.deployed(EPieceType.SECTOR_MARKER)).toBe(
        markersBefore + 4,
      );
    });
  });
});
