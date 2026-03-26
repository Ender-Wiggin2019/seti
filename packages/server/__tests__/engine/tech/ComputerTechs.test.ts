import { ETechId } from '@seti/common/types/tech';
import type { IComputerSlotReward } from '@/engine/tech/ITech.js';
import {
  ComputerVpCardTech,
  ComputerVpCreditTech,
  ComputerVpEnergyTech,
  ComputerVpPublicityTech,
} from '@/engine/tech/techs/ComputerTechs.js';

describe('Computer tech slot rewards', () => {
  it('comp-0: top slot +2VP, bottom slot +1 credit', () => {
    const tech = new ComputerVpCreditTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_CREDIT);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      credits: 1,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('comp-1: top slot +2VP, bottom slot +1 energy', () => {
    const tech = new ComputerVpEnergyTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_ENERGY);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      energy: 1,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('comp-2: top slot +2VP, bottom slot draw 1 card', () => {
    const tech = new ComputerVpCardTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_CARD);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      drawCard: 1,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('comp-3: top slot +2VP, bottom slot +2 publicity', () => {
    const tech = new ComputerVpPublicityTech();
    expect(tech.id).toBe(ETechId.COMPUTER_VP_PUBLICITY);
    expect(tech.getComputerSlotReward(0)).toEqual<IComputerSlotReward>({
      vp: 2,
    });
    expect(tech.getComputerSlotReward(1)).toEqual<IComputerSlotReward>({
      publicity: 2,
    });
    expect(tech.getComputerSlotReward(2)).toBeUndefined();
  });

  it('all computer techs share 2VP top-slot reward', () => {
    const techs = [
      new ComputerVpCreditTech(),
      new ComputerVpEnergyTech(),
      new ComputerVpCardTech(),
      new ComputerVpPublicityTech(),
    ];
    for (const tech of techs) {
      expect(tech.getComputerSlotReward(0)).toEqual({ vp: 2 });
    }
  });
});
