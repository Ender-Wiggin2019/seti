import { EAlienType } from '@/types/BaseCard';

export const ALIEN_BUTTON_GROUP = [
  {
    type: EAlienType.ANOMALIES,
    text: 'text-anomalies-foreground',
    ring: 'ring-anomalies',
    bg: 'bg-anomalies-background',
  },
  {
    type: EAlienType.CENTAURIANS,
    text: 'text-centaurians-foreground',
    ring: 'ring-centaurians',
    bg: 'bg-centaurians-background',
  },
  {
    type: EAlienType.MASCAMITES,
    text: 'text-mascamites-foreground',
    ring: 'ring-mascamites',
    bg: 'bg-mascamites-background',
  },
  {
    type: EAlienType.OUMUAMUA,
    text: 'text-oumuamua-foreground',
    ring: 'ring-oumuamua',
    bg: 'bg-oumuamua-background',
  },
  {
    type: EAlienType.EXERTIANS,
    text: 'text-exertians-foreground',
    ring: 'ring-exertians',
    bg: 'bg-exertians-background',
    wip: true,
  },
];
