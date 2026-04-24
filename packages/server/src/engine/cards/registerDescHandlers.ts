/**
 * Registers custom DESC effect handlers on the default BehaviorExecutor.
 *
 * DESC effects use `effect.desc` as their lookup token (see `appendCustom` in
 * Behavior.ts). Each handler receives `(player, game, card)` and may return
 * an `IPlayerInput` to prompt the user.
 *
 * Cards whose DESC text is purely informational (e.g. rule reminders or
 * flavour) do NOT need a handler — the executor gracefully skips unhandled
 * custom IDs.  Only register a handler when the DESC implies a programmable
 * game-state mutation that cannot be expressed through standard base effects.
 */

import { EResource, ETrace } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import type { TSlotReward } from '../alien/AlienBoard.js';
import { AlienRegistry } from '../alien/AlienRegistry.js';
import { executeSimpleSlotRewards } from '../alien/AlienRewards.js';
import {
  countPlayerSignalsInAnomalySectors,
  getAnomalyTokenAtSector,
  getEarthSectorIndex,
  getNextTriggeredAnomalyToken,
} from '../alien/plugins/AnomaliesResolver.js';
import { disableMovementPublicityForCurrentTurn } from '../alien/plugins/AnomaliesTurnEffects.js';
import { OumuamuaAlienPlugin } from '../alien/plugins/OumuamuaAlienPlugin.js';
import {
  extractSectorColorFromCardItem,
  MarkSectorSignalEffect,
} from '../effects/index.js';
import { FreeActionCornerFreeAction } from '../freeActions/FreeActionCorner.js';
import { SelectCard } from '../input/SelectCard.js';
import { SelectOption } from '../input/SelectOption.js';
import { EMissionEventType } from '../missions/IMission.js';
import { getBehaviorExecutor } from './BehaviorExecutor.js';
import { hasCardData, loadCardData } from './loadCardData.js';
import { EMarkSource } from './utils/Mark.js';

function toCardId(card: unknown, fallback: string): string {
  if (typeof card === 'string') return card;
  return (card as { id?: string })?.id ?? fallback;
}

function countIncomeCards(cards: unknown[], targetIncome: EResource): number {
  let count = 0;
  for (let i = 0; i < cards.length; i += 1) {
    const cardId = toCardId(cards[i], `card-${i}`);
    if (!hasCardData(cardId)) continue;
    if (loadCardData(cardId).income === targetIncome) {
      count += 1;
    }
  }
  return count;
}

function gainResourceByIncome(
  player: Parameters<
    Parameters<
      ReturnType<typeof getBehaviorExecutor>['registerCustomHandler']
    >[1]
  >[0],
  game: Parameters<
    Parameters<
      ReturnType<typeof getBehaviorExecutor>['registerCustomHandler']
    >[1]
  >[1],
  income: EResource,
): void {
  switch (income) {
    case EResource.CREDIT:
      player.resources.gain({ credits: 1 });
      return;
    case EResource.ENERGY:
      player.resources.gain({ energy: 1 });
      return;
    case EResource.DATA:
      player.resources.gain({ data: 1 });
      return;
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: 1 });
      return;
    case EResource.SCORE:
      player.score += 1;
      return;
    case EResource.MOVE:
      player.gainMove(1);
      return;
    case EResource.CARD:
    case EResource.CARD_ANY: {
      const drawn = game.mainDeck.drawWithReshuffle(game.random);
      if (drawn !== undefined) {
        player.hand.push(drawn);
        game.lockCurrentTurn();
      }
      return;
    }
    default:
      return;
  }
}

function gainAnomalyRewards(
  player: Parameters<
    Parameters<
      ReturnType<typeof getBehaviorExecutor>['registerCustomHandler']
    >[1]
  >[0],
  game: Parameters<
    Parameters<
      ReturnType<typeof getBehaviorExecutor>['registerCustomHandler']
    >[1]
  >[1],
  rewards: TSlotReward[],
): void {
  executeSimpleSlotRewards(player, game, rewards);
}

export function registerDescHandlers(): void {
  const executor = getBehaviorExecutor();

  // ---------------------------------------------------------------
  // To register a handler, use:
  //
  //   executor.registerCustomHandler('desc.card-XYZ', (player, game, card) => {
  //     // implement the effect
  //     return undefined; // or return IPlayerInput for interactive choices
  //   });
  //
  // The customId must match the `desc` string passed to DESC() or
  // DESC_WITH_TYPE() in packages/common/src/constant/effect.ts data.
  // ---------------------------------------------------------------

  executor.registerCustomHandler('desc.card-55', (player, game) =>
    game.mark(EMarkSource.ANY, 1, player.id),
  );

  executor.registerCustomHandler('desc.card-67', (player, game) => {
    if (player.hand.length <= 0) return undefined;

    const handCards = player.hand.map((rawCard, idx) => ({
      id: toCardId(rawCard, `hand-${idx}`),
      index: idx,
      rawCard,
    }));

    return new SelectCard(
      player,
      {
        cards: handCards.map((item) => ({
          id: `${item.id}@${item.index}`,
          index: item.index,
        })),
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selected) => {
          const picked = handCards.find(
            (item) => `${item.id}@${item.index}` === selected[0],
          );
          if (!picked) return undefined;

          player.removeCardById(picked.id);
          game.mainDeck.discard(picked.id);

          const sectorColor = extractSectorColorFromCardItem(picked.rawCard);
          if (!sectorColor) return undefined;
          return MarkSectorSignalEffect.markByColor(player, game, sectorColor);
        },
      },
      'Discard a card from hand to mark a signal of its color',
    );
  });

  executor.registerCustomHandler('desc.card-90', (player) => {
    const gained = countIncomeCards(player.hand, EResource.ENERGY);
    if (gained > 0) {
      player.resources.gain({ energy: gained });
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.card-91', (player, _game, card) => {
    const gained = countIncomeCards(player.tuckedIncomeCards, EResource.ENERGY);
    if (gained > 0) {
      player.resources.gain({ energy: gained });
    }
    player.income.addTuckedIncome(EResource.ENERGY);
    if (!player.tuckedIncomeCards.includes(card.id)) {
      player.tuckedIncomeCards.push(card.id);
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.card-92', (player, _game, card) => {
    const gained = countIncomeCards(player.tuckedIncomeCards, EResource.CARD);
    if (gained > 0) {
      player.resources.gain({ publicity: gained });
    }
    player.income.addTuckedIncome(EResource.CARD);
    if (!player.tuckedIncomeCards.includes(card.id)) {
      player.tuckedIncomeCards.push(card.id);
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.card-93', (player, _game, card) => {
    const gained = countIncomeCards(player.tuckedIncomeCards, EResource.CREDIT);
    if (gained > 0) {
      player.score += gained * 3;
    }
    player.income.addTuckedIncome(EResource.CREDIT);
    if (!player.tuckedIncomeCards.includes(card.id)) {
      player.tuckedIncomeCards.push(card.id);
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.card-108', (player, game) => {
    if (player.resources.publicity < 8) return undefined;
    return game.markTrace(ETrace.RED, player.id);
  });

  executor.registerCustomHandler('desc.card-119', (player) => {
    player.score += player.resources.publicity;
    return undefined;
  });

  executor.registerCustomHandler('desc.et-11', (player, game) => {
    const earthSector = getEarthSectorIndex(game);
    if (earthSector === undefined) return undefined;
    const token = getAnomalyTokenAtSector(game, earthSector);
    if (!token) return undefined;
    player.gainMove(1);
    return undefined;
  });

  executor.registerCustomHandler('desc.et-12', (player, game) => {
    disableMovementPublicityForCurrentTurn(game, player.id);
    return undefined;
  });

  executor.registerCustomHandler('desc.et-14', (player, game) => {
    const token = getNextTriggeredAnomalyToken(game);
    if (!token) return undefined;
    MarkSectorSignalEffect.markByIndex(player, game, token.sectorIndex);
    return undefined;
  });

  executor.registerCustomHandler('desc.et-15', (player, game) => {
    if (player.hand.length <= 0) return undefined;

    const handCards = player.hand.map((rawCard, idx) => ({
      id: toCardId(rawCard, `hand-${idx}`),
      index: idx,
    }));

    const selectSecondDiscard = () => {
      if (player.hand.length <= 0) return undefined;
      const secondOptions = player.hand.map((rawCard, idx) => ({
        id: toCardId(rawCard, `hand-2-${idx}`),
        index: idx,
      }));

      return new SelectCard(
        player,
        {
          cards: secondOptions.map((item) => ({
            id: `${item.id}@${item.index}`,
            index: item.index,
          })),
          minSelections: 1,
          maxSelections: 1,
          onSelect: (selected) => {
            const picked = secondOptions.find(
              (item) => `${item.id}@${item.index}` === selected[0],
            );
            if (!picked) return undefined;

            const removed = player.removeCardById(picked.id);
            if (removed === undefined) return undefined;
            game.mainDeck.discard(picked.id);

            if (!hasCardData(picked.id)) return undefined;
            gainResourceByIncome(player, game, loadCardData(picked.id).income);
            return undefined;
          },
        },
        'Discard 1 card to gain the resource matching its income',
      );
    };

    return new SelectCard(
      player,
      {
        cards: handCards.map((item) => ({
          id: `${item.id}@${item.index}`,
          index: item.index,
        })),
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selected) => {
          const picked = handCards.find(
            (item) => `${item.id}@${item.index}` === selected[0],
          );
          if (!picked) return undefined;

          FreeActionCornerFreeAction.execute(player, game, picked.id);
          return selectSecondDiscard();
        },
      },
      'Discard 1 card to gain its free-action corner reward',
    );
  });

  executor.registerCustomHandler('desc.et-16', (player, game) => {
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!board) return undefined;

    for (let i = 0; i < 3; i += 1) {
      const source = board.faceUpAlienCardId ? 'face-up' : 'deck';
      const drawn = game.alienState.drawAlienCard(player, board, source, game);
      if (!drawn) break;
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.et-17', (player, game) => {
    const token = getNextTriggeredAnomalyToken(game);
    if (!token) return undefined;
    gainAnomalyRewards(player, game, token.rewards);
    return undefined;
  });

  executor.registerCustomHandler('desc.et-20', (player, game) => {
    const signalCount = countPlayerSignalsInAnomalySectors(game, player.id);
    if (signalCount > 0) {
      player.score += signalCount;
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.et-21', (player, game) => {
    const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
    if (!(plugin instanceof OumuamuaAlienPlugin)) {
      return undefined;
    }
    const count = plugin.getTileMarkerCountByPlayer(game, player.id);
    if (count > 0) {
      player.score += count * 2;
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.et-22', (player, game) => {
    const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
    if (!(plugin instanceof OumuamuaAlienPlugin)) {
      return undefined;
    }
    const count = plugin.getTileMarkerCountByPlayer(game, player.id);
    if (count > 0) {
      player.gainExofossils(1);
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.et-23', (player, game) => {
    const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
    if (!(plugin instanceof OumuamuaAlienPlugin)) {
      return undefined;
    }

    const state = plugin.getRuntimeState(game);
    if (!state?.meta) return undefined;

    const sectorIndex = game.sectors.findIndex(
      (sector) => sector.id === state.meta?.sectorId,
    );
    if (sectorIndex < 0) return undefined;

    return MarkSectorSignalEffect.markByIndexWithAlternatives(
      player,
      game,
      sectorIndex,
    );
  });

  executor.registerCustomHandler('desc.et-24', (player, game) => {
    if (player.exofossils < 1) return undefined;
    return new SelectOption(
      player,
      [
        {
          id: 'use-exofossil-mark-any-signal',
          label: 'Spend 1 exofossil to mark any signal',
          onSelect: () => {
            if (!player.spendExofossils(1)) return undefined;
            return game.mark(EMarkSource.ANY, 1, player.id);
          },
        },
        {
          id: 'skip-use-exofossil-mark-any-signal',
          label: 'Skip',
          onSelect: () => undefined,
        },
      ],
      'Use exofossil for extra signal?',
    );
  });

  executor.registerCustomHandler('desc.et-25', (player) => {
    const promptLoop = (): SelectOption | undefined => {
      if (player.exofossils < 1) return undefined;
      return new SelectOption(
        player,
        [
          {
            id: 'use-exofossil-gain-2-move',
            label: 'Spend 1 exofossil to gain 2 move',
            onSelect: () => {
              if (!player.spendExofossils(1)) return undefined;
              player.gainMove(2);
              return promptLoop();
            },
          },
          {
            id: 'stop-use-exofossil-gain-2-move',
            label: 'Done',
            onSelect: () => undefined,
          },
        ],
        'Use exofossil to gain movement?',
      );
    };
    return promptLoop();
  });

  executor.registerCustomHandler('desc.et-27', (player, game) => {
    const visited = game.missionTracker.hasTurnEvent(
      (event) =>
        event.type === EMissionEventType.PROBE_VISITED_PLANET &&
        event.planet === EPlanet.OUMUAMUA,
    );
    if (visited) {
      player.gainExofossils(1);
    }
    return undefined;
  });

  executor.registerCustomHandler('desc.et-28', (player) => {
    if (player.exofossils < 1) return undefined;
    return new SelectOption(
      player,
      [
        {
          id: 'use-exofossil-gain-data',
          label: 'Spend 1 exofossil to gain 1 data',
          onSelect: () => {
            if (!player.spendExofossils(1)) return undefined;
            player.resources.gain({ data: 1 });
            return undefined;
          },
        },
        {
          id: 'skip-use-exofossil-gain-data',
          label: 'Skip',
          onSelect: () => undefined,
        },
      ],
      'Use exofossil to gain data?',
    );
  });

  executor.registerCustomHandler('desc.et-30', (player, game) => {
    const landedWithThisAction = game.missionTracker.hasTurnEvent(
      (event) =>
        event.type === EMissionEventType.PROBE_LANDED &&
        event.planet === EPlanet.OUMUAMUA,
    );
    if (landedWithThisAction) {
      player.score += 3;
    }
    return undefined;
  });

  executor.registerCustomHandler('sa.desc.card_13', (player, game) =>
    game.mark(EMarkSource.ANY, 1, player.id),
  );
}
