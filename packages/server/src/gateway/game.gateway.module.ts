import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway.js';
import { GameManager } from './GameManager.js';

@Module({
  providers: [GameManager, GameGateway],
  exports: [GameManager],
})
export class GatewayModule {}
