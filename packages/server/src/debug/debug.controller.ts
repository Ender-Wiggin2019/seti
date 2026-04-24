import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type {
  IDebugReplayPresetDefinition,
  IDebugReplaySessionRequest,
  IDebugReplaySessionResponse,
  IDebugServerSessionResponse,
  IDebugSnapshotSessionRequest,
  IDebugSnapshotSessionResponse,
} from '@seti/common/types/protocol/debug';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';
import { Public } from '@/auth/public.decorator.js';
import {
  DebugService,
  type IDebugBehaviorFlowSessionResponse,
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
  @Get('replay-presets')
  listReplayPresets(): IDebugReplayPresetDefinition[] {
    return this.debugService.listReplayPresets();
  }

  @Public()
  @Post('server/replay-session')
  async createReplaySession(
    @Body() body: IDebugReplaySessionRequest,
  ): Promise<IDebugReplaySessionResponse> {
    return this.debugService.createReplaySession(body);
  }

  @Public()
  @Post('server/snapshot-session')
  async createSnapshotSession(
    @Body() body: IDebugSnapshotSessionRequest,
  ): Promise<IDebugSnapshotSessionResponse> {
    return this.debugService.createSnapshotSession(body);
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
  @Post('server/game/:gameId/end-turn')
  async processEndTurn(
    @Param('gameId') gameId: string,
    @Body()
    body: {
      playerId: string;
      viewerId?: string;
    },
  ): Promise<IPublicGameState> {
    return this.debugService.processEndTurn(
      gameId,
      body.playerId,
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

  @Public()
  @Get('server/game/:gameId/pending/:playerId')
  async getPendingInput(
    @Param('gameId') gameId: string,
    @Param('playerId') playerId: string,
  ): Promise<IPlayerInputModel | null> {
    return this.debugService.getPendingInput(gameId, playerId);
  }

  // ── Solar-system sandbox ────────────────────────────────────────────────
  // Low-level board mutators that bypass action validation. Intended for the
  // client debug page (/debug/game) to verify data-driven view effects.

  @Public()
  @Post('server/game/:gameId/solar-rotate')
  async solarRotate(
    @Param('gameId') gameId: string,
    @Body() body: { discIndex: number; viewerId?: string },
  ): Promise<IPublicGameState> {
    return this.debugService.solarRotate(
      gameId,
      body.discIndex,
      body.viewerId ?? '',
    );
  }

  @Public()
  @Post('server/game/:gameId/place-probe')
  async placeProbeDirect(
    @Param('gameId') gameId: string,
    @Body() body: { playerId: string; spaceId: string; viewerId?: string },
  ): Promise<IPublicGameState> {
    return this.debugService.placeProbeDirect(
      gameId,
      body.playerId,
      body.spaceId,
      body.viewerId ?? body.playerId,
    );
  }

  @Public()
  @Post('server/game/:gameId/move-probe')
  async moveProbeDirect(
    @Param('gameId') gameId: string,
    @Body() body: { probeId: string; toSpaceId: string; viewerId?: string },
  ): Promise<IPublicGameState> {
    return this.debugService.moveProbeDirect(
      gameId,
      body.probeId,
      body.toSpaceId,
      body.viewerId ?? '',
    );
  }
}
