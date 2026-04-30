import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import {
  EPlayerInputType,
  type IPlayerInputModel,
  type IPublicGameState,
} from '@/types/re-exports';

type TCardLike = string | IBaseCard | { id?: string; [key: string]: unknown };

const CARD_BY_ID = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

function getCardId(card: TCardLike, fallbackId: string): string {
  if (typeof card === 'string') {
    return card;
  }

  return typeof card.id === 'string' && card.id.length > 0
    ? card.id
    : fallbackId;
}

function toFallbackCard(
  id: string,
  raw: Record<string, unknown> | null,
): IBaseCard {
  const name = typeof raw?.name === 'string' ? raw.name : id;
  const price = typeof raw?.price === 'number' ? raw.price : 0;
  const income =
    raw?.income !== undefined ? (raw.income as EResource) : EResource.CREDIT;
  const effects = Array.isArray(raw?.effects)
    ? (raw.effects as IBaseCard['effects'])
    : [];

  return {
    name,
    price,
    income,
    effects,
    ...(raw ?? {}),
    id,
  } as IBaseCard;
}

function toCardObject(card: TCardLike, fallbackId: string): IBaseCard {
  const id = getCardId(card, fallbackId);
  const raw = typeof card === 'object' && card !== null ? card : null;
  const baseCard = CARD_BY_ID.get(id);

  if (!baseCard) {
    return toFallbackCard(id, raw as Record<string, unknown> | null);
  }

  return {
    ...baseCard,
    ...(raw ?? {}),
    id,
  };
}

function normalizeCardArray(cards: unknown, prefix: string): IBaseCard[] {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards.map((card, index) =>
    toCardObject(card as TCardLike, `${prefix}-${index}`),
  );
}

export function normalizeGameStateCards(
  state: IPublicGameState,
): IPublicGameState {
  return {
    ...state,
    cardRow: normalizeCardArray(state.cardRow, 'row'),
    endOfRoundStacks: state.endOfRoundStacks?.map((stack, stackIndex) =>
      normalizeCardArray(stack, `eor-${stackIndex}`),
    ),
    players: state.players.map((player, playerIndex) => ({
      ...player,
      hand: player.hand
        ? normalizeCardArray(player.hand, `player-${playerIndex}-hand`)
        : undefined,
      tuckedIncomeCards: player.tuckedIncomeCards
        ? normalizeCardArray(
            player.tuckedIncomeCards,
            `player-${playerIndex}-tucked`,
          )
        : undefined,
      playedMissions: player.playedMissions
        ? normalizeCardArray(
            player.playedMissions,
            `player-${playerIndex}-mission`,
          )
        : undefined,
      endGameCards: player.endGameCards
        ? normalizeCardArray(
            player.endGameCards,
            `player-${playerIndex}-endgame`,
          )
        : undefined,
    })),
  };
}

export function normalizePlayerInputCards(
  input: IPlayerInputModel,
): IPlayerInputModel {
  if (input.type === EPlayerInputType.CARD) {
    return {
      ...input,
      cards: normalizeCardArray(
        (input as { cards?: unknown }).cards,
        `input-${input.inputId}`,
      ),
    };
  }

  if (input.type === EPlayerInputType.END_OF_ROUND) {
    return {
      ...input,
      cards: normalizeCardArray(
        (input as { cards?: unknown }).cards,
        `input-eor-${input.inputId}`,
      ),
    };
  }

  if (
    input.type === EPlayerInputType.OR ||
    input.type === EPlayerInputType.AND
  ) {
    return {
      ...input,
      options: input.options.map((option) => normalizePlayerInputCards(option)),
    };
  }

  return input;
}
