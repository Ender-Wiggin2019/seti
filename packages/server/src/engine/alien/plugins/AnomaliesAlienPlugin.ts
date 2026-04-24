import {
  ANOMALY_TOKEN_REWARD_OPTIONS,
  getAnomalyColumnRewardsForPlacement,
} from '@seti/common/constant/alienBoardConfig';
import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { createActionEvent } from '../../event/GameEvent.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { AlienBoard, ITraceSlot } from '../AlienBoard.js';
import { executeSimpleSlotRewards } from '../AlienRewards.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

const ANOMALY_COLUMN_PREFIX = 'anomaly-column';
const ANOMALY_TOKEN_PREFIX = 'anomaly-token';
type TAnomalyTraceColor = ETrace.RED | ETrace.YELLOW | ETrace.BLUE;

const TRACE_COLORS: TAnomalyTraceColor[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

interface IParsedAnomalyToken {
  sectorIndex: number;
  color: TAnomalyTraceColor;
}

export class AnomaliesAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.ANOMALIES;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!board) return undefined;

    for (const color of TRACE_COLORS) {
      if (board.getSlot(this.buildColumnSlotId(board.alienIndex, color))) {
        continue;
      }
      board.addSlot({
        slotId: this.buildColumnSlotId(board.alienIndex, color),
        alienIndex: board.alienIndex,
        traceColor: color,
        maxOccupants: -1,
        rewards: [],
        isDiscovery: false,
      });
    }

    const existingTokenCount = board.slots.filter((slot) =>
      this.isAnomalyTokenSlot(slot.slotId),
    ).length;
    if (existingTokenCount >= TRACE_COLORS.length) {
      return undefined;
    }

    const earthSectorIndex = this.getEarthSectorIndex(game);
    if (earthSectorIndex === null) return undefined;

    const sectorCount = game.sectors.length > 0 ? game.sectors.length : 8;
    const anomalySectors = [
      earthSectorIndex,
      (earthSectorIndex + 3) % sectorCount,
      (earthSectorIndex + sectorCount - 3) % sectorCount,
    ];

    const shuffledColors = game.random.shuffle([...TRACE_COLORS]);
    for (let i = 0; i < anomalySectors.length; i += 1) {
      const color = shuffledColors[i] ?? TRACE_COLORS[i];
      const tokenSlotId = this.buildTokenSlotId(
        board.alienIndex,
        anomalySectors[i],
        color,
      );
      if (board.getSlot(tokenSlotId)) continue;
      const rewardOptions = ANOMALY_TOKEN_REWARD_OPTIONS[color];
      const reward = rewardOptions[game.random.nextInt(rewardOptions.length)];
      board.addSlot({
        slotId: tokenSlotId,
        alienIndex: board.alienIndex,
        traceColor: color,
        maxOccupants: 0,
        rewards: reward ? [{ ...reward }] : [],
        isDiscovery: false,
      });
    }

    return undefined;
  }

  public onPlaceTraceOnSlot(
    game: IGame,
    player: IPlayer,
    slot: ITraceSlot,
  ): void {
    if (!this.isAnomalyColumnSlot(slot.slotId)) return;
    const rewards = getAnomalyColumnRewardsForPlacement(slot.occupants.length);
    executeSimpleSlotRewards(player, game, rewards);
  }

  public onSolarSystemRotated(game: IGame): void {
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!board || !board.discovered) return;

    const earthSectorIndex = this.getEarthSectorIndex(game);
    if (earthSectorIndex === null) return;

    const triggeredToken = board.slots
      .filter((slot) => this.isAnomalyTokenSlot(slot.slotId))
      .map((slot) => ({ slot, token: this.parseToken(slot.slotId) }))
      .find(
        ({ token }) => token !== null && token.sectorIndex === earthSectorIndex,
      );
    if (!triggeredToken || !triggeredToken.token) return;

    const leaderPlayerId = this.getColumnLeaderPlayerId(
      board,
      triggeredToken.token.color,
    );
    if (!leaderPlayerId) return;

    const player = game.players.find(
      (candidate) => candidate.id === leaderPlayerId,
    );
    if (!player) return;

    executeSimpleSlotRewards(player, game, triggeredToken.slot.rewards);

    game.eventLog.append(
      createActionEvent(player.id, 'ANOMALY_TRIGGERED', {
        color: triggeredToken.token.color,
        sectorIndex: triggeredToken.token.sectorIndex,
      }),
    );
  }

  private getEarthSectorIndex(game: IGame): number | null {
    if (!game.solarSystem) return null;
    const ss = game.solarSystem as {
      getSectorIndexOfPlanet?: (p: EPlanet) => number | null;
      getSpacesOnPlanet: (p: EPlanet) => Array<{
        ringIndex: number;
        indexInRing: number;
      }>;
    };
    if (typeof ss.getSectorIndexOfPlanet === 'function') {
      return ss.getSectorIndexOfPlanet(EPlanet.EARTH);
    }
    const earthSpaces = ss.getSpacesOnPlanet(EPlanet.EARTH);
    if (earthSpaces.length === 0) return null;
    const earthSpace = earthSpaces[0];
    return Math.floor(earthSpace.indexInRing / earthSpace.ringIndex);
  }

  private getColumnLeaderPlayerId(
    board: AlienBoard,
    color: ETrace,
  ): string | undefined {
    const columnSlot = board.getSlot(
      this.buildColumnSlotId(board.alienIndex, color),
    );
    if (!columnSlot || columnSlot.occupants.length === 0) return undefined;

    for (let i = columnSlot.occupants.length - 1; i >= 0; i -= 1) {
      const occupant = columnSlot.occupants[i];
      if (occupant.source !== 'neutral') {
        return occupant.source.playerId;
      }
    }
    return undefined;
  }

  private buildColumnSlotId(alienIndex: number, color: ETrace): string {
    return `alien-${alienIndex}-${ANOMALY_COLUMN_PREFIX}|${color}`;
  }

  private buildTokenSlotId(
    alienIndex: number,
    sectorIndex: number,
    color: ETrace,
  ): string {
    return `alien-${alienIndex}-${ANOMALY_TOKEN_PREFIX}|${sectorIndex}|${color}`;
  }

  private parseToken(slotId: string): IParsedAnomalyToken | null {
    const parts = slotId.split('|');
    if (parts.length !== 3) return null;
    const sectorIndex = Number(parts[1]);
    const color = parts[2] as TAnomalyTraceColor;
    if (!Number.isInteger(sectorIndex)) return null;
    if (!TRACE_COLORS.includes(color)) return null;
    return { sectorIndex, color };
  }

  private isAnomalyTokenSlot(slotId: string): boolean {
    return slotId.includes(ANOMALY_TOKEN_PREFIX);
  }

  private isAnomalyColumnSlot(slotId: string): boolean {
    return slotId.includes(ANOMALY_COLUMN_PREFIX);
  }
}
