import type { ESector } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import {
  type IMarkSectorSignalResult,
  MarkSectorSignalEffect,
} from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { ScanEffect } from '@/engine/effects/scan/ScanEffect.js';
import {
  extractSectorColorFromCardItem,
  findAllSectorsByColor,
  findSectorById,
  getSectorIdsWithPlayerProbes,
  getSectorIndexByPlanet,
} from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectCard } from '@/engine/input/SelectCard.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { IPlayer, TCardItem } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

type TSectorSignalTarget = {
  id: string;
  color: ESector;
  completed: boolean;
  markSignal(playerId: string): { dataGained: boolean; vpAwarded: number };
};

export function behaviorWithoutCustomIds(
  cardId: string,
  handledCustomIds: readonly string[],
): IBehavior {
  const handled = new Set(handledCustomIds);
  const behavior = behaviorFromEffects(loadCardData(cardId).effects);
  const custom = behavior.custom?.filter((id) => !handled.has(id));
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export function enqueueCoreCardEffect(
  context: ICardRuntimeContext,
  effect: (player: IPlayer, game: IGame) => PlayerInput | undefined,
): void {
  context.game.deferredActions.push(
    new SimpleDeferredAction(
      context.player,
      (game) => effect(context.player, game),
      EPriority.CORE_EFFECT,
    ),
  );
}

export function enqueueScanWithColorScore(
  context: ICardRuntimeContext,
  scoringColor: ESector,
): void {
  enqueueCoreCardEffect(context, (player, game) => {
    const earthSectorIndex = game.solarSystem
      ? (getSectorIndexByPlanet(game.solarSystem, EPlanet.EARTH) ?? 0)
      : 0;

    return ScanEffect.execute(player, game, {
      earthSectorIndex,
      onComplete: (result) => {
        const scanSignals = result.signalResults ?? [
          result.earthSectorSignal,
          result.targetSectorSignal,
        ];
        const matchingSignals = scanSignals.filter((signal) =>
          signalMatchesColor(game, signal, scoringColor),
        );

        player.score += matchingSignals.length * 2;
        return undefined;
      },
    });
  });
}

export function markColorChainWithoutData(
  player: IPlayer,
  game: IGame,
  colors: readonly ESector[],
  onComplete?: () => PlayerInput | undefined,
): PlayerInput | undefined {
  const [color, ...rest] = colors;
  if (color === undefined) {
    return onComplete?.();
  }

  return markByColorWithoutData(player, game, color, () =>
    markColorChainWithoutData(player, game, rest, onComplete),
  );
}

export function createProbeSectorNoDataSignalInput(
  player: IPlayer,
  game: IGame,
  markCount: number,
): PlayerInput | undefined {
  const sectors = getSectorIdsWithPlayerProbes(game, player.id)
    .map((sectorId) => findSectorById(game, sectorId))
    .filter((sector): sector is NonNullable<typeof sector> => sector !== null);

  if (sectors.length === 0) return undefined;
  if (sectors.length === 1) {
    return markSectorWithoutDataRepeatedly(player, game, sectors[0], markCount);
  }

  return new SelectOption(
    player,
    sectors.map((sector) => ({
      id: `probe-sector-${sector.id}`,
      label: `Sector ${sector.id}`,
      onSelect: () =>
        markSectorWithoutDataRepeatedly(player, game, sector, markCount),
    })),
    'Choose sector with your probe',
  );
}

export function createOptionalHandSignalDiscardInput(
  player: IPlayer,
  game: IGame,
  maxCards: number,
): PlayerInput | undefined {
  if (player.hand.length === 0 || maxCards <= 0) return undefined;

  const handCards = player.hand.map((card, index) => {
    const cardId = resolveCardId(card, `hand-card-${index}`);
    return {
      optionId: `${cardId}@${index}`,
      discardCardId: cardId,
      handIndex: index,
      rawCard: card,
    };
  });

  return new SelectCard(
    player,
    {
      cards: handCards.map((card) => ({ id: card.optionId })),
      minSelections: 0,
      maxSelections: Math.min(maxCards, handCards.length),
      onSelect: (selectedIds) => {
        const selected = handCards.filter((card) =>
          selectedIds.includes(card.optionId),
        );
        if (selected.length === 0) return undefined;

        for (const card of [...selected].sort(
          (left, right) => right.handIndex - left.handIndex,
        )) {
          player.removeCardAt(card.handIndex);
        }
        game.mainDeck.discard(...selected.map((card) => card.discardCardId));

        const colors = selected
          .map((card) => extractSectorColorFromCardItem(card.rawCard))
          .filter((color): color is ESector => color !== null);

        return MarkSectorSignalEffect.markByColorChain(player, game, colors);
      },
    },
    'Discard up to 3 cards from hand for signals',
  );
}

export function discardTopDeckCardsForSignals(
  player: IPlayer,
  game: IGame,
  remaining: number,
): PlayerInput | undefined {
  if (remaining <= 0) return undefined;

  const card = game.mainDeck.draw();
  if (card === undefined) {
    return discardTopDeckCardsForSignals(player, game, remaining - 1);
  }

  const cardId = resolveCardId(card, `deck-card-${remaining}`);
  game.mainDeck.discard(cardId);

  const color = extractSectorColorFromCardItem(card);
  if (color === null) {
    return discardTopDeckCardsForSignals(player, game, remaining - 1);
  }

  return MarkSectorSignalEffect.markByColor(player, game, color, () =>
    discardTopDeckCardsForSignals(player, game, remaining - 1),
  );
}

function signalMatchesColor(
  game: IGame,
  signal: IMarkSectorSignalResult | null,
  color: ESector,
): boolean {
  if (!signal) return false;
  return findSectorById(game, signal.sectorId)?.color === color;
}

function markByColorWithoutData(
  player: IPlayer,
  game: IGame,
  color: ESector,
  onComplete?: (
    result: IMarkSectorSignalResult | null,
  ) => PlayerInput | undefined,
): PlayerInput | undefined {
  const sectors = findAllSectorsByColor(game, color);
  if (sectors.length === 0) return onComplete?.(null);
  if (sectors.length === 1) {
    return markSectorWithOumuamuaChoiceWithoutData(
      player,
      game,
      sectors[0],
      onComplete,
    );
  }

  return new SelectOption(
    player,
    sectors.map((sector) => ({
      id: sector.id,
      label: `Sector ${sector.id}`,
      onSelect: () =>
        markSectorWithOumuamuaChoiceWithoutData(
          player,
          game,
          sector,
          onComplete,
        ),
    })),
    `Choose ${color} sector to mark signal`,
  );
}

function markSectorWithoutDataRepeatedly(
  player: IPlayer,
  game: IGame,
  sector: TSectorSignalTarget,
  remaining: number,
): PlayerInput | undefined {
  if (remaining <= 0) return undefined;
  return markSectorWithOumuamuaChoiceWithoutData(player, game, sector, () =>
    markSectorWithoutDataRepeatedly(player, game, sector, remaining - 1),
  );
}

function markSectorWithOumuamuaChoiceWithoutData(
  player: IPlayer,
  game: IGame,
  sector: TSectorSignalTarget,
  onComplete?: (
    result: IMarkSectorSignalResult | null,
  ) => PlayerInput | undefined,
): PlayerInput | undefined {
  const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
  if (plugin instanceof OumuamuaAlienPlugin) {
    return plugin.createSectorOrTileSignalInput(
      player,
      game,
      sector.id,
      () => markOnSectorWithoutData(player, game, sector),
      onComplete,
    );
  }

  const result = markOnSectorWithoutData(player, game, sector);
  return onComplete?.(result);
}

function markOnSectorWithoutData(
  player: IPlayer,
  game: IGame,
  sector: TSectorSignalTarget,
): IMarkSectorSignalResult {
  player.pieces.deploy(EPieceType.SECTOR_MARKER);
  const signalResult = sector.markSignal(player.id);
  game.missionTracker.recordEvent({
    type: EMissionEventType.SIGNAL_PLACED,
    color: sector.color,
  });
  if (signalResult.vpAwarded > 0) {
    player.score += signalResult.vpAwarded;
  }

  return {
    sectorId: sector.id,
    dataGained: false,
    vpAwarded: signalResult.vpAwarded,
    completed: sector.completed,
  };
}

function resolveCardId(card: TCardItem | unknown, fallback: string): string {
  if (typeof card === 'string') return card;
  if (card !== null && typeof card === 'object' && 'id' in card) {
    return String((card as { id?: string }).id ?? fallback);
  }
  return fallback;
}
