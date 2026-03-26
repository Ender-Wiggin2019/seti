import type { IPublicPlayerState } from '@/types/re-exports';

interface IOpponentSummaryProps {
  opponents: IPublicPlayerState[];
}

export function OpponentSummary({
  opponents,
}: IOpponentSummaryProps): React.JSX.Element {
  return (
    <section className='rounded border border-surface-700/45 bg-surface-900/65 p-2'>
      <p className='mb-1.5 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        Opponents
      </p>
      <div className='space-y-1'>
        {opponents.map((player) => (
          <div
            key={player.playerId}
            className='rounded border border-surface-700/50 bg-surface-900/50 px-1.5 py-1'
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-text-100'>
                {player.playerName}
              </span>
              <span className='font-mono text-xs text-text-400'>
                {player.score} VP
              </span>
            </div>
            <div className='mt-0.5 flex gap-2 font-mono text-[10px] text-text-500'>
              <span>H:{player.handSize}</span>
              <span>D:{player.dataPoolCount}</span>
              {player.passed ? (
                <span className='text-warning-300'>Passed</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
