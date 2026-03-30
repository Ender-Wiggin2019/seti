import { EEffectType } from '@seti/common/types/effect';
import {
  ECardType,
  EMiscIcon,
  EResource,
  ETech,
  ETrace,
} from '@seti/common/types/element';
import { type ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { hasCardData, loadCardData } from '../cards/loadCardData.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import { EPieceType } from '../player/Pieces.js';

export type TGoldScoringTileId = 'tech' | 'mission' | 'income' | 'other';
export type TGoldScoringTileSide = 'A' | 'B';

export interface IGoldTileClaim {
  playerId: string;
  value: number;
}

export interface IGoldScoringTileInit {
  id: TGoldScoringTileId;
  side: TGoldScoringTileSide;
  slotValues?: number[];
}

const DEFAULT_SLOT_VALUES = [5, 4, 3, 2];

type TFormula = (player: IPlayer, game: IGame) => number;

function asCardId(card: unknown): string | undefined {
  if (typeof card === 'string') {
    return card;
  }
  return (card as { id?: string })?.id;
}

function getTuckedIncomeCounts(player: IPlayer): Record<EResource, number> {
  const counts: Record<EResource, number> = {
    [EResource.CREDIT]: 0,
    [EResource.ENERGY]: 0,
    [EResource.DATA]: 0,
    [EResource.PUBLICITY]: 0,
    [EResource.SCORE]: 0,
    [EResource.CARD]: 0,
    [EResource.CARD_ANY]: 0,
    [EResource.MOVE]: 0,
  };

  for (const tuckedCard of player.tuckedIncomeCards) {
    if (typeof tuckedCard !== 'string') {
      const income = (tuckedCard as { income?: EResource })?.income;
      if (income && income in counts) {
        counts[income] += 1;
      }
      continue;
    }

    if (!hasCardData(tuckedCard)) {
      continue;
    }
    const cardData = loadCardData(tuckedCard);
    if (cardData.income in counts) {
      counts[cardData.income] += 1;
    }
  }

  return counts;
}

function getTraceCount(player: IPlayer, trace: ETrace): number {
  if (trace === ETrace.ANY) {
    return (
      (player.traces[ETrace.RED] ?? 0) +
      (player.traces[ETrace.YELLOW] ?? 0) +
      (player.traces[ETrace.BLUE] ?? 0)
    );
  }
  return player.traces[trace] ?? 0;
}

function getSectorWinCount(player: IPlayer, game: IGame): number {
  return game.sectors.reduce((total, sectorLike) => {
    const sectorWinners = (sectorLike as { sectorWinners?: string[] })
      .sectorWinners;
    if (!sectorWinners) {
      return total;
    }
    return total + sectorWinners.filter((id) => id === player.id).length;
  }, 0);
}

function getTechCategoryCount(techIds: ETechId[], category: ETech): number {
  return techIds.filter((techId) => getTechDescriptor(techId).type === category)
    .length;
}

function getFormula(
  id: TGoldScoringTileId,
  side: TGoldScoringTileSide,
): TFormula {
  if (id === 'tech' && side === 'A') {
    return (player) => {
      const probeCount = getTechCategoryCount(player.techs, ETech.PROBE);
      const scanCount = getTechCategoryCount(player.techs, ETech.SCAN);
      const computerCount = getTechCategoryCount(player.techs, ETech.COMPUTER);
      return Math.min(probeCount, scanCount, computerCount);
    };
  }

  if (id === 'tech' && side === 'B') {
    return (player) => Math.floor(player.techs.length / 2);
  }

  if (id === 'mission' && side === 'A') {
    return (player) => player.completedMissions.length;
  }

  if (id === 'mission' && side === 'B') {
    return (player) => {
      const incomeCounts = getTuckedIncomeCounts(player);
      return Math.min(
        incomeCounts[EResource.CREDIT],
        incomeCounts[EResource.ENERGY],
        incomeCounts[EResource.CARD],
      );
    };
  }

  if (id === 'income' && side === 'A') {
    return (player) => {
      const incomeCounts = getTuckedIncomeCounts(player);
      return Math.max(
        incomeCounts[EResource.CREDIT],
        incomeCounts[EResource.ENERGY],
      );
    };
  }

  if (id === 'income' && side === 'B') {
    return (player) =>
      Math.min(
        getTraceCount(player, ETrace.RED),
        getTraceCount(player, ETrace.YELLOW),
        getTraceCount(player, ETrace.BLUE),
      );
  }

  if (id === 'other' && side === 'A') {
    return (player, game) => {
      const wins = getSectorWinCount(player, game);
      const orbitersAndLanders =
        player.pieces.deployed(EPieceType.ORBITER) +
        player.pieces.deployed(EPieceType.LANDER);
      return Math.min(wins, orbitersAndLanders);
    };
  }

  return (player) =>
    Math.floor(
      (player.completedMissions.length + player.endGameCards.length) / 2,
    );
}

export class GoldScoringTile {
  public readonly id: TGoldScoringTileId;

  public readonly side: TGoldScoringTileSide;

  public readonly slotValues: readonly number[];

  public readonly claims: IGoldTileClaim[];

  private readonly formula: TFormula;

  public constructor(init: IGoldScoringTileInit) {
    this.id = init.id;
    this.side = init.side;
    this.slotValues = [...(init.slotValues ?? DEFAULT_SLOT_VALUES)];
    this.claims = [];
    this.formula = getFormula(this.id, this.side);
  }

  public canClaim(playerId: string): boolean {
    if (this.claims.length >= this.slotValues.length) {
      return false;
    }
    return !this.claims.some((claim) => claim.playerId === playerId);
  }

  public claim(playerId: string): number {
    if (!this.canClaim(playerId)) {
      return 0;
    }
    const value = this.slotValues[this.claims.length] ?? 0;
    this.claims.push({ playerId, value });
    return value;
  }

  public scorePlayer(player: IPlayer, game: IGame): number {
    const claim = this.claims.find((entry) => entry.playerId === player.id);
    if (!claim) {
      return 0;
    }
    return claim.value * this.formula(player, game);
  }
}

export function scoreEndGameCard(
  card: unknown,
  player: IPlayer,
  game: IGame,
): number {
  if (typeof card === 'object' && card !== null) {
    const explicitScore = (card as { endGameScore?: number }).endGameScore;
    if (typeof explicitScore === 'number') {
      return explicitScore;
    }
  }

  const cardId = asCardId(card);
  if (!cardId || !hasCardData(cardId)) {
    return 0;
  }

  const cardData = loadCardData(cardId);
  return cardData.effects.reduce<number>((total, effect) => {
    if (effect.effectType !== EEffectType.END_GAME) {
      return total;
    }

    const baseScore = effect.score ?? 0;
    if (!effect.per) {
      return total + baseScore;
    }

    if (
      effect.per.type === ETech.PROBE ||
      effect.per.type === ETech.SCAN ||
      effect.per.type === ETech.COMPUTER
    ) {
      return (
        total + baseScore * getTechCategoryCount(player.techs, effect.per.type)
      );
    }

    if (
      effect.per.type === ETrace.RED ||
      effect.per.type === ETrace.YELLOW ||
      effect.per.type === ETrace.BLUE ||
      effect.per.type === ETrace.ANY
    ) {
      return total + baseScore * getTraceCount(player, effect.per.type);
    }

    if (effect.per.type === ECardType.MISSION) {
      return total + baseScore * player.completedMissions.length;
    }

    if (effect.per.type === EMiscIcon.CREDIT_INCOME) {
      return (
        total + baseScore * getTuckedIncomeCounts(player)[EResource.CREDIT]
      );
    }

    if (effect.per.type === EMiscIcon.ENERGY_INCOME) {
      return (
        total + baseScore * getTuckedIncomeCounts(player)[EResource.ENERGY]
      );
    }

    if (effect.per.type === EMiscIcon.CARD_INCOME) {
      return total + baseScore * getTuckedIncomeCounts(player)[EResource.CARD];
    }

    if (effect.per.type === EMiscIcon.ORBIT_COUNT) {
      return total + baseScore * player.pieces.deployed(EPieceType.ORBITER);
    }

    if (effect.per.type === EMiscIcon.LAND_COUNT) {
      return total + baseScore * player.pieces.deployed(EPieceType.LANDER);
    }

    if (effect.per.type === EMiscIcon.ORBIT_OR_LAND_COUNT) {
      return (
        total +
        baseScore *
          (player.pieces.deployed(EPieceType.ORBITER) +
            player.pieces.deployed(EPieceType.LANDER))
      );
    }

    return total;
  }, 0);
}
