import { EMainAction } from '@seti/common/types/protocol/enums';
import { Game } from '@/engine/Game.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';

function createTestGame(): Game {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'deserializer-seed',
    'game-deserializer-test',
  );
}

describe('GameDeserializer', () => {
  it('supports round-trip serialization', () => {
    const game = createTestGame();
    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });

    const dto1 = serializeGame(game, 1);
    const restored = deserializeGame(dto1);
    const dto2 = serializeGame(restored, 1);

    expect(dto2).toEqual(dto1);
  });

  it('restores RNG sequence and game can continue', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 1);
    const restored = deserializeGame(dto);

    expect(restored.random.next()).toBe(game.random.next());

    expect(() => {
      restored.processMainAction(restored.activePlayer.id, {
        type: EMainAction.PASS,
      });
    }).not.toThrow();
  });
});
