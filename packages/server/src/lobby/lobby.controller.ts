import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { IJwtPayload } from '@/auth/jwt-auth.guard.js';
import { CreateRoomDto } from './dto/CreateRoomDto.js';
import { LobbyService } from './lobby.service.js';

@Controller('lobby')
export class LobbyController {
  constructor(
    @Inject(LobbyService) private readonly lobbyService: LobbyService,
  ) {}

  @Get('rooms')
  async listRooms(@Query('status') status?: string) {
    return this.lobbyService.listRooms(status);
  }

  @Post('rooms')
  async createRoom(
    @Req() req: { user: IJwtPayload },
    @Body() dto: CreateRoomDto,
  ) {
    const playerCount = dto.playerCount ?? dto.options?.playerCount;
    if (typeof playerCount !== 'number' || !Number.isInteger(playerCount)) {
      throw new BadRequestException('playerCount is required');
    }

    return this.lobbyService.createRoom(req.user.sub, dto.name, playerCount);
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    return this.lobbyService.getRoomById(id);
  }

  @Post('rooms/:id/join')
  async joinRoom(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    return this.lobbyService.joinRoom(id, req.user.sub);
  }

  @Post('rooms/:id/leave')
  async leaveRoom(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    return this.lobbyService.leaveRoom(id, req.user.sub);
  }

  @Post('rooms/:id/start')
  async startGame(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    return this.lobbyService.startGame(id, req.user.sub);
  }
}
