import { ICorp } from '@/types/corp';
import { EEffectType, Effect } from '@/types/effect';
import {
  EMiscIcon,
  EResource,
  EScanAction,
  ESpecialAction,
  ETech,
} from '@/types/element';
import { getModel, getValueFromEffect, getValuesFromEffects } from '../model';

describe('Model Utility Functions', () => {
  describe('getValueFromEffect', () => {
    it('should return 0 for non-base effect types', () => {
      const missionEffect: Effect = {
        effectType: EEffectType.MISSION_QUICK,
        missions: [],
      };

      const result = getValueFromEffect(missionEffect);
      expect(result).toBe(0);
    });

    it('should calculate value for CREDIT resource correctly', () => {
      const creditEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.CREDIT,
        value: 3,
      };

      const result = getValueFromEffect(creditEffect);
      expect(result).toBe(3); // 1 * 3 = 3
    });

    it('should calculate value for ENERGY resource correctly', () => {
      const energyEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.ENERGY,
        value: 2,
      };

      const result = getValueFromEffect(energyEffect);
      expect(result).toBe(2); // 1 * 2 = 2
    });

    it('should calculate value for DATA resource correctly', () => {
      const dataEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.DATA,
        value: 4,
      };

      const result = getValueFromEffect(dataEffect);
      expect(result).toBe(2); // 0.5 * 4 = 2
    });

    it('should calculate value for PUBLICITY resource correctly', () => {
      const publicityEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.PUBLICITY,
        value: 6,
      };

      const result = getValueFromEffect(publicityEffect);
      expect(result).toBe(3); // 0.5 * 6 = 3
    });

    it('should calculate value for SCORE resource correctly', () => {
      const scoreEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.SCORE,
        value: 10,
      };

      const result = getValueFromEffect(scoreEffect);
      expect(result).toBe(2); // 0.2 * 10 = 2
    });

    it('should calculate value for CARD resource correctly', () => {
      const cardEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.CARD,
        value: 4,
      };

      const result = getValueFromEffect(cardEffect);
      expect(result).toBe(3); // 0.75 * 4 = 3
    });

    it('should calculate value for CARD_ANY resource correctly', () => {
      const cardAnyEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.CARD_ANY,
        value: 2,
      };

      const result = getValueFromEffect(cardAnyEffect);
      expect(result).toBe(2); // 1 * 2 = 2
    });

    it('should calculate value for MOVE resource correctly', () => {
      const moveEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.MOVE,
        value: 3,
      };

      const result = getValueFromEffect(moveEffect);
      expect(result).toBeCloseTo(2.1, 10); // 0.7 * 3 = 2.1
    });

    it('should calculate value for TECH effects correctly', () => {
      const techAnyEffect: Effect = {
        effectType: EEffectType.BASE,
        type: ETech.ANY,
        value: 2,
      };

      const result = getValueFromEffect(techAnyEffect);
      expect(result).toBe(6); // 3 * 2 = 6
    });

    it('should calculate value for SPECIAL_ACTION effects correctly', () => {
      const launchEffect: Effect = {
        effectType: EEffectType.BASE,
        type: ESpecialAction.LAUNCH,
        value: 1,
      };

      const result = getValueFromEffect(launchEffect);
      expect(result).toBe(2); // 2 * 1 = 2
    });

    it('should calculate value for SCAN_ACTION effects correctly', () => {
      const redSignalEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EScanAction.RED,
        value: 3,
      };

      const result = getValueFromEffect(redSignalEffect);
      expect(result).toBe(3); // 1 * 3 = 3
    });

    it('should return 0 for unknown effect types', () => {
      const unknownEffect: Effect = {
        effectType: EEffectType.BASE,
        // biome-ignore lint/suspicious/noExplicitAny: <>
        type: 'unknown-type' as any,
        value: 5,
      };

      const result = getValueFromEffect(unknownEffect);
      expect(result).toBe(0);
    });

    it('should use default value of 1 when value is not provided', () => {
      const creditEffect: Effect = {
        effectType: EEffectType.BASE,
        type: EResource.CREDIT,
      };

      const result = getValueFromEffect(creditEffect);
      expect(result).toBe(1); // 1 * 1 = 1
    });
  });

  describe('getValuesFromEffects', () => {
    it('should sum values from multiple effects correctly', () => {
      const effects: Effect[] = [
        {
          effectType: EEffectType.BASE,
          type: EResource.CREDIT,
          value: 3,
        },
        {
          effectType: EEffectType.BASE,
          type: EResource.ENERGY,
          value: 2,
        },
        {
          effectType: EEffectType.BASE,
          type: EResource.DATA,
          value: 4,
        },
      ];

      const result = getValuesFromEffects(effects);
      expect(result).toBe(7); // 3 + 2 + 2 = 7
    });

    it('should ignore non-base effect types', () => {
      const effects: Effect[] = [
        {
          effectType: EEffectType.BASE,
          type: EResource.CREDIT,
          value: 3,
        },
        {
          effectType: EEffectType.MISSION_QUICK,
          missions: [],
        },
        {
          effectType: EEffectType.BASE,
          type: EResource.ENERGY,
          value: 2,
        },
      ];

      const result = getValuesFromEffects(effects);
      expect(result).toBe(5); // 3 + 0 + 2 = 5
    });

    it('should return 0 for empty effects array', () => {
      const effects: Effect[] = [];

      const result = getValuesFromEffects(effects);
      expect(result).toBe(0);
    });

    it('should handle mixed effect types with complex calculations', () => {
      const effects: Effect[] = [
        {
          effectType: EEffectType.BASE,
          type: EResource.CREDIT,
          value: 5,
        },
        {
          effectType: EEffectType.BASE,
          type: EResource.SCORE,
          value: 15,
        },
        {
          effectType: EEffectType.BASE,
          type: ETech.ANY,
          value: 1,
        },
        {
          effectType: EEffectType.MISSION_QUICK,
          missions: [],
        },
      ];

      const result = getValuesFromEffects(effects);
      expect(result).toBe(11); // 5 + (0.2 * 15) + 3 + 0 = 5 + 3 + 3 = 11
    });
  });

  describe('getModel', () => {
    it('should calculate model values correctly for a basic corp', () => {
      const corp: ICorp = {
        name: 'Test Corp',
        author: 'Test Author',
        faq: [],
        startResources: [
          {
            effectType: EEffectType.BASE,
            type: EResource.CREDIT,
            value: 4,
          },
          {
            effectType: EEffectType.BASE,
            type: EResource.ENERGY,
            value: 2,
          },
          {
            effectType: EEffectType.BASE,
            type: EMiscIcon.INCOME,
            value: 2,
          },
        ],
        income: [
          {
            effectType: EEffectType.BASE,
            type: EResource.CREDIT,
            value: 2,
          },
        ],
        effectTriggerTimes: 5,
        effectUnitValue: 1,
      };

      const result = getModel(corp, 3);

      // initResources = (4 + 2) + (2 * 0.5) = 6 + 1 = 7
      // incomeValue = (2 + 2) * (3 - 1) = 4 * 2 = 8
      // freeActionValue = 0 (no freeAction)
      // effectTotalValue = 5 * 1 = 5
      // totalValue = 7 + 8 + 0 + 5 = 20

      expect(result.initResources).toBe(7);
      expect(result.incomeValue).toBe(8);
      expect(result.freeActionValue).toBe(0);
      expect(result.effectTotalValue).toBe(5);
      expect(result.totalValue).toBe(20);
    });

    it('should handle corp without income effects', () => {
      const corp: ICorp = {
        name: 'No Income Corp',
        author: 'Test Author',
        faq: [],
        startResources: [
          {
            effectType: EEffectType.BASE,
            type: EResource.CREDIT,
            value: 3,
          },
        ],
        income: [],
        effectTriggerTimes: 2,
        effectUnitValue: 1,
      };

      const result = getModel(corp, 2);

      // initResources = 3 + 0 = 3
      // incomeValue = 0 * (2 - 1) = 0
      // effectTotalValue = 2 * 1 = 2
      // totalValue = 3 + 0 + 0 + 2 = 5

      expect(result.initResources).toBe(3);
      expect(result.incomeValue).toBe(0);
      expect(result.freeActionValue).toBe(0);
      expect(result.totalValue).toBe(5);
    });

    it('should handle corp with free actions', () => {
      const corp: ICorp = {
        name: 'Free Action Corp',
        author: 'Test Author',
        faq: [],
        startResources: [
          {
            effectType: EEffectType.BASE,
            type: EResource.ENERGY,
            value: 2,
          },
        ],
        income: [],
        freeAction: [
          {
            effectType: EEffectType.BASE,
            type: ESpecialAction.LAUNCH,
            value: 1,
          },
        ],
        effectTriggerTimes: 3,
        effectUnitValue: 1,
      };

      const result = getModel(corp, 1);

      // initResources = 2 + 0 = 2
      // incomeValue = 0 * (1 - 1) = 0
      // freeActionValue = 2 * 1 = 2
      // effectTotalValue = 3 * 1 = 3
      // totalValue = 2 + 0 + 2 + 3 = 7

      expect(result.initResources).toBe(2);
      expect(result.incomeValue).toBe(0);
      expect(result.freeActionValue).toBe(2);
      expect(result.totalValue).toBe(7);
    });

    it('should handle corp with complex resource calculations', () => {
      const corp: ICorp = {
        name: 'Complex Corp',
        author: 'Test Author',
        faq: [],
        startResources: [
          {
            effectType: EEffectType.BASE,
            type: EResource.CREDIT,
            value: 5,
          },
          {
            effectType: EEffectType.BASE,
            type: EResource.DATA,
            value: 6,
          },
          {
            effectType: EEffectType.BASE,
            type: EMiscIcon.INCOME,
            value: 3,
          },
        ],
        income: [
          {
            effectType: EEffectType.BASE,
            type: EResource.ENERGY,
            value: 2,
          },
          {
            effectType: EEffectType.BASE,
            type: EResource.SCORE,
            value: 5,
          },
        ],
        freeAction: [
          {
            effectType: EEffectType.BASE,
            type: ETech.ANY,
            value: 1,
          },
        ],
        effectTriggerTimes: 10,
        effectUnitValue: 1,
      };

      const result = getModel(corp, 4);

      // initResources = (5 + (0.5 * 6)) + (3 * 0.5) = (5 + 3) + 1.5 = 9.5
      // incomeValue = ((2 + (0.2 * 5)) + 3) * (4 - 1) = (2 + 1 + 3) * 3 = 6 * 3 = 18
      // freeActionValue = 3 * 1 = 3
      // effectTotalValue = 10 * 1 = 10
      // totalValue = 9.5 + 18 + 3 + 10 = 40.5

      expect(result.initResources).toBe(9.5);
      expect(result.incomeValue).toBe(18);
      expect(result.freeActionValue).toBe(3);
      expect(result.totalValue).toBe(40.5);
    });

    it('should handle undefined optional properties', () => {
      const corp: ICorp = {
        name: 'Minimal Corp',
        author: 'Test Author',
        faq: [],
        startResources: [
          {
            effectType: EEffectType.BASE,
            type: EResource.CREDIT,
            value: 1,
          },
        ],
        income: [],
        effectTriggerTimes: 0,
        effectUnitValue: 0,
      };

      const result = getModel(corp, 1);

      // initResources = 1 + 0 = 1
      // incomeValue = 0 * (1 - 1) = 0
      // freeActionValue = 0
      // effectTotalValue = 0 * 0 = 0
      // totalValue = 1 + 0 + 0 + 0 = 1

      expect(result.initResources).toBe(1);
      expect(result.incomeValue).toBe(0);
      expect(result.freeActionValue).toBe(0);
      expect(result.effectTotalValue).toBe(0);
      expect(result.totalValue).toBe(1);
    });
  });
});
