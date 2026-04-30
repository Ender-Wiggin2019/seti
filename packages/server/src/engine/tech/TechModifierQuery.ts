import type { ETechId } from '@seti/common/types/tech';
import type { IComputerSlotReward, IScanTechEffect, ITech } from './ITech.js';
import type { TechBoard } from './TechBoard.js';
import { createTech } from './TechRegistry.js';

/**
 * Aggregates modifier queries across all techs owned by a player.
 *
 * The game engine uses this to compute effective values (landing cost,
 * probe limit, etc.) by piping through each owned tech's modifier.
 *
 * Example:
 *   const query = TechModifierQuery.forPlayer(techBoard, playerId);
 *   const effectiveLimit = query.getProbeSpaceLimit(1);
 *   const effectiveCost = query.getLandingCost(3);
 */
export class TechModifierQuery {
  private readonly techs: ITech[];

  private constructor(techs: ITech[]) {
    this.techs = techs;
  }

  /** Build a query from the techs a player owns on the board */
  public static forPlayer(
    techBoard: TechBoard,
    playerId: string,
  ): TechModifierQuery {
    const techIds = techBoard.getPlayerTechs(playerId);
    const techs = techIds.map((id) => createTech(id));
    return new TechModifierQuery(techs);
  }

  /** Build a query from explicit tech IDs (useful for testing) */
  public static fromTechIds(techIds: ETechId[]): TechModifierQuery {
    const techs = techIds.map((id) => createTech(id));
    return new TechModifierQuery(techs);
  }

  /** Pipeline base value through all owned techs' probe limit modifiers */
  public getProbeSpaceLimit(baseLimit = 1): number {
    return this.techs.reduce(
      (limit, tech) => tech.modifyProbeSpaceLimit?.(limit) ?? limit,
      baseLimit,
    );
  }

  /** Pipeline base asteroid leave cost through all modifiers */
  public getAsteroidLeaveCost(baseCost = 1): number {
    return this.techs.reduce(
      (cost, tech) => tech.modifyAsteroidLeaveCost?.(cost) ?? cost,
      baseCost,
    );
  }

  /** Whether any owned tech grants asteroid publicity */
  public hasAsteroidPublicity(): boolean {
    return this.techs.some((tech) => tech.grantsAsteroidPublicity?.() === true);
  }

  /** Pipeline base landing cost through all modifiers */
  public getLandingCost(baseCost: number): number {
    return this.techs.reduce(
      (cost, tech) => tech.modifyLandingCost?.(cost) ?? cost,
      baseCost,
    );
  }

  /** Whether any owned tech allows moon landing */
  public canLandOnMoon(): boolean {
    return this.techs.some((tech) => tech.grantsMoonLanding?.() === true);
  }

  /** Collect all scan tech effects from owned scan techs */
  public getScanModifiers(): IScanTechEffect[] {
    return this.techs.flatMap((tech) => tech.getScanModifiers?.() ?? []);
  }

  /** Get computer slot reward for a specific tech */
  public getComputerSlotReward(
    techId: ETechId,
    slotIndex: number,
  ): IComputerSlotReward | undefined {
    const tech = this.techs.find((t) => t.id === techId);
    return tech?.getComputerSlotReward?.(slotIndex);
  }
}
