import { ESector } from '@seti/common/types/element';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { Deck } from '@/engine/deck/Deck.js';
import { EScanSubAction } from '@/engine/effects/scan/ScanActionPool.js';
import { ScanEffect } from '@/engine/effects/scan/ScanEffect.js';
import { Game } from '@/engine/Game.js';
import { Player } from '@/engine/player/Player.js';
import { discoverOumuamua } from '../../../helpers/OumuamuaTestUtils.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

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
  it('uses the scan action pool and refills after the pool completes', () => {
    const player = {
      id: 'p1',
      score: 0,
      techs: [],
      hand: [],
      resources: { gain: vi.fn() },
      pieces: { deploy: vi.fn(), return: vi.fn(), deployed: vi.fn(() => 0) },
    };
    const sectors = [
      {
        id: 'earth-sector',
        color: ESector.RED,
        completed: false,
        markSignal: () => ({ dataGained: false, vpAwarded: 0 }),
      },
      {
        id: 'row-sector',
        color: ESector.BLUE,
        completed: false,
        markSignal: () => ({ dataGained: false, vpAwarded: 0 }),
      },
    ];
    const game = {
      sectors,
      cardRow: [{ id: 'row-blue', sector: ESector.BLUE }],
      mainDeck: new Deck<string>(['refill-a']),
      solarSystem: null,
      missionTracker: { recordEvent: () => undefined },
      lockCurrentTurn: () => undefined,
    };
    const onComplete = vi.fn(() => undefined);

    const scanMenu = ScanEffect.execute(player as never, game as never, {
      onComplete,
    });

    expect(scanMenu?.type).toBe(EPlayerInputType.OPTION);
    const afterEarth = scanMenu?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_EARTH,
    });
    const rowInput = afterEarth?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_CARD_ROW,
    });
    const afterCard = rowInput?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['row-blue'],
    });
    const done = afterCard?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.DONE,
    });

    expect(done).toBeUndefined();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(game.cardRow).toEqual(['refill-a']);
    expect(game.mainDeck.getDiscardPile()).toEqual(['row-blue']);
  });

  it('offers sector/tile choice when the earth signal targets oumuamua sector', () => {
    const { game, player } = createOumuamuaGame('scan-effect-oumuamua');
    const { plugin, sectorIndex } = discoverOumuamua(game);
    const before = plugin.getRuntimeState(game);
    game.cardRow = [];

    const input = ScanEffect.execute(player, game, {
      earthSectorIndex: sectorIndex,
    });
    const earthInput = input?.process({
      type: EPlayerInputType.OPTION,
      optionId: EScanSubAction.MARK_EARTH,
    });

    const model = earthInput?.toModel() as ISelectOptionInputModel | undefined;
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(['oumuamua-sector', 'oumuamua-tile']),
    );

    earthInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'oumuamua-tile',
    });

    expect(plugin.getRuntimeState(game)?.tileDataRemaining).toBe(
      (before?.tileDataRemaining ?? 0) - 1,
    );
  });
});
