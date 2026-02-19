import { useState } from 'react';

const CORPS_WITH_TOP_CROP = [
  'deep-space-detection',
  'deep-space-strategy',
  'fenwick',
  'sentry-network',
  'stratus-core',
];

export type CorpData = {
  id: string;
  name: string;
  image: string;
  initStrength: number;
  model: number;
  ceiling: number;
  recommendCards: { name: string; id?: string }[];
  evaluation: {
    overall: string;
    firstRound: string;
    potential: string;
  };
};

interface CorpCardProps {
  corp: CorpData;
  tierColor: string;
  scale: number;
  onClick: () => void;
  isMobile?: boolean;
}

export const CorpCard = ({
  corp,
  tierColor,
  scale,
  onClick,
  isMobile = false,
}: CorpCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const borderRadius = isMobile ? '12px' : '16px';

  return (
    <div
      className='flex-shrink-0 cursor-pointer group'
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className='relative overflow-hidden transition-all duration-500'
        style={{
          width: `${115 * scale}px`,
          height: `${80 * scale}px`,
          transform: isHovered ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        }}
      >
        <div
          className='absolute inset-0 transition-all duration-500'
          style={{
            borderRadius: borderRadius,
            background: isHovered
              ? `linear-gradient(135deg, ${tierColor}15, rgba(20, 20, 22, 0.9))`
              : 'linear-gradient(135deg, rgba(39, 39, 42, 0.65), rgba(20, 20, 22, 0.8))',
            border: isHovered
              ? `1px solid ${tierColor}60`
              : '1px solid rgba(63, 63, 70, 0.3)',
            boxShadow: isHovered
              ? `0 16px 48px ${tierColor}30, 0 0 24px ${tierColor}15, inset 0 1px 0 rgba(255,255,255,0.06)`
              : '0 4px 16px rgba(0,0,0,0.2)',
          }}
        />
        <div
          className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'
          style={{
            background: `radial-gradient(circle at 50% 0%, ${tierColor}20, transparent 60%)`,
          }}
        />
        <div className='absolute top-2 right-2'>
          <div
            className='w-1.5 h-1.5 rounded-full transition-all duration-300'
            style={{
              background: isHovered ? tierColor : `${tierColor}40`,
              boxShadow: isHovered ? `0 0 8px ${tierColor}` : 'none',
            }}
          />
        </div>
        <div className='absolute inset-0 flex items-center justify-center overflow-hidden p-2'>
          <img
            src={corp.image}
            alt={corp.name}
            className='w-full h-full relative z-10'
            style={{
              objectFit: 'contain',
              filter: isHovered
                ? `drop-shadow(0 0 12px ${tierColor}40) brightness(1.05)`
                : 'drop-shadow(0 0 4px rgba(0,0,0,0.3))',
              clipPath: CORPS_WITH_TOP_CROP.includes(corp.id)
                ? `inset(${isMobile ? '1px' : '2px'} 0 0 0)`
                : undefined,
              transition: 'filter 0.3s ease',
            }}
          />
        </div>
        <div
          className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20'
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div className='flex items-center gap-2'>
            <div
              className='w-5 h-5 rounded-full flex items-center justify-center'
              style={{
                background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
                border: `1px solid ${tierColor}40`,
              }}
            >
              <svg
                width='10'
                height='10'
                viewBox='0 0 24 24'
                fill='none'
                stroke={tierColor}
                strokeWidth='2.5'
              >
                <path d='M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7' />
              </svg>
            </div>
            <span
              style={{
                fontSize: `${0.7 * scale}rem`,
                color: 'white',
                letterSpacing: '0.08em',
              }}
              className='font-medium uppercase'
            >
              分析
            </span>
          </div>
        </div>
      </div>
      <p
        className='text-center mt-2 truncate font-medium transition-colors duration-300'
        style={{
          color: isHovered ? '#f4f4f5' : '#a1a1aa',
          maxWidth: `${115 * scale}px`,
          fontSize: `${0.75 * scale}rem`,
        }}
      >
        {corp.name}
      </p>
    </div>
  );
};

interface TierRowProps {
  tierConfig: {
    label: string;
    color: string;
    gradient: string;
    corps: string[];
  };
  corps: CorpData[];
  scale: number;
  onSelect: (id: string) => void;
  isMobile?: boolean;
}

export const TierRow = ({
  tierConfig,
  corps,
  scale,
  onSelect,
  isMobile = false,
}: TierRowProps) => {
  const tierCorps = tierConfig.corps
    .map((id) => corps.find((c) => c.id === id))
    .filter(Boolean) as CorpData[];

  return (
    <div className='flex flex-col md:flex-row md:items-center gap-3 md:gap-4'>
      <div className='flex-shrink-0 relative md:self-stretch'>
        <div
          className='absolute -inset-1 opacity-35'
          style={{
            background: `radial-gradient(ellipse at center, ${tierConfig.color}20, transparent 70%)`,
            borderRadius: '12px',
          }}
        />
        <div
          className='relative text-center py-2.5 px-4 md:py-2.5 md:px-3 transition-all duration-300 inline-block md:block'
          style={{
            background: `linear-gradient(135deg, ${tierConfig.color}10, ${tierConfig.color}05)`,
            border: `1px solid ${tierConfig.color}20`,
            width: 'auto',
            minWidth: '6rem',
            borderRadius: '10px',
          }}
        >
          <div
            className='absolute top-0 left-1/2 -translate-x-1/2 w-10 h-px hidden md:block'
            style={{
              background: `linear-gradient(90deg, transparent, ${tierConfig.color}40, transparent)`,
            }}
          />
          <span
            className='font-bold tracking-wide'
            style={{
              color: tierConfig.color,
              fontSize: `${1.125 * scale}rem`,
              textShadow: `0 0 20px ${tierConfig.color}30`,
            }}
          >
            {tierConfig.label}
          </span>
        </div>
      </div>
      <div className='flex-1 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent'>
        {tierCorps.map((corp) => (
          <CorpCard
            key={corp.id}
            corp={corp}
            tierColor={tierConfig.color}
            scale={scale}
            onClick={() => onSelect(corp.id)}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};
