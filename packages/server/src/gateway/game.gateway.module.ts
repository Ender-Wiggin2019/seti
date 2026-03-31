import { Module } from '@nestjs/common';
import { DebugSessionRegistry } from '@/debug/DebugSessionRegistry.js';
import { GameManager } from './GameManager.js';
import { GameGateway } from './game.gateway.js';

@Module({
  providers: [GameManager, GameGateway, DebugSessionRegistry],
  exports: [GameManager, DebugSessionRegistry],
})
export class GatewayModule {}
