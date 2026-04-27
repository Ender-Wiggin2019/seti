import { vi } from 'vitest';
import { ScanEffect } from '@/engine/effects/scan/ScanEffect.js';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createOumuamuaGame(seed: string): { game: Game; player: Player } {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  return { game, player: game.players[0] as Player };
}

describe('ScanEffect', () => {
  it('finishes immediately when card row is empty', () => {
    const player = {
      id: 'p1',
      score: 0,
      resources: { gain: vi.fn() },
      pieces: { deploy: vi.fn(), return: vi.fn(), deployed: vi.fn(() => 0) },
    };
    const game = {
      sectors: [
        {
          id: 'earth-sector',
          completed: false,
          markSignal: () => ({ dataGained: false, vpAwarded: 0 }),
        },
      ],
      cardRow: [],
      missionTracker: { recordEvent: () => undefined },
    };
    const onComplete = vi.fn(() => undefined);

    const result = ScanEffect.execute(player as never, game as never, {
      onComplete,
    });

    expect(result).toBeUndefined();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('offers sector/tile choice when the earth signal targets oumuamua sector', () => {
    const { game, player } = createOumuamuaGame('scan-effect-oumuamua');
    const { plugin, sectorIndex } = discoverOumuamua(game);
    const before = plugin.getRuntimeState(game);
    game.cardRow = [];

    const input = ScanEffect.execute(player, game, {
      earthSectorIndex: sectorIndex,
    });

    const model = input?.toModel() as ISelectOptionInputModel | undefined;
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'oumuamua-tile',
    });

    expect(plugin.getRuntimeState(game)?.tileDataRemaining).toBe(
      (before?.tileDataRemaining ?? 0) - 1,
    );
  });
});
