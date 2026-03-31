import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { DebugSessionRegistry } from '@/debug/DebugSessionRegistry.js';
import { GameGateway } from '@/gateway/game.gateway.js';
import { GameManager } from '@/gateway/GameManager.js';

function createMockSocket(overrides: Partial<{
  id: string;
  data: Record<string, string>;
  handshake: Record<string, unknown>;
}> = {}) {
  return {
    id: overrides.id ?? 'socket-1',
    data: overrides.data ?? {},
    handshake: overrides.handshake ?? {
      auth: { token: 'valid-token' },
      headers: {},
    },
    emit: vi.fn(),
    disconnect: vi.fn(),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn(),
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
  };
}

const mockGameManager = {
  getGame: vi.fn(),
  processAction: vi.fn(),
  processFreeAction: vi.fn(),
  processInput: vi.fn(),
  getProjectedState: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn().mockReturnValue('signed-token'),
  verify: vi.fn().mockReturnValue({ sub: 'user-1', email: 'u@t.com' }),
};

const mockDebugSessionRegistry = {
  register: vi.fn(),
  isDebugGame: vi.fn().mockReturnValue(false),
  isBotPlayer: vi.fn().mockReturnValue(false),
  getHumanPlayerId: vi.fn().mockReturnValue(null),
};

describe('GameGateway', () => {
  let gateway: GameGateway;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        GameGateway,
        { provide: GameManager, useValue: mockGameManager },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DebugSessionRegistry, useValue: mockDebugSessionRegistry },
      ],
    }).compile();

    gateway = module.get(GameGateway);

    (gateway as unknown as { server: unknown }).server = {
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
      sockets: {
        adapter: { rooms: new Map() },
        sockets: new Map(),
      },
    };
  });

  describe('handleConnection', () => {
    it('authenticates client with valid token', () => {
      const socket = createMockSocket();

      gateway.handleConnection(socket as never);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(socket.data.userId).toBe('user-1');
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects client without token', () => {
      const socket = createMockSocket({
        handshake: { auth: {}, headers: {} },
      });

      gateway.handleConnection(socket as never);

      expect(socket.emit).toHaveBeenCalledWith('game:error', {
        code: EErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('disconnects client with invalid token', () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('invalid');
      });
      const socket = createMockSocket();

      gateway.handleConnection(socket as never);

      expect(socket.emit).toHaveBeenCalledWith('game:error', {
        code: EErrorCode.UNAUTHORIZED,
        message: 'Invalid authentication token',
      });
      expect(socket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleRoomJoin', () => {
    it('joins room and receives game state', async () => {
      const mockGame = {
        players: [
          { id: 'user-1', name: 'Alice', waitingFor: null },
          { id: 'user-2', name: 'Bob', waitingFor: null },
        ],
      };
      mockGameManager.getGame.mockResolvedValue(mockGame);
      mockGameManager.getProjectedState.mockReturnValue({
        gameId: 'game-1',
        round: 1,
      });

      const socket = createMockSocket();
      socket.data.userId = 'user-1';

      (gateway as unknown as { socketToGames: Map<string, Set<string>> })
        .socketToGames.set('socket-1', new Set());

      await gateway.handleRoomJoin(socket as never, { gameId: 'game-1' });

      expect(socket.join).toHaveBeenCalledWith('game:game-1');
      expect(socket.emit).toHaveBeenCalledWith('game:state', {
        gameState: { gameId: 'game-1', round: 1 },
      });
    });

    it('sends game:waiting if player has pending input', async () => {
      const mockInput = {
        toModel: vi.fn().mockReturnValue({ type: 'option', options: [] }),
      };
      const mockGame = {
        players: [
          { id: 'user-1', name: 'Alice', waitingFor: mockInput },
        ],
      };
      mockGameManager.getGame.mockResolvedValue(mockGame);
      mockGameManager.getProjectedState.mockReturnValue({
        gameId: 'game-1',
      });

      const socket = createMockSocket();
      socket.data.userId = 'user-1';
      (gateway as unknown as { socketToGames: Map<string, Set<string>> })
        .socketToGames.set('socket-1', new Set());

      await gateway.handleRoomJoin(socket as never, { gameId: 'game-1' });

      expect(socket.emit).toHaveBeenCalledWith('game:waiting', {
        playerId: 'user-1',
        input: { type: 'option', options: [] },
      });
    });
  });

  describe('handleGameAction', () => {
    it('broadcasts state to all players after action', async () => {
      const states = new Map([
        ['user-1', { gameId: 'g1', round: 1 }],
        ['user-2', { gameId: 'g1', round: 1 }],
      ]);
      mockGameManager.processAction.mockResolvedValue({
        states,
        pendingInputs: [],
        events: [],
      });

      const socket = createMockSocket();
      socket.data.userId = 'user-1';

      await gateway.handleGameAction(socket as never, {
        gameId: 'g1',
        action: { type: EMainAction.PASS },
      });

      expect(mockGameManager.processAction).toHaveBeenCalledWith(
        'g1',
        'user-1',
        { type: EMainAction.PASS },
      );
    });

    it('emits game:error on action failure', async () => {
      mockGameManager.processAction.mockRejectedValue(
        new Error('Not your turn'),
      );

      const socket = createMockSocket();
      socket.data.userId = 'user-1';

      await gateway.handleGameAction(socket as never, {
        gameId: 'g1',
        action: { type: EMainAction.PASS },
      });

      expect(socket.emit).toHaveBeenCalledWith('game:error', {
        code: EErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Not your turn',
      });
    });
  });

  describe('handleRoomLeave', () => {
    it('leaves the socket room', () => {
      const socket = createMockSocket();
      socket.data.userId = 'user-1';
      (gateway as unknown as { socketToGames: Map<string, Set<string>> })
        .socketToGames.set('socket-1', new Set(['g1']));

      gateway.handleRoomLeave(socket as never, { gameId: 'g1' });

      expect(socket.leave).toHaveBeenCalledWith('game:g1');
    });
  });

  describe('handleDisconnect', () => {
    it('notifies other players on disconnect', () => {
      const socket = createMockSocket();
      socket.data.userId = 'user-1';
      (gateway as unknown as { socketToGames: Map<string, Set<string>> })
        .socketToGames.set('socket-1', new Set(['g1']));

      gateway.handleDisconnect(socket as never);

      expect(socket.leave).toHaveBeenCalledWith('game:g1');
    });
  });
});
