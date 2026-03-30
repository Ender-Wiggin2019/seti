import { Module } from '@nestjs/common';
import { GameManager } from './GameManager.js';
import { GameGateway } from './game.gateway.js';

@Module({
  providers: [GameManager, GameGateway],
  exports: [GameManager],
})
export class GatewayModule {}
