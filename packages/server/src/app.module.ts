import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@/auth/auth.module.js';
import { DebugModule } from '@/debug/debug.module.js';
import { isDebugApiEnabled } from '@/debug/debugAccess.js';
import { GatewayModule } from '@/gateway/game.gateway.module.js';
import { HealthModule } from '@/health/health.module.js';
import { LobbyModule } from '@/lobby/lobby.module.js';
import { DrizzleModule } from '@/persistence/drizzle.module.js';

function getThrottleLimit(): number {
  const parsed = Number(process.env.SETI_THROTTLE_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

@Module({
  imports: [
    DrizzleModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: getThrottleLimit() }]),
    AuthModule,
    HealthModule,
    ...(isDebugApiEnabled() ? [DebugModule] : []),
    LobbyModule,
    GatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
