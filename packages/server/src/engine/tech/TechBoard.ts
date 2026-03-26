import { ETech } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type {
  IPublicTechBoard,
  IPublicTechStack,
} from '@seti/common/types/protocol/gameState';
import {
  type ETechId,
  FIRST_TAKE_VP_BONUS,
  getTechId,
  type ITechBonusToken,
  TECH_CATEGORIES,
  TECH_LEVELS,
  TILES_PER_STACK,
  type TTechCategory,
  type TTechLevel,
} from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { ITech } from './ITech.js';
import { TECH_BONUS_POOLS } from './TechBonusConfig.js';
import { createTech } from './TechRegistry.js';

export interface ITechTile {
  tech: ITech;
  bonus?: ITechBonusToken;
}

export interface ITechStack {
  readonly category: TTechCategory;
  readonly level: TTechLevel;
  readonly techId: ETechId;
  tiles: ITechTile[];
  firstTakeBonusAvailable: boolean;
}

export interface ITakeResult {
  tile: ITechTile;
  vpBonus: number;
}

export class TechBoard {
  public readonly stacks: Map<ETechId, ITechStack>;

  /** Tracks which techs each player owns (prevents duplicates) */
  private readonly playerTechs: Map<string, Set<ETechId>>;

  public constructor(rng: SeededRandom) {
    this.stacks = new Map();
    this.playerTechs = new Map();

    for (const category of TECH_CATEGORIES) {
      for (const level of TECH_LEVELS) {
        const techId = getTechId(category, level);
        const bonusPool = TECH_BONUS_POOLS[techId];
        const shuffledBonuses = bonusPool
          ? rng.shuffle([...bonusPool])
          : undefined;

        const tiles: ITechTile[] = Array.from(
          { length: TILES_PER_STACK },
          (_, i) => ({
            tech: createTech(techId),
            bonus: shuffledBonuses?.[i],
          }),
        );

        const shuffledTiles = rng.shuffle(tiles);

        this.stacks.set(techId, {
          category,
          level,
          techId,
          tiles: shuffledTiles,
          firstTakeBonusAvailable: true,
        });
      }
    }
  }

  /** Whether the player can take a specific tech (stack non-empty + not already owned) */
  public canResearch(playerId: string, techId: ETechId): boolean {
    const stack = this.stacks.get(techId);
    if (!stack || stack.tiles.length === 0) {
      return false;
    }
    return !this.playerOwns(playerId, techId);
  }

  /**
   * Take the top tile from a tech stack.
   * Returns the tile and any first-take VP bonus.
   */
  public take(playerId: string, techId: ETechId): ITakeResult {
    if (!this.canResearch(playerId, techId)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Cannot research this tech',
        { playerId, techId },
      );
    }

    const stack = this.stacks.get(techId)!;
    const tile = stack.tiles.shift()!;

    let vpBonus = 0;
    if (stack.firstTakeBonusAvailable) {
      stack.firstTakeBonusAvailable = false;
      vpBonus = FIRST_TAKE_VP_BONUS;
    }

    this.recordPlayerTech(playerId, techId);

    return { tile, vpBonus };
  }

  /** List all tech IDs the player can currently research */
  public getAvailableTechs(playerId: string): ETechId[] {
    const available: ETechId[] = [];
    for (const [techId, stack] of this.stacks) {
      if (stack.tiles.length > 0 && !this.playerOwns(playerId, techId)) {
        available.push(techId);
      }
    }
    return available;
  }

  /** Get the stack for a specific tech */
  public getStack(techId: ETechId): ITechStack | undefined {
    return this.stacks.get(techId);
  }

  /** Whether a player already owns a given tech */
  public playerOwns(playerId: string, techId: ETechId): boolean {
    return this.playerTechs.get(playerId)?.has(techId) === true;
  }

  /** Get all tech IDs owned by a player */
  public getPlayerTechs(playerId: string): ETechId[] {
    const set = this.playerTechs.get(playerId);
    return set ? [...set] : [];
  }

  /** Convert to public state for client */
  public toPublicState(): IPublicTechBoard {
    const stacks: IPublicTechStack[] = [];
    for (const category of TECH_CATEGORIES) {
      for (const level of TECH_LEVELS) {
        const techId = getTechId(category, level);
        const stack = this.stacks.get(techId);
        if (stack) {
          stacks.push({
            tech: category as ETech,
            level,
            remainingTiles: stack.tiles.length,
            firstTakeBonusAvailable: stack.firstTakeBonusAvailable,
          });
        }
      }
    }
    return { stacks };
  }

  private recordPlayerTech(playerId: string, techId: ETechId): void {
    let set = this.playerTechs.get(playerId);
    if (!set) {
      set = new Set();
      this.playerTechs.set(playerId, set);
    }
    set.add(techId);
  }
}
