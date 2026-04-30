import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType } from '@seti/common/types/effect';
import type { EPlanet } from '@seti/common/types/element';

export function getMascamitesSampleDeliveryDestination(
  card: IBaseCard,
): EPlanet | undefined {
  for (const effect of card.effects ?? []) {
    if (
      effect.effectType !== EEffectType.MISSION_QUICK &&
      effect.effectType !== EEffectType.MISSION_FULL
    ) {
      continue;
    }

    for (const mission of effect.missions) {
      for (const req of mission.req) {
        if (req.effectType !== EEffectType.CUSTOMIZED) {
          continue;
        }
        const destination = req.mascamitesSampleDelivery?.destination;
        if (destination) return destination;
      }
    }
  }
  return undefined;
}
