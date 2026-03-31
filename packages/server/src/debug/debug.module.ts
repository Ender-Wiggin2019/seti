import { Module } from '@nestjs/common';
import { GatewayModule } from '@/gateway/game.gateway.module.js';
import { DebugController } from './debug.controller.js';
import { DebugService } from './debug.service.js';

@Module({
  imports: [GatewayModule],
  controllers: [DebugController],
  providers: [DebugService],
})
export class DebugModule {}
