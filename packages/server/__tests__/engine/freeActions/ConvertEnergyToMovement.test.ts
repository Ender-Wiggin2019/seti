import { EErrorCode } from '@seti/common/types/protocol/errors';
import { ConvertEnergyToMovementFreeAction } from '@/engine/freeActions/ConvertEnergyToMovement.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

function createTestPlayer(overrides?: Record<string, unknown>): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    ...overrides,
  });
}

const mockGame = {} as unknown as IGame;

describe('ConvertEnergyToMovementFreeAction', () => {
  describe('canExecute', () => {
    it('returns true when player has energy', () => {
      const player = createTestPlayer();
      expect(player.resources.energy).toBeGreaterThan(0);
      expect(
        ConvertEnergyToMovementFreeAction.canExecute(player, mockGame),
      ).toBe(true);
    });

    it('returns false when player has no energy', () => {
      const player = createTestPlayer({
        resources: { credits: 4, energy: 0, publicity: 4 },
      });
      expect(
        ConvertEnergyToMovementFreeAction.canExecute(player, mockGame),
      ).toBe(false);
    });
  });

  describe('execute', () => {
    it('converts 1 energy to 1 movement', () => {
      const player = createTestPlayer();
      const initialEnergy = player.resources.energy;
      const initialMove = player.getMoveStash();

      const result = ConvertEnergyToMovementFreeAction.execute(
        player,
        mockGame,
        1,
      );

      expect(result.energySpent).toBe(1);
      expect(result.movementGained).toBe(1);
      expect(player.resources.energy).toBe(initialEnergy - 1);
      expect(player.getMoveStash()).toBe(initialMove + 1);
    });

    it('converts multiple energy at once', () => {
      const player = createTestPlayer();
      const initialEnergy = player.resources.energy;

      const result = ConvertEnergyToMovementFreeAction.execute(
        player,
        mockGame,
        2,
      );

      expect(result.energySpent).toBe(2);
      expect(result.movementGained).toBe(2);
      expect(player.resources.energy).toBe(initialEnergy - 2);
      expect(player.getMoveStash()).toBe(2);
    });

    it('throws when not enough energy', () => {
      const player = createTestPlayer({
        resources: { credits: 4, energy: 1, publicity: 4 },
      });

      expect(() =>
        ConvertEnergyToMovementFreeAction.execute(player, mockGame, 3),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });

    it('throws for invalid amount', () => {
      const player = createTestPlayer();

      expect(() =>
        ConvertEnergyToMovementFreeAction.execute(player, mockGame, 0),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.VALIDATION_ERROR }),
      );

      expect(() =>
        ConvertEnergyToMovementFreeAction.execute(player, mockGame, -1),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.VALIDATION_ERROR }),
      );
    });
  });
});
