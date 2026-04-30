import { Test } from '@nestjs/testing';
import { AuthController } from '@/auth/auth.controller.js';
import { AuthService } from '@/auth/auth.service.js';

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('POST /auth/register', () => {
    it('calls service.register with DTO fields', async () => {
      const expected = {
        accessToken: 'token',
        user: { id: 'u1', name: 'Alice', email: 'a@b.com' },
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register({
        name: 'Alice',
        email: 'a@b.com',
        password: 'secret123',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'Alice',
        'a@b.com',
        'secret123',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('POST /auth/login', () => {
    it('calls service.login', async () => {
      const expected = {
        accessToken: 'token',
        user: { id: 'u1', name: 'Alice', email: 'a@b.com' },
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login({
        email: 'a@b.com',
        password: 'secret123',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'a@b.com',
        'secret123',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /auth/me', () => {
    it('returns profile for authenticated user', async () => {
      const expected = {
        id: 'u1',
        name: 'Alice',
        email: 'a@b.com',
        createdAt: new Date(),
      };
      mockAuthService.getProfile.mockResolvedValue(expected);

      const result = await controller.me({
        user: { sub: 'u1', email: 'a@b.com' },
      });

      expect(mockAuthService.getProfile).toHaveBeenCalledWith('u1');
      expect(result).toEqual(expected);
    });
  });

  describe('PUT /auth/me', () => {
    it('updates profile', async () => {
      const expected = {
        id: 'u1',
        name: 'Bob',
        email: 'a@b.com',
        createdAt: new Date(),
      };
      mockAuthService.updateProfile.mockResolvedValue(expected);

      const result = await controller.updateMe(
        { user: { sub: 'u1', email: 'a@b.com' } },
        { name: 'Bob' },
      );

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('u1', {
        name: 'Bob',
        email: undefined,
        password: undefined,
      });
      expect(result).toEqual(expected);
    });
  });
});
