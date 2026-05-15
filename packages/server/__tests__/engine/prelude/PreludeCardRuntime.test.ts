import { EStarName } from '@seti/common/constant/sectorSetup';
import { EEffectType } from '@seti/common/types/effect';
import { EResource, ETrace } from '@seti/common/types/element';
import type { IPreludeCard } from '@seti/common/types/prelude';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { PlanetaryBoard } from '@/engine/board/PlanetaryBoard.js';
import { findSectorIdByStarName } from '@/engine/effects/scan/ScanEffectUtils.js';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import { Game } from '@/engine/Game.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { Resources } from '@/engine/player/Resources.js';
import { PreludeCardRuntime } from '@/engine/prelude/PreludeCardRuntime.js';
import {
  skipSetupTucks,
  TEST_PLAYERS_2P,
} from '../../helpers/TestGameBuilder.js';

function createRuntimeGame(): Game {
  const game = Game.create(
    TEST_PLAYERS_2P,
    { playerCount: 2 },
    'prelude-runtime-seed',
  );
  skipSetupTucks(game);
  const player = game.players[0];
  player.score = 0;
  player.hand = [];
  player.pendingSetupTucks = 0;
  player.resources = new Resources(
    { credits: 0, energy: 0, publicity: 0, data: 0, signalTokens: 0 },
    { dataController: player.data },
  );
  game.planetaryBoard = new PlanetaryBoard();
  return game;
}

describe('PreludeCardRuntime', () => {
  it('resolves lower effects before silent signal setup marks', () => {
    const game = createRuntimeGame();
    const player = game.players[0];
    const sectorId = findSectorIdByStarName(
      game.solarSystemSetup,
      EStarName.BARNARDS_STAR,
    );
    const sector = game.sectors.find((candidate) => candidate.id === sectorId);
    if (!sector) {
      throw new Error('expected Barnard sector');
    }

    PreludeCardRuntime.resolvePlayerCard(player, game, 'SR.3');

    expect(player.score).toBe(2);
    expect(player.resources.toObject().data).toBe(2);
    expect(
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === player.id,
      ),
    ).toHaveLength(2);
    expect(player.pieces.deployed(EPieceType.SECTOR_MARKER)).toBe(2);
  });

  it('places setup traces without slot rewards', () => {
    const game = createRuntimeGame();
    const player = game.players[0];

    PreludeCardRuntime.resolvePlayerCard(player, game, 'SR.1');

    expect(player.score).toBe(3);
    expect(player.resources.toObject().publicity).toBe(1);
    expect(player.tracesByAlien[1]?.[ETrace.YELLOW]).toBe(1);
  });

  it('places setup orbiters without orbit rewards or probe requirements', () => {
    const game = createRuntimeGame();
    const player = game.players[0];

    PreludeCardRuntime.resolvePlayerCard(player, game, 'SR.11');

    expect(player.score).toBe(4);
    expect(player.resources.toObject().publicity).toBe(2);
    expect(game.planetaryBoard?.planets.get(EPlanet.SATURN)).toMatchObject({
      orbitSlots: [{ playerId: player.id }],
      firstOrbitClaimed: true,
    });
    expect(player.pieces.deployed(EPieceType.ORBITER)).toBe(1);
    expect(player.pendingSetupTucks).toBe(0);
  });

  it('adds income metadata for income Quick Start cards', () => {
    const game = createRuntimeGame();
    const player = game.players[0];

    PreludeCardRuntime.resolvePlayerCard(player, game, 'SR.15');

    expect(player.income.tuckedCardIncome[EResource.CARD]).toBe(1);
  });

  it('rejects unsupported lower effect resource types', () => {
    const game = createRuntimeGame();
    const player = game.players[0];

    expect(() =>
      (
        PreludeCardRuntime as unknown as {
          resolveLower: (
            player: IPlayer,
            game: Game,
            card: IPreludeCard,
          ) => void;
        }
      ).resolveLower(player, game, {
        id: 'test-unsupported-lower',
        upperEffects: [],
        upperText: '',
        middleText: 'Unsupported Lower',
        lowerEffects: [
          { effectType: EEffectType.BASE, type: EResource.MOVE, value: 1 },
        ],
        setupMarks: [],
      }),
    ).toThrow('Unsupported Quick Start lower effect');
  });

  it('places neutral upper marks without lower rewards', () => {
    const game = createRuntimeGame();
    const sectorId = findSectorIdByStarName(
      game.solarSystemSetup,
      EStarName.BARNARDS_STAR,
    );
    const sector = game.sectors.find((candidate) => candidate.id === sectorId);
    if (!sector) {
      throw new Error('expected Barnard sector');
    }

    PreludeCardRuntime.resolveNeutralUpper(game, 'SR.3');

    expect(game.players[0].score).toBe(0);
    expect(
      sector.signals.filter(
        (signal) => signal.type === 'player' && signal.playerId === 'neutral',
      ),
    ).toHaveLength(2);
  });

  it('does not emit runtime mark events or mission mark events for setup marks', () => {
    const game = createRuntimeGame();
    const player = game.players[0];
    const runtimeEvents: string[] = [];
    game.eventBus.subscribe(EGameRuntimeEvent.MARK_PLACED, () => {
      runtimeEvents.push(EGameRuntimeEvent.MARK_PLACED);
    });
    game.eventBus.subscribe(EGameRuntimeEvent.TRACE_PLACED, () => {
      runtimeEvents.push(EGameRuntimeEvent.TRACE_PLACED);
    });

    PreludeCardRuntime.resolvePlayerCard(player, game, 'SR.3');
    PreludeCardRuntime.resolvePlayerCard(player, game, 'SR.1');

    expect(runtimeEvents).toEqual([]);
    expect(
      game.missionTracker
        .getTurnEvents()
        .some(
          (event) =>
            event.type === EMissionEventType.SIGNAL_PLACED ||
            event.type === EMissionEventType.TRACE_MARKED,
        ),
    ).toBe(false);
  });
});
