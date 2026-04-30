import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { AuthService } from '@/auth/auth.service.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';

const MOCK_USER = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@test.com',
  passwordHash: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

function setupChainedQuery(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
    set: vi.fn().mockReturnThis(),
  };
  mockDb.select.mockReturnValue(chain);
  mockDb.insert.mockReturnValue(chain);
  mockDb.update.mockReturnValue(chain);
  return chain;
}

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE_DB,
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn().mockReturnValue('mock-jwt-token'),
            verify: vi
              .fn()
              .mockReturnValue({ sub: 'user-1', email: 'alice@test.com' }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('creates a user and returns JWT', async () => {
      const chain = setupChainedQuery([]);
      chain.limit.mockResolvedValueOnce([]);
      chain.returning.mockResolvedValueOnce([{ ...MOCK_USER }]);

      const result = await service.register(
        'Alice',
        'alice@test.com',
        'password123',
      );

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.name).toBe('Alice');
      expect(result.user.email).toBe('alice@test.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'alice@test.com',
      });
    });

    it('rejects duplicate email', async () => {
      setupChainedQuery([MOCK_USER]);

      await expect(
        service.register('Alice', 'alice@test.com', 'password123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns JWT for valid credentials', async () => {
      const { hash } = await import('bcryptjs');
      const hashed = await hash('password123', 10);
      setupChainedQuery([{ ...MOCK_USER, passwordHash: hashed }]);

      const result = await service.login('alice@test.com', 'password123');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('rejects unknown email', async () => {
      setupChainedQuery([]);
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.login('unknown@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects wrong password', async () => {
      const { hash } = await import('bcryptjs');
      const hashed = await hash('correctPassword', 10);
      setupChainedQuery([{ ...MOCK_USER, passwordHash: hashed }]);

      await expect(
        service.login('alice@test.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns user profile', async () => {
      setupChainedQuery([MOCK_USER]);

      const profile = await service.getProfile('user-1');

      expect(profile.id).toBe('user-1');
      expect(profile.name).toBe('Alice');
      expect(profile.email).toBe('alice@test.com');
    });

    it('throws for unknown user', async () => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(chain);

      await expect(service.getProfile('unknown')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates user name', async () => {
      const chain = setupChainedQuery([]);
      chain.limit.mockResolvedValueOnce([]);
      chain.returning.mockResolvedValueOnce([{ ...MOCK_USER, name: 'Bob' }]);

      const profile = await service.updateProfile('user-1', { name: 'Bob' });

      expect(profile.name).toBe('Bob');
    });

    it('rejects duplicate email on update', async () => {
      const chain = setupChainedQuery([{ ...MOCK_USER, id: 'other-user' }]);

      await expect(
        service.updateProfile('user-1', { email: 'alice@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
