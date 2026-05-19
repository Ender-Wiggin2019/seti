import {
  ANOMALY_COLUMN_REWARD_LADDER,
  ANOMALY_TOKEN_REWARD_OPTIONS,
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

export const ANOMALY_COLUMN_PREFIX = 'anomaly-column';
type TAnomalyTraceColor = ETrace.PINK | ETrace.YELLOW | ETrace.BLUE;

const TRACE_COLORS: TAnomalyTraceColor[] = [
  ETrace.PINK,
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
      // Skip if this column has already been laid down (e.g. on re-discover).
      if (board.getSlot(this.buildColumnSlotId(board.alienIndex, color, 1))) {
        continue;
      }
      // Per the rule, players choose any available column slot — they are
      // NOT forced to fill bottom-up. Each tier is its own slot:
      //   tier 1 (bottom)        single-cap, ladder[0] = 4 VP + alien card
      //   tier 2                 single-cap, ladder[1] = 2 VP + alien card
      //   tier 3                 single-cap, ladder[2] = 2 VP + 1 publicity
      //   tier 4                 single-cap, ladder[3] = 3 VP
      //   tier 5 (top overflow)  unlimited,  ladder[4] = 2 VP per occupant
      for (let tier = 1; tier <= ANOMALY_COLUMN_REWARD_LADDER.length; tier += 1) {
        const ladderRewards = ANOMALY_COLUMN_REWARD_LADDER[tier - 1] ?? [];
        const isOverflowTier = tier === ANOMALY_COLUMN_REWARD_LADDER.length;
        board.addAnomalyColumn({
          slotId: this.buildColumnSlotId(board.alienIndex, color, tier),
          alienIndex: board.alienIndex,
          traceColor: color,
          maxOccupants: isOverflowTier ? -1 : 1,
          rewards: ladderRewards.map((reward) => ({ ...reward })),
          isDiscovery: false,
        });
      }
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

  // Each Anomaly column slot now carries its own static rewards from the
  // ladder, so reward delivery happens entirely through
  // `AlienState.executeRewards` driven off `slot.rewards`. Plugin-side
  // dynamic reward projection is no longer needed here.

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
    // Walk tiers from top (overflow) to bottom; within a tier scan latest-placed
    // first. The first non-neutral occupant we find is the column leader.
    const columnSlots = this.getColumnSlotsByColor(board, color);
    for (let tier = columnSlots.length - 1; tier >= 0; tier -= 1) {
      const slot = columnSlots[tier];
      if (!slot) continue;
      for (let i = slot.occupants.length - 1; i >= 0; i -= 1) {
        const occupant = slot.occupants[i];
        if (occupant.source !== 'neutral') {
          return occupant.source.playerId;
        }
      }
    }
    return undefined;
  }

  private getColumnSlotsByColor(
    board: AnomaliesAlienBoard,
    color: ETrace,
  ): ITraceSlot[] {
    // Returned bottom→top so callers can walk tiers in either direction.
    return Array.from(
      { length: ANOMALY_COLUMN_REWARD_LADDER.length },
      (_, index) =>
        board.anomalyColumns.find(
          (slot) =>
            slot.slotId ===
            this.buildColumnSlotId(board.alienIndex, color, index + 1),
        ),
    ).filter((slot): slot is ITraceSlot => slot !== undefined);
  }

  private buildColumnSlotId(
    alienIndex: number,
    color: ETrace,
    tier: number,
  ): string {
    return `alien-${alienIndex}-${ANOMALY_COLUMN_PREFIX}|${color}|${tier}`;
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
