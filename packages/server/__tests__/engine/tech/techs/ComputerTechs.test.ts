import {
  ComputerVpCardTech,
  ComputerVpCreditTech,
  ComputerVpEnergyTech,
  ComputerVpPublicityTech,
} from '@/engine/tech/techs/ComputerTechs.js';

describe('ComputerTechs', () => {
  it('defines top and bottom slot rewards', () => {
    expect(new ComputerVpCreditTech().getComputerSlotReward(0)).toEqual({
      vp: 2,
    });
    expect(new ComputerVpEnergyTech().getComputerSlotReward(1)).toEqual({
      energy: 1,
    });
    expect(new ComputerVpCardTech().getComputerSlotReward(1)).toEqual({
      drawCard: 1,
    });
    expect(new ComputerVpPublicityTech().getComputerSlotReward(1)).toEqual({
      publicity: 2,
    });
  });
});
