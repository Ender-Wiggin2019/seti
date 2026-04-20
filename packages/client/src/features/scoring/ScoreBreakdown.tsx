import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

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

/**
 * ScoreBreakdown — mission-log scoring ledger. Sticky column for
 * player name, mono readouts across the other columns, and a winner
 * highlight that reads as "signal lock" rather than a medal.
 */
export function ScoreBreakdown({
  rows,
}: IScoreBreakdownProps): React.JSX.Element {
  const { t } = useTranslation('common');
  if (rows.length === 0) {
    return (
      <p className='font-mono text-[10px] tracking-[0.08em] text-text-500'>
        {t('client.score.empty')}
      </p>
    );
  }

  const winnerScore = Math.max(...rows.map((row) => row.total));

  const columns: Array<{ key: keyof IScoreBreakdownRow; labelKey: string }> = [
    { key: 'base', labelKey: 'client.score.base' },
    { key: 'cards', labelKey: 'client.score.cards' },
    { key: 'tech', labelKey: 'client.score.tech' },
    { key: 'milestone', labelKey: 'client.score.milestone' },
    { key: 'gold', labelKey: 'client.score.gold' },
    { key: 'alien', labelKey: 'client.score.alien' },
  ];

  return (
    <div className='instrument-panel overflow-x-auto'>
      <table className='w-full min-w-[560px] border-collapse text-left'>
        <thead>
          <tr className='border-b border-[color:var(--metal-edge-soft)]'>
            <th className='sticky left-0 z-10 bg-background-900/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
              {t('client.score.player')}
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className='px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'
              >
                {t(col.labelKey)}
              </th>
            ))}
            <th className='px-3 py-2 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-text-300'>
              {t('client.score.total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isWinner = row.total === winnerScore;
            return (
              <tr
                key={row.playerId}
                className={cn(
                  'border-b border-[color:var(--metal-edge-soft)] last:border-b-0',
                  isWinner && 'bg-accent-500/[0.06]',
                )}
              >
                <td className='sticky left-0 z-10 bg-background-900/90 px-3 py-2 text-[13px] text-text-100'>
                  <span className='flex items-center gap-2'>
                    {isWinner ? (
                      <span
                        aria-hidden
                        className='h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500 shadow-[0_0_6px_oklch(0.68_0.11_240/0.8)]'
                      />
                    ) : (
                      <span
                        aria-hidden
                        className='h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--surface-700)]'
                      />
                    )}
                    <span className='truncate font-medium'>
                      {row.playerName}
                    </span>
                  </span>
                </td>
                {columns.map((col) => {
                  const value = (row[col.key] ?? 0) as number;
                  return (
                    <td key={col.key} className='px-3 py-2 text-right'>
                      <span
                        className={cn(
                          'readout text-[12px]',
                          value === 0 ? 'text-text-500' : 'text-text-300',
                        )}
                      >
                        {value}
                      </span>
                    </td>
                  );
                })}
                <td className='px-3 py-2 text-right'>
                  <span
                    className={cn(
                      'readout text-[14px] font-semibold',
                      isWinner ? 'text-text-100' : 'text-text-200',
                    )}
                  >
                    {isWinner ? `${row.total} 👑` : row.total}
                  </span>
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
