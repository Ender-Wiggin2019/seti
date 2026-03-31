import { Injectable } from '@nestjs/common';

interface IDebugSessionMeta {
  humanPlayerId: string;
  botPlayerIds: Set<string>;
}

@Injectable()
export class DebugSessionRegistry {
  private readonly sessionByGameId = new Map<string, IDebugSessionMeta>();

  register(gameId: string, humanPlayerId: string, botPlayerIds: string[]): void {
    this.sessionByGameId.set(gameId, {
      humanPlayerId,
      botPlayerIds: new Set(botPlayerIds),
    });
  }

  isDebugGame(gameId: string): boolean {
    return this.sessionByGameId.has(gameId);
  }

  isBotPlayer(gameId: string, playerId: string): boolean {
    return this.sessionByGameId.get(gameId)?.botPlayerIds.has(playerId) ?? false;
  }

  getHumanPlayerId(gameId: string): string | null {
    return this.sessionByGameId.get(gameId)?.humanPlayerId ?? null;
  }
}
