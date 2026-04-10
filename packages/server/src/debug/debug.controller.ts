import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import { Public } from '@/auth/public.decorator.js';
import {
  DebugService,
  type IDebugBehaviorFlowSessionResponse,
  type IDebugServerSessionResponse,
} from './debug.service.js';

@Controller('debug')
export class DebugController {
  constructor(
    @Inject(DebugService) private readonly debugService: DebugService,
  ) {}

  @Public()
  @Post('server/session')
  async createServerSession(): Promise<IDebugServerSessionResponse> {
    return this.debugService.createServerSession();
  }

  @Public()
  @Post('server/behavior-flow')
  async createBehaviorFlowSession(): Promise<IDebugBehaviorFlowSessionResponse> {
    return this.debugService.createBehaviorFlowSession();
  }

  @Public()
  @Get('server/game/:gameId/state/:viewerId')
  async getState(
    @Param('gameId') gameId: string,
    @Param('viewerId') viewerId: string,
  ): Promise<IPublicGameState> {
    return this.debugService.getProjectedState(gameId, viewerId);
  }

  @Public()
  @Post('server/game/:gameId/main-action')
  async processMainAction(
    @Param('gameId') gameId: string,
    @Body()
    body: {
      playerId: string;
      action: IMainActionRequest;
      viewerId?: string;
    },
  ): Promise<IPublicGameState> {
    return this.debugService.processMainAction(
      gameId,
      body.playerId,
      body.action,
      body.viewerId ?? body.playerId,
    );
  }

  @Public()
  @Post('server/game/:gameId/free-action')
  async processFreeAction(
    @Param('gameId') gameId: string,
    @Body()
    body: {
      playerId: string;
      action: IFreeActionRequest;
      viewerId?: string;
    },
  ): Promise<IPublicGameState> {
    return this.debugService.processFreeAction(
      gameId,
      body.playerId,
      body.action,
      body.viewerId ?? body.playerId,
    );
  }

  @Public()
  @Post('server/game/:gameId/input')
  async processInput(
    @Param('gameId') gameId: string,
    @Body()
    body: {
      playerId: string;
      inputResponse: IInputResponse;
      viewerId?: string;
    },
  ): Promise<IPublicGameState> {
    return this.debugService.processInput(
      gameId,
      body.playerId,
      body.inputResponse,
      body.viewerId ?? body.playerId,
    );
  }
}
