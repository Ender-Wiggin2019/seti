import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller.js';
import { LobbyService } from './lobby.service.js';

@Module({
  controllers: [LobbyController],
  providers: [LobbyService],
  exports: [LobbyService],
})
export class LobbyModule {}
