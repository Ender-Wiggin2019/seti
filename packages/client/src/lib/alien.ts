import { EAlienMap, type EAlienType } from '@seti/common/types/BaseCard';

export function getAlienTypeKey(alienType: EAlienType): string {
  return EAlienMap[alienType];
}

export function formatAlienLabel(alienType: EAlienType): string {
  const label = getAlienTypeKey(alienType);
  return label[0].toUpperCase() + label.slice(1);
}
