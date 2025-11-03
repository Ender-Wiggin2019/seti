import { EAlienType } from '@/types/BaseCard';

export const ALIEN_BUTTON_GROUP: {
  type: EAlienType;
  text: string;
  ring: string;
  bg: string;
  hover?: string;
  beta?: boolean;
}[] = [
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
  },
  {
    type: EAlienType.AMOEBA,
    text: 'text-amoeba-foreground',
    ring: 'ring-amoeba',
    bg: 'bg-amoeba-background',
    // hover: 'hover:text-black/70 focus:text-black/70',
    beta: true,
  },
  {
    type: EAlienType.GLYPHIDS,
    text: 'text-glyphids-foreground',
    ring: 'ring-glyphids',
    bg: 'bg-glyphids-background',
    beta: true,
  },
];
