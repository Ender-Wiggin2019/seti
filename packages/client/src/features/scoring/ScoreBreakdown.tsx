interface IScoreBreakdownRow {
  playerId: string;
  playerName: string;
  total: number;
  base?: number;
  cards?: number;
  tech?: number;
  milestone?: number;
  gold?: number;
  alien?: number;
}

interface IScoreBreakdownProps {
  rows: IScoreBreakdownRow[];
}

export function ScoreBreakdown({
  rows,
}: IScoreBreakdownProps): React.JSX.Element {
  if (rows.length === 0) {
    return <p className='text-xs text-text-500'>No scoring data.</p>;
  }

  const winnerScore = Math.max(...rows.map((row) => row.total));

  return (
    <div className='overflow-x-auto rounded border border-surface-700/55 bg-surface-950/50'>
      <table className='w-full min-w-[580px] text-left text-xs'>
        <thead className='border-b border-surface-700/60 bg-surface-900/70 font-mono uppercase tracking-wide text-text-500'>
          <tr>
            <th className='px-2 py-1.5'>Player</th>
            <th className='px-2 py-1.5'>Base</th>
            <th className='px-2 py-1.5'>Cards</th>
            <th className='px-2 py-1.5'>Tech</th>
            <th className='px-2 py-1.5'>Milestone</th>
            <th className='px-2 py-1.5'>Gold</th>
            <th className='px-2 py-1.5'>Alien</th>
            <th className='px-2 py-1.5'>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isWinner = row.total === winnerScore;
            return (
              <tr
                key={row.playerId}
                className={isWinner ? 'bg-accent-500/10' : 'bg-transparent'}
              >
                <td className='px-2 py-1.5 text-text-200'>{row.playerName}</td>
                <td className='px-2 py-1.5 font-mono text-text-300'>
                  {row.base ?? 0}
                </td>
                <td className='px-2 py-1.5 font-mono text-text-300'>
                  {row.cards ?? 0}
                </td>
                <td className='px-2 py-1.5 font-mono text-text-300'>
                  {row.tech ?? 0}
                </td>
                <td className='px-2 py-1.5 font-mono text-text-300'>
                  {row.milestone ?? 0}
                </td>
                <td className='px-2 py-1.5 font-mono text-text-300'>
                  {row.gold ?? 0}
                </td>
                <td className='px-2 py-1.5 font-mono text-text-300'>
                  {row.alien ?? 0}
                </td>
                <td className='px-2 py-1.5 font-mono font-bold text-text-100'>
                  {row.total}
                  {isWinner ? ' 👑' : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export type { IScoreBreakdownRow };
