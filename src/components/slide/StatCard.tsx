interface StatCardProps {
  label: string;
  value: number;
  avg: number;
  isActive: boolean;
  color: string;
  scale: number;
  onClick: () => void;
}

export const StatCard = ({
  label,
  value,
  avg,
  isActive,
  color,
  scale,
  onClick,
}: StatCardProps) => {
  const percentage = ((value - 10) / 40) * 100;

  return (
    <div
      className='relative rounded-xl cursor-pointer transition-all duration-300 overflow-hidden group'
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${color}10, ${color}05)`
          : 'linear-gradient(135deg, rgba(39, 39, 42, 0.4), rgba(20, 20, 22, 0.6))',
        border: isActive
          ? `1px solid ${color}35`
          : '1px solid rgba(63, 63, 70, 0.2)',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isActive ? `0 0 20px ${color}12` : 'none',
      }}
      onClick={onClick}
    >
      <div
        className='absolute bottom-0 left-0 right-0 transition-all duration-500'
        style={{
          height: `${percentage}%`,
          background: `linear-gradient(to top, ${color}12, transparent)`,
          opacity: isActive ? 1 : 0.25,
        }}
      />
      <div className='relative p-3 md:p-4'>
        <div
          className='text-xs uppercase tracking-[0.15em] mb-1.5 md:mb-2'
          style={{ color: color }}
        >
          {label}
        </div>
        <div
          className='font-bold mb-0.5 md:mb-1'
          style={{
            color: '#f4f4f5',
            fontSize: `${1.25 * scale}rem`,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
        <div className='text-xs tracking-wide' style={{ color: '#71717a' }}>
          均值 {avg.toFixed(1)}
        </div>
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <div
            className='w-5 h-5 rounded-full flex items-center justify-center'
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            <svg
              width='10'
              height='10'
              viewBox='0 0 24 24'
              fill='none'
              stroke={color}
              strokeWidth='2'
            >
              <path d='M5 12h14M12 5l7 7-7 7' />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
