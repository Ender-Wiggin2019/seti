interface ITokenCountBadgeProps {
  count?: number;
}

export function TokenCountBadge({
  count = 1,
}: ITokenCountBadgeProps): React.JSX.Element | null {
  if (count <= 1) {
    return null;
  }

  return (
    <span
      aria-hidden='true'
      className='absolute inset-0 flex items-center justify-center font-mono text-[11px] font-black leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.9)]'
    >
      {count}
    </span>
  );
}
