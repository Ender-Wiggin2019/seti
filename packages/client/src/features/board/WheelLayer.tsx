import { cn } from '@/lib/cn';

interface IWheelLayerProps {
  ring: 1 | 2 | 3 | 4;
  angle: number;
  className?: string;
}

const RING_SIZE_PERCENT: Record<IWheelLayerProps['ring'], number> = {
  1: 34,
  2: 48,
  3: 62,
  4: 100,
};

const RING_ASSET: Record<IWheelLayerProps['ring'], string> = {
  1: '/assets/seti/wheels/wheel1.png',
  2: '/assets/seti/wheels/wheel2.png',
  3: '/assets/seti/wheels/wheel3.png',
  4: '/assets/seti/wheels/wheel4.png',
};

const TRANSITION_DURATION_MS: Record<IWheelLayerProps['ring'], number> = {
  1: 800,
  2: 1200,
  3: 1600,
  4: 0,
};

export function WheelLayer({
  ring,
  angle,
  className,
}: IWheelLayerProps): React.JSX.Element {
  const size = `${RING_SIZE_PERCENT[ring]}%`;
  const angleDeg = angle * 45;
  const duration = TRANSITION_DURATION_MS[ring];

  return (
    <div
      data-testid={`wheel-layer-ring-${ring}`}
      className={cn(
        'pointer-events-none absolute left-1/2 top-1/2 aspect-square select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
        transformOrigin: 'center',
        transition:
          duration > 0 ? `transform ${duration}ms ease-out` : undefined,
      }}
    >
      <img
        src={RING_ASSET[ring]}
        alt=''
        aria-hidden
        className='h-full w-full object-contain'
        draggable={false}
      />
    </div>
  );
}
