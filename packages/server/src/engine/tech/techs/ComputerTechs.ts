import { ETechId } from '@seti/common/types/tech';
import type { IComputerSlotReward } from '../ITech.js';
import { Tech } from '../Tech.js';

const TOP_SLOT_REWARD: IComputerSlotReward = { vp: 2 };

/** Computer tech level 0: Top slot +2 VP, bottom slot +1 credit. */
export class ComputerVpCreditTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_CREDIT, 'VP + Credit');
  }

  public override getComputerSlotReward(
    slotIndex: number,
  ): IComputerSlotReward | undefined {
    if (slotIndex === 0) return TOP_SLOT_REWARD;
    if (slotIndex === 1) return { credits: 1 };
    return undefined;
  }
}

/** Computer tech level 1: Top slot +2 VP, bottom slot +1 energy. */
export class ComputerVpEnergyTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_ENERGY, 'VP + Energy');
  }

  public override getComputerSlotReward(
    slotIndex: number,
  ): IComputerSlotReward | undefined {
    if (slotIndex === 0) return TOP_SLOT_REWARD;
    if (slotIndex === 1) return { energy: 1 };
    return undefined;
  }
}

/** Computer tech level 2: Top slot +2 VP, bottom slot draw 1 card. */
export class ComputerVpCardTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_CARD, 'VP + Card');
  }

  public override getComputerSlotReward(
    slotIndex: number,
  ): IComputerSlotReward | undefined {
    if (slotIndex === 0) return TOP_SLOT_REWARD;
    if (slotIndex === 1) return { drawCard: 1 };
    return undefined;
  }
}

/** Computer tech level 3: Top slot +2 VP, bottom slot +2 publicity. */
export class ComputerVpPublicityTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_PUBLICITY, 'VP + Publicity');
  }

  public override getComputerSlotReward(
    slotIndex: number,
  ): IComputerSlotReward | undefined {
    if (slotIndex === 0) return TOP_SLOT_REWARD;
    if (slotIndex === 1) return { publicity: 2 };
    return undefined;
  }
}
