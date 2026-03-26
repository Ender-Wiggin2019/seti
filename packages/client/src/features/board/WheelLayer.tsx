import { cn } from '@/lib/cn';

interface IWheelLayerProps {
  ring: 1 | 2 | 3 | 4;
  angle: number;
  className?: string;
}

const RING_SIZE_PERCENT: Record<IWheelLayerProps['ring'], number> = {
  1: 60.9,
  2: 82.6,
  3: 95.7,
  4: 100,
};

const RING_ASSET: Record<IWheelLayerProps['ring'], string> = {
  1: '/assets/seti/wheels/wheel1outline.png',
  2: '/assets/seti/wheels/wheel2outline.png',
  3: '/assets/seti/wheels/wheel3outline.png',
  4: '/assets/seti/wheels/wheel4.png',
};

export function WheelLayer({
  ring,
  angle,
  className,
}: IWheelLayerProps): React.JSX.Element {
  const size = `${RING_SIZE_PERCENT[ring]}%`;
  const angleDeg = angle * 45;

  return (
    <img
      src={RING_ASSET[ring]}
      alt=''
      aria-hidden
      data-testid={`wheel-layer-ring-${ring}`}
      className={cn(
        'absolute left-1/2 top-1/2 select-none object-contain',
        className,
      )}
      style={{
        width: size,
        height: size,
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
        transformOrigin: 'center',
      }}
      draggable={false}
    />
  );
}
