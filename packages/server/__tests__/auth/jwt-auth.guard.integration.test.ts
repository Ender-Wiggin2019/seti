import { Controller, Get, type INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard.js';
import { Public } from '@/auth/public.decorator.js';

@Controller('guard-test')
class GuardTestController {
  @Public()
  @Get('public')
  publicRoute() {
    return { ok: true };
  }

  @Get('private')
  privateRoute() {
    return { ok: true };
  }
}

@Module({
  imports: [JwtModule.register({ secret: 'test-secret' })],
  controllers: [GuardTestController],
  providers: [
    {
      provide: APP_GUARD,
      inject: [JwtService, Reflector],
      useFactory: (jwtService: JwtService, reflector: Reflector) =>
        new JwtAuthGuard(jwtService, reflector),
    },
  ],
})
class GuardTestModule {}

function getBaseUrl(app: INestApplication): string {
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve test server address');
  }
  return `http://127.0.0.1:${address.port}`;
}

describe('JwtAuthGuard integration', () => {
  let app: INestApplication;
  let baseUrl = '';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [GuardTestModule],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0);
    baseUrl = getBaseUrl(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows public endpoint without token', async () => {
    const res = await fetch(`${baseUrl}/guard-test/public`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('rejects private endpoint without token', async () => {
    const res = await fetch(`${baseUrl}/guard-test/private`);

    expect(res.status).toBe(401);
  });

  it('allows private endpoint with valid token', async () => {
    const jwt = app.get(JwtService);
    const token = jwt.sign({ sub: 'user-1', email: 'u1@test.com' });

    const res = await fetch(`${baseUrl}/guard-test/private`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  // Per the design notes (`docs/lessons.md`): the guard no longer
  // round-trips to the DB on every authenticated request. A signed
  // JWT is trusted for read paths; user-existence is re-verified on
  // user-write paths (`PUT /auth/me`) via `authService.updateProfile`,
  // not in the guard. So a token with a stale `sub` still passes the
  // guard — it'll only 401 if the controller actually needs the user.
  it('does not round-trip to authService on every authenticated request', async () => {
    const jwt = app.get(JwtService);
    const token = jwt.sign({
      sub: 'bf91fbcb-f898-43f6-8aca-0d94e7b908c3',
      email: 'missing@test.com',
    });

    const res = await fetch(`${baseUrl}/guard-test/private`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // The controller doesn't dereference req.user.sub, so the request
    // succeeds. (In production the user-write controllers re-verify
    // existence themselves; the integration suite for those lives next
    // to the auth.controller, not here.)
    expect(res.status).toBe(200);
  });
});
