import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { IJwtPayload } from '@/auth/jwt-auth.guard.js';
import {
  CreateRoomDto,
  ListRoomsQueryDto,
  UpdateRoomOptionsDto,
} from './dto/CreateRoomDto.js';
import { LobbyService } from './lobby.service.js';

@Controller('lobby')
export class LobbyController {
  constructor(
    @Inject(LobbyService) private readonly lobbyService: LobbyService,
  ) {}

  @Get('rooms')
  async listRooms(@Query() query: ListRoomsQueryDto) {
    return this.lobbyService.listRooms(query);
  }

  @Get('my-games')
  async listMyGames(
    @Req() req: { user: IJwtPayload },
    @Query() query: ListRoomsQueryDto,
  ) {
    return this.lobbyService.listMyGames(req.user.sub, query);
  }

  @Get('alien-types')
  getAlienTypeMap() {
    return this.lobbyService.getAlienTypeMap();
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

    return this.lobbyService.createRoom(
      req.user.sub,
      dto.name,
      playerCount,
      dto.seed,
      dto.options,
      dto.visibleInLobby ?? true,
    );
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    return this.lobbyService.getRoomById(id);
  }

  @Patch('rooms/:id/options')
  async updateRoomOptions(
    @Req() req: { user: IJwtPayload },
    @Param('id') id: string,
    @Body() patch: UpdateRoomOptionsDto,
  ) {
    return this.lobbyService.updateRoomOptions(id, req.user.sub, patch);
  }

  @Post('rooms/:id/join')
  async joinRoom(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    return this.lobbyService.joinRoom(id, req.user.sub);
  }

  @Post('rooms/:id/leave')
  async leaveRoom(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    return this.lobbyService.leaveRoom(id, req.user.sub);
  }

  @Delete('rooms/:id')
  async deleteRoom(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    await this.lobbyService.deleteRoom(id, req.user.sub);
  }

  @Get('players/:id/profile')
  async getPlayerPublicProfile(@Param('id') id: string) {
    return this.lobbyService.getPlayerPublicProfile(id);
  }

  @Post('rooms/:id/start')
  async startGame(@Req() req: { user: IJwtPayload }, @Param('id') id: string) {
    return this.lobbyService.startGame(id, req.user.sub);
  }
}
