import { createActionEvent } from '../event/GameEvent.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { SelectGoldTile } from '../input/SelectGoldTile.js';
import type { IPlayer } from '../player/IPlayer.js';

const GOLD_THRESHOLDS = [25, 50, 70];

interface IGoldMilestoneBucket {
  threshold: number;
  resolvedPlayerIds: Set<string>;
}

interface INeutralMilestoneBucket {
  threshold: number;
  markersRemaining: number;
  resolvedPlayerIds: Set<string>;
}

interface IGoldClaim {
  player: IPlayer;
  threshold: number;
}

interface INeutralClaim {
  player: IPlayer;
  threshold: number;
}

export class MilestoneState {
  private readonly goldMilestones: IGoldMilestoneBucket[];

  private readonly neutralMilestones: INeutralMilestoneBucket[];

  private neutralDiscoveryMarkersUsed: number;

  public constructor(
    neutralMilestoneThresholds: number[],
    neutralDiscoveryMarkersCapacity = 6,
  ) {
    this.goldMilestones = GOLD_THRESHOLDS.map((threshold) => ({
      threshold,
      resolvedPlayerIds: new Set<string>(),
    }));

    const groupedNeutralMilestones = new Map<number, number>();
    for (const threshold of neutralMilestoneThresholds) {
      groupedNeutralMilestones.set(
        threshold,
        (groupedNeutralMilestones.get(threshold) ?? 0) + 1,
      );
    }
    this.neutralMilestones = [...groupedNeutralMilestones.entries()]
      .map(([threshold, markersRemaining]) => ({
        threshold,
        markersRemaining,
        resolvedPlayerIds: new Set<string>(),
      }))
      .sort((left, right) => left.threshold - right.threshold);

    this.neutralDiscoveryMarkersUsed =
      neutralDiscoveryMarkersCapacity <= 0 ? 6 : 0;
  }

  public getNeutralDiscoveryMarkersUsed(): number {
    return this.neutralDiscoveryMarkersUsed;
  }

  public checkAndQueue(
    game: IGame,
    currentPlayer: IPlayer,
  ): IPlayerInput | undefined {
    const orderedPlayers = this.getSeatOrderedPlayersFrom(
      game,
      currentPlayer.id,
    );
    const goldClaims: IGoldClaim[] = [];
    const neutralClaims: INeutralClaim[] = [];

    for (const player of orderedPlayers) {
      const playerGoldClaims = this.goldMilestones
        .filter(
          (milestone) =>
            player.score >= milestone.threshold &&
            !milestone.resolvedPlayerIds.has(player.id),
        )
        .map((milestone) => ({ player, threshold: milestone.threshold }));
      goldClaims.push(...playerGoldClaims);
    }

    for (const player of orderedPlayers) {
      for (const milestone of this.neutralMilestones) {
        if (milestone.markersRemaining <= 0) {
          continue;
        }
        if (this.neutralDiscoveryMarkersUsed >= 6) {
          continue;
        }
        if (player.score < milestone.threshold) {
          continue;
        }
        if (milestone.resolvedPlayerIds.has(player.id)) {
          continue;
        }
        neutralClaims.push({ player, threshold: milestone.threshold });
      }
    }

    return this.processClaims(game, goldClaims, neutralClaims, 0);
  }

  private processClaims(
    game: IGame,
    goldClaims: IGoldClaim[],
    neutralClaims: INeutralClaim[],
    index: number,
  ): IPlayerInput | undefined {
    if (index < goldClaims.length) {
      const claim = goldClaims[index];
      return this.resolveGoldClaim(game, claim, () =>
        this.processClaims(game, goldClaims, neutralClaims, index + 1),
      );
    }

    const neutralIndex = index - goldClaims.length;
    if (neutralIndex < neutralClaims.length) {
      this.resolveNeutralClaim(game, neutralClaims[neutralIndex]);
      return this.processClaims(game, goldClaims, neutralClaims, index + 1);
    }

    return undefined;
  }

  private resolveGoldClaim(
    game: IGame,
    claim: IGoldClaim,
    onDone: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    const milestone = this.goldMilestones.find(
      (bucket) => bucket.threshold === claim.threshold,
    );
    if (!milestone || milestone.resolvedPlayerIds.has(claim.player.id)) {
      return onDone();
    }

    const availableTileIds = game.goldScoringTiles
      .filter((tile) => tile.canClaim(claim.player.id))
      .map((tile) => tile.id);

    if (availableTileIds.length === 0) {
      milestone.resolvedPlayerIds.add(claim.player.id);
      return onDone();
    }

    return new SelectGoldTile(
      claim.player,
      availableTileIds,
      (tileId) => {
        const selectedTile = game.goldScoringTiles.find(
          (tile) => tile.id === tileId,
        );
        if (selectedTile) {
          selectedTile.claim(claim.player.id);
        }
        milestone.resolvedPlayerIds.add(claim.player.id);
        game.eventLog.append(
          createActionEvent(claim.player.id, 'MILESTONE_GOLD_RESOLVED', {
            threshold: claim.threshold,
            tileId,
          }),
        );
        return onDone();
      },
      `Resolve ${claim.threshold} VP milestone`,
    );
  }

  private resolveNeutralClaim(game: IGame, claim: INeutralClaim): void {
    const milestone = this.neutralMilestones.find(
      (bucket) => bucket.threshold === claim.threshold,
    );
    if (!milestone) {
      return;
    }
    if (
      milestone.markersRemaining <= 0 ||
      milestone.resolvedPlayerIds.has(claim.player.id) ||
      this.neutralDiscoveryMarkersUsed >= 6
    ) {
      return;
    }

    milestone.markersRemaining -= 1;
    milestone.resolvedPlayerIds.add(claim.player.id);
    this.neutralDiscoveryMarkersUsed += 1;

    const placement = game.alienState.placeNeutralMarker();

    game.eventLog.append(
      createActionEvent(claim.player.id, 'MILESTONE_NEUTRAL_RESOLVED', {
        threshold: claim.threshold,
        neutralDiscoveryMarkersUsed: this.neutralDiscoveryMarkersUsed,
        alienIndex: placement?.alienIndex ?? null,
        traceColor: placement?.traceColor ?? null,
      }),
    );
  }

  private getSeatOrderedPlayersFrom(
    game: IGame,
    startingPlayerId: string,
  ): IPlayer[] {
    const startIndex = game.players.findIndex(
      (player) => player.id === startingPlayerId,
    );
    if (startIndex < 0) {
      return [...game.players];
    }
    const ordered: IPlayer[] = [];
    for (let offset = 0; offset < game.players.length; offset += 1) {
      ordered.push(game.players[(startIndex + offset) % game.players.length]);
    }
    return ordered;
  }
}
