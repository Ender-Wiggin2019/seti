import { cn } from '@/lib/cn';

interface IWheelLayerProps {
  ring: 1 | 2 | 3 | 4;
  angle: number;
  className?: string;
  slotLabels?: string[];
  showImage?: boolean;
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

const ROTATING_RING_TRANSITION_MS = 900;

const TRANSITION_DURATION_MS: Record<IWheelLayerProps['ring'], number> = {
  1: ROTATING_RING_TRANSITION_MS,
  2: ROTATING_RING_TRANSITION_MS,
  3: ROTATING_RING_TRANSITION_MS,
  4: 0,
};

const SLOT_LABEL_RADIUS_PERCENT: Record<IWheelLayerProps['ring'], number> = {
  1: 36.52,
  2: 40.15,
  3: 42.38,
  4: 46.22,
};

export function WheelLayer({
  ring,
  angle,
  className,
  slotLabels,
  showImage = true,
}: IWheelLayerProps): React.JSX.Element {
  const size = `${RING_SIZE_PERCENT[ring]}%`;
  const angleDeg = angle * -45;
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
      {showImage && (
        <img
          src={RING_ASSET[ring]}
          alt=''
          aria-hidden
          className='h-full w-full object-contain'
          draggable={false}
        />
      )}

      {slotLabels?.map((label, index) => {
        const theta = (Math.PI / 4) * (0.5 + index);
        const radiusPercent = SLOT_LABEL_RADIUS_PERCENT[ring];
        const xPercent = 50 + Math.sin(theta) * radiusPercent;
        const yPercent = 50 - Math.cos(theta) * radiusPercent;

        return (
          <span
            key={`${ring}-slot-label-${index}`}
            className='pointer-events-none absolute z-20 rounded bg-surface-950/85 px-1 py-0.5 text-[9px] font-mono uppercase leading-none text-text-200 shadow'
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              transform: `translate(-50%, -50%) rotate(${-angleDeg}deg)`,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
