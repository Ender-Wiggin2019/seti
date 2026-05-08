import { RIVAL_COMPUTER_SLOT_REWARDS } from '@seti/common/constant/solo';
import type { TPublicSlotReward } from '@seti/common/types/protocol/gameState';
import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';
import type { IGame } from '@/engine/IGame.js';
import { RivalSetup } from './RivalSetup.js';

export class RivalResourceResolver {
  public static gainProgress(game: IGame, amount: number): void {
    const rivalState = game.rivalState;
    if (!rivalState || amount <= 0) {
      return;
    }

    const previousAdvancedCardCrossings = Math.floor(rivalState.progress / 12);
    rivalState.progress += amount;
    rivalState.progressSlot = rivalState.progress % 12;
    const nextAdvancedCardCrossings = Math.floor(rivalState.progress / 12);

    for (
      let crossing = previousAdvancedCardCrossings;
      crossing < nextAdvancedCardCrossings;
      crossing += 1
    ) {
      const advancedCardId = rivalState.advancedReserve.draw();
      if (advancedCardId) {
        rivalState.actionDeck.addToTop(advancedCardId);
      }
    }
  }

  public static gainData(game: IGame, amount: number): void {
    const rivalState = game.rivalState;
    if (!rivalState || amount <= 0) {
      return;
    }

    for (let i = 0; i < amount; i += 1) {
      const emptySlotIndex = rivalState.computer.filledSlots.findIndex(
        (filled) => !filled,
      );
      if (emptySlotIndex < 0) {
        rivalState.computer.dataPool += 1;
        continue;
      }

      rivalState.computer.filledSlots[emptySlotIndex] = true;
      const slotReward = RIVAL_COMPUTER_SLOT_REWARDS[emptySlotIndex];
      if (slotReward) {
        this.applyRewards(game, [slotReward]);
      }
    }
  }

  public static applyRewards(
    game: IGame,
    rewards: readonly TPublicSlotReward[] = [],
  ): void {
    const rivalState = game.rivalState;
    if (!rivalState) {
      return;
    }
    const rival = RivalSetup.getRivalPlayer(game);

    for (const reward of rewards) {
      switch (reward.type) {
        case 'VP':
          rival.score += reward.amount;
          break;
        case 'PUBLICITY':
          rival.resources.gain({ publicity: reward.amount });
          break;
        case 'DATA':
          this.gainData(game, reward.amount);
          break;
        case 'CREDIT':
        case 'ENERGY':
        case 'CARD':
        case 'CARD_ANY':
          this.gainProgress(game, reward.amount);
          break;
        case 'CUSTOM':
          this.applyCustomReward(game, reward.effectId);
          break;
      }
    }
  }

  public static applyTechBonuses(
    game: IGame,
    bonuses: readonly ITechBonusToken[],
  ): void {
    const rival = RivalSetup.getRivalPlayer(game);

    for (const bonus of bonuses) {
      switch (bonus.type) {
        case ETechBonusType.ENERGY:
        case ETechBonusType.CARD:
        case ETechBonusType.CREDIT:
          this.gainProgress(game, 1);
          break;
        case ETechBonusType.DATA:
          this.gainData(game, 1);
          break;
        case ETechBonusType.PUBLICITY:
          rival.resources.gain({ publicity: 1 });
          break;
        case ETechBonusType.VP_2:
          rival.score += 2;
          break;
        case ETechBonusType.VP_3:
          rival.score += 3;
          break;
        case ETechBonusType.DATA_2:
        case ETechBonusType.LAUNCH_IGNORE_LIMIT:
          break;
      }
    }
  }

  private static applyCustomReward(game: IGame, effectId: string): void {
    const match = effectId.match(/^RIVAL_PROGRESS_(\d+)$/);
    if (match) {
      this.gainProgress(game, Number(match[1]));
    }
  }
}
