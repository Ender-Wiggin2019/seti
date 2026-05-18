import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const ALIEN_BOARD_ART = {
  anomalies: '/assets/seti/aliens/anomalies/board.webp',
  centaurians: '/assets/seti/aliens/centaurians/board.webp',
  exertians: '/assets/seti/aliens/exertians/board.webp',
  mascamites: '/assets/seti/aliens/mascamites/board.webp',
  oumuamua: '/assets/seti/aliens/oumuamua/board.webp',
  amoeba: '/assets/seti/aliens/amoeba/board.webp',
  glyphids: '/assets/seti/aliens/glyphids/board.webp',
  arkhos: '/assets/seti/aliens/arkhos/board.webp',
} as const;

export type TAlienArtKey = keyof typeof ALIEN_BOARD_ART;

interface IAlienBoardArtFrameProps {
  artKey: TAlienArtKey;
  alt: string;
  children?: ReactNode;
  className?: string;
  testId?: string;
}

export function AlienBoardArtFrame({
  artKey,
  alt,
  children,
  className,
  testId,
}: IAlienBoardArtFrameProps): React.JSX.Element {
  const src = ALIEN_BOARD_ART[artKey];
  return (
    <div
      className={cn(
        'relative mx-auto aspect-[251/451] w-full max-w-[500px] overflow-hidden rounded-[14%/8%]',
        className,
      )}
      data-testid={testId}
    >
      <img
        src={src}
        alt={alt}
        className='absolute inset-0 h-full w-full object-cover'
        loading='lazy'
      />
      {children ? (
        <div className='absolute inset-0 h-full w-full'>{children}</div>
      ) : null}
    </div>
  );
}
