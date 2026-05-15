import { EEffectType } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import type { IPreludeCard } from '@seti/common/types/prelude';
import {
  findSectorById,
  findSectorIdByStarName,
} from '../effects/scan/ScanEffectUtils.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import { EPieceType } from '../player/Pieces.js';
import { PreludeRegistry } from './PreludeRegistry.js';

const NEUTRAL_SETUP_PLAYER_ID = 'neutral';

export class PreludeCardRuntime {
  public static resolvePlayerCard(
    player: IPlayer,
    game: IGame,
    cardId: string,
  ): void {
    const card = PreludeRegistry.get(cardId);
    this.resolveLower(player, game, card);
    this.resolveUpper(player, game, card);
  }

  public static resolvePlayerCards(
    player: IPlayer,
    game: IGame,
    cardIds: readonly string[],
  ): void {
    const cards = cardIds.map((cardId) => PreludeRegistry.get(cardId));
    for (const card of cards) {
      this.resolveLower(player, game, card);
    }
    for (const card of cards) {
      this.resolveUpper(player, game, card);
    }
  }

  public static resolveNeutralUpper(game: IGame, cardId: string): void {
    const card = PreludeRegistry.get(cardId);
    for (const mark of card.setupMarks) {
      switch (mark.kind) {
        case 'signal':
          for (let index = 0; index < mark.count; index += 1) {
            this.placeSignal(game, NEUTRAL_SETUP_PLAYER_ID, mark.starName);
          }
          break;
        case 'trace':
          game.alienState.placeNeutralSetupTrace(mark.trace, mark.alienIndex);
          break;
        case 'orbiter':
          game.planetaryBoard?.placeSetupOrbiter(
            mark.planet,
            NEUTRAL_SETUP_PLAYER_ID,
          );
          break;
        default: {
          const exhaustive: never = mark;
          return exhaustive;
        }
      }
    }
  }

  private static resolveLower(
    player: IPlayer,
    game: IGame,
    card: IPreludeCard,
  ): void {
    for (const effect of card.lowerEffects) {
      if (effect.effectType !== EEffectType.BASE) {
        continue;
      }
      const amount = effect.value ?? 1;
      switch (effect.type) {
        case EResource.SCORE:
          player.score += amount;
          break;
        case EResource.CREDIT:
          player.resources.gain({ credits: amount });
          break;
        case EResource.ENERGY:
          player.resources.gain({ energy: amount });
          break;
        case EResource.PUBLICITY:
          player.resources.gain({ publicity: amount });
          break;
        case EResource.DATA:
          player.resources.gain({ data: amount });
          break;
        case EResource.SIGNAL_TOKEN:
          player.resources.gain({ signalTokens: amount });
          break;
        case EResource.CARD:
        case EResource.CARD_ANY:
          this.drawCards(player, game, amount);
          break;
        default:
          throw new Error(
            `Unsupported Quick Start lower effect: ${String(effect.type)}`,
          );
      }
    }

    if (card.income) {
      player.income.addTuckedIncome(card.income);
    }
  }

  private static resolveUpper(
    player: IPlayer,
    game: IGame,
    card: IPreludeCard,
  ): void {
    for (const mark of card.setupMarks) {
      switch (mark.kind) {
        case 'signal':
          for (let index = 0; index < mark.count; index += 1) {
            this.placeSignal(game, player.id, mark.starName);
            player.pieces.deploy(EPieceType.SECTOR_MARKER);
          }
          break;
        case 'trace':
          game.alienState.placeSetupTrace(player, mark.trace, mark.alienIndex);
          break;
        case 'orbiter':
          game.planetaryBoard?.placeSetupOrbiter(mark.planet, player.id);
          player.pieces.deploy(EPieceType.ORBITER);
          break;
        default: {
          const exhaustive: never = mark;
          return exhaustive;
        }
      }
    }
  }

  private static placeSignal(
    game: IGame,
    playerId: string,
    starName: Parameters<typeof findSectorIdByStarName>[1],
  ): void {
    const sectorId = findSectorIdByStarName(game.solarSystemSetup, starName);
    if (!sectorId) return;
    const sector = findSectorById(game, sectorId);
    sector?.markSignal(playerId);
  }

  private static drawCards(player: IPlayer, game: IGame, amount: number): void {
    for (let index = 0; index < amount; index += 1) {
      const drawn = game.mainDeck.drawWithReshuffle(game.random);
      if (!drawn) return;
      player.hand.push(drawn);
    }
  }
}
