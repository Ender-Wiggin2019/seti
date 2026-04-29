import { ETech } from '@seti/common/types/element';
import {
  type ETechId,
  getTechDescriptor,
  type TTechCategory,
} from '@seti/common/types/tech';
import { RotateDiscEffect } from '@/engine/effects/index.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { createTech } from '@/engine/tech/TechRegistry.js';

export function otherPlayerHasTech(
  player: IPlayer,
  game: IGame,
  techId: ETechId,
): boolean {
  return game.players.some(
    (candidate) =>
      candidate.id !== player.id && candidate.techs.includes(techId),
  );
}

export function countOwnedTechsOfSameType(
  player: IPlayer,
  techId: ETechId,
): number {
  const techType = getTechDescriptor(techId).type;
  return player.techs.filter(
    (ownedTechId) => getTechDescriptor(ownedTechId).type === techType,
  ).length;
}

export function rotateAndResearchTech(
  player: IPlayer,
  game: IGame,
  categories: TTechCategory[],
  onComplete?: (techId: ETechId) => IPlayerInput | undefined,
): IPlayerInput | undefined {
  RotateDiscEffect.execute(game);

  const filter = { mode: 'category' as const, categories };
  if (!ResearchTechEffect.canExecute(player, game, filter)) {
    return undefined;
  }

  return ResearchTechEffect.execute(player, game, {
    filter,
    onComplete: (result) => onComplete?.(result.techId),
  });
}

export function availableTechsResearchedByOthers(
  player: IPlayer,
  game: IGame,
): ETechId[] {
  const techBoard = game.techBoard;
  if (!techBoard) return [];

  return techBoard
    .getAvailableTechs(player.id)
    .filter((techId) => otherPlayerHasTech(player, game, techId));
}

export function takeTechWithoutPrintedBonus(
  player: IPlayer,
  game: IGame,
  techId: ETechId,
): IPlayerInput | undefined {
  const techBoard = game.techBoard;
  if (!techBoard?.canResearch(player.id, techId)) {
    return undefined;
  }

  const result = techBoard.take(player.id, techId);
  player.gainTech(techId);
  result.tile.tech.onAcquire?.(player);

  const descriptor = getTechDescriptor(techId);
  game.missionTracker.recordEvent({
    type: EMissionEventType.TECH_RESEARCHED,
    techCategory: descriptor.type,
  });

  if (descriptor.type !== ETech.COMPUTER) {
    return undefined;
  }

  return buildComputerTechPlacement(player, techId);
}

function buildComputerTechPlacement(
  player: IPlayer,
  techId: ETechId,
): IPlayerInput | undefined {
  const eligibleColumns = player.computer.getEligibleTechColumns();
  if (eligibleColumns.length === 0) return undefined;

  const tech = createTech(techId);
  const bottomReward = tech.getComputerSlotReward?.(1) ?? {};

  if (eligibleColumns.length === 1) {
    player.computer.placeTech(eligibleColumns[0], { techId, bottomReward });
    return undefined;
  }

  return new SelectOption(
    player,
    eligibleColumns.map((columnIndex) => ({
      id: `col-${columnIndex}`,
      label: `Column ${columnIndex + 1}`,
      onSelect: () => {
        player.computer.placeTech(columnIndex, { techId, bottomReward });
        return undefined;
      },
    })),
    'Select a computer column for the tech',
  );
}
