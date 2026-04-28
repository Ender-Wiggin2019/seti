import {
  ANOMALY_TOKEN_REWARD_OPTIONS,
  getAnomalyColumnRewardsForPlacement,
} from '@seti/common/constant/alienBoardConfig';
import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { getSectorIndexByPlanet } from '../../effects/scan/ScanEffectUtils.js';
import { createActionEvent } from '../../event/GameEvent.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  type AnomaliesAlienBoard,
  type ITraceSlot,
  isAnomaliesAlienBoard,
} from '../AlienBoard.js';
import { executeSimpleSlotRewards } from '../AlienRewards.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

const ANOMALY_COLUMN_PREFIX = 'anomaly-column';
type TAnomalyTraceColor = ETrace.RED | ETrace.YELLOW | ETrace.BLUE;

const TRACE_COLORS: TAnomalyTraceColor[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

export class AnomaliesAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.ANOMALIES;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!isAnomaliesAlienBoard(board)) return undefined;
    const solarSystem = game.solarSystem;
    if (!solarSystem) return undefined;

    for (const color of TRACE_COLORS) {
      if (board.getSlot(this.buildColumnSlotId(board.alienIndex, color))) {
        continue;
      }
      board.addAnomalyColumn({
        slotId: this.buildColumnSlotId(board.alienIndex, color),
        alienIndex: board.alienIndex,
        traceColor: color,
        maxOccupants: -1,
        rewards: [],
        isDiscovery: false,
      });
    }

    const existingTokens = solarSystem.getAlienTokensByType(
      EAlienType.ANOMALIES,
    );
    const existingTokenCount = existingTokens.length;
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
      const tokenId = this.buildTokenId(
        board.alienIndex,
        anomalySectors[i],
        color,
      );
      if (existingTokens.some((token) => token.tokenId === tokenId)) {
        continue;
      }
      const rewardOptions = ANOMALY_TOKEN_REWARD_OPTIONS[color];
      const reward = rewardOptions[game.random.nextInt(rewardOptions.length)];
      solarSystem.addAlienToken({
        tokenId,
        alienType: EAlienType.ANOMALIES,
        sectorIndex: anomalySectors[i],
        traceColor: color,
        rewards: reward ? [{ ...reward }] : [],
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
    if (!isAnomaliesAlienBoard(board) || !board.discovered) return;

    const earthSectorIndex = this.getEarthSectorIndex(game);
    if (earthSectorIndex === null) return;

    const triggeredToken = game.solarSystem
      ?.getAlienTokensByType(EAlienType.ANOMALIES)
      .find((token) => token.sectorIndex === earthSectorIndex);
    if (!triggeredToken) return;

    const leaderPlayerId = this.getColumnLeaderPlayerId(
      board,
      triggeredToken.traceColor,
    );
    if (!leaderPlayerId) return;

    const player = game.players.find(
      (candidate) => candidate.id === leaderPlayerId,
    );
    if (!player) return;

    executeSimpleSlotRewards(player, game, triggeredToken.rewards);

    game.eventLog.append(
      createActionEvent(player.id, 'ANOMALY_TRIGGERED', {
        color: triggeredToken.traceColor,
        sectorIndex: triggeredToken.sectorIndex,
      }),
    );
  }

  private getEarthSectorIndex(game: IGame): number | null {
    if (!game.solarSystem) return null;
    return getSectorIndexByPlanet(game.solarSystem, EPlanet.EARTH);
  }

  private getColumnLeaderPlayerId(
    board: AnomaliesAlienBoard,
    color: ETrace,
  ): string | undefined {
    const columnSlot = board.anomalyColumns.find(
      (slot) => slot.slotId === this.buildColumnSlotId(board.alienIndex, color),
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

  private buildTokenId(
    alienIndex: number,
    sectorIndex: number,
    color: ETrace,
  ): string {
    return `alien-${alienIndex}-anomaly-token|${sectorIndex}|${color}`;
  }

  private isAnomalyColumnSlot(slotId: string): boolean {
    return slotId.includes(ANOMALY_COLUMN_PREFIX);
  }
}
