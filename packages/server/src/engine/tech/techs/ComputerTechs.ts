import { ETechId } from '@seti/common/types/tech';
import { Tech } from '../Tech.js';

/** Computer tech level 0: Top slot +2 VP, bottom slot +1 credit. */
export class ComputerVpCreditTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_CREDIT, 'VP + Credit');
  }

  // TODO (Stage 2.5-3): override getComputerSlotReward
}

/** Computer tech level 1: Top slot +2 VP, bottom slot +1 energy. */
export class ComputerVpEnergyTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_ENERGY, 'VP + Energy');
  }

  // TODO (Stage 2.5-3): override getComputerSlotReward
}

/** Computer tech level 2: Top slot +2 VP, bottom slot draw 1 card. */
export class ComputerVpCardTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_CARD, 'VP + Card');
  }

  // TODO (Stage 2.5-3): override getComputerSlotReward
}

/** Computer tech level 3: Top slot +2 VP, bottom slot +2 publicity. */
export class ComputerVpPublicityTech extends Tech {
  public constructor() {
    super(ETechId.COMPUTER_VP_PUBLICITY, 'VP + Publicity');
  }

  // TODO (Stage 2.5-3): override getComputerSlotReward
}
