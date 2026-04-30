import { EAlienType } from '@seti/common/types/BaseCard';

export const ALIEN_BUTTON_GROUP: {
  type?: EAlienType;
  labelKey: string;
  imageClassName: string;
  text: string;
  ring: string;
  bg: string;
  hover?: string;
  placeholder?: boolean;
}[] = [
  {
    type: EAlienType.CENTAURIANS,
    labelKey: 'centaurians',
    imageClassName: 'alien-filter__image--centaurians',
    text: 'text-centaurians-foreground',
    ring: 'ring-centaurians',
    bg: 'bg-centaurians-background',
  },
  {
    type: EAlienType.GLYPHIDS,
    labelKey: 'glyphids',
    imageClassName: 'alien-filter__image--glyphids',
    text: 'text-glyphids-foreground',
    ring: 'ring-glyphids',
    bg: 'bg-glyphids-background',
  },
  {
    type: EAlienType.ANOMALIES,
    labelKey: 'anomalies',
    imageClassName: 'alien-filter__image--anomalies',
    text: 'text-anomalies-foreground',
    ring: 'ring-anomalies',
    bg: 'bg-anomalies-background',
  },
  {
    type: EAlienType.OUMUAMUA,
    labelKey: 'oumuamua',
    imageClassName: 'alien-filter__image--oumuamua',
    text: 'text-oumuamua-foreground',
    ring: 'ring-oumuamua',
    bg: 'bg-oumuamua-background',
  },
  {
    type: EAlienType.MASCAMITES,
    labelKey: 'mascamites',
    imageClassName: 'alien-filter__image--mascamites',
    text: 'text-mascamites-foreground',
    ring: 'ring-mascamites',
    bg: 'bg-mascamites-background',
  },
  {
    type: EAlienType.EXERTIANS,
    labelKey: 'exertians',
    imageClassName: 'alien-filter__image--exertians',
    text: 'text-exertians-foreground',
    ring: 'ring-exertians',
    bg: 'bg-exertians-background',
  },
  {
    labelKey: 'ark',
    imageClassName: 'alien-filter__image--ark',
    text: 'text-primary-200',
    ring: 'ring-primary-500',
    bg: 'bg-zinc-900/40',
    placeholder: true,
  },
  {
    type: EAlienType.AMOEBA,
    labelKey: 'amoeba',
    imageClassName: 'alien-filter__image--amoeba',
    text: 'text-amoeba-foreground',
    ring: 'ring-amoeba',
    bg: 'bg-amoeba-background',
  },
];
