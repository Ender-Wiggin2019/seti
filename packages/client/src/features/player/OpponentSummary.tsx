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
      <div className='space-y-1.5'>
        {opponents.map((player) => (
          <details
            key={player.playerId}
            className='rounded border border-surface-700/50 bg-surface-900/50 px-2 py-1'
          >
            <summary className='flex cursor-pointer list-none items-center justify-between gap-2'>
              <span className='flex items-center gap-1.5 text-xs font-medium text-text-100'>
                <span
                  className='h-2.5 w-2.5 rounded-full border border-surface-200/60'
                  style={{ backgroundColor: player.color }}
                  aria-hidden
                />
                {player.playerName}
              </span>
              <span className='font-mono text-xs text-text-300'>{player.score} VP</span>
            </summary>
            <div className='mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-text-400'>
              <span>Hand: {player.handSize}</span>
              <span>Tech: {player.techs.length}</span>
              <span>Credit: {player.resources.credit}</span>
              <span>Energy: {player.resources.energy}</span>
              <span>Data: {player.resources.data}</span>
              <span>Publicity: {player.resources.publicity}</span>
              <span>Pool: {player.dataPoolCount}</span>
              <span>Signals: {player.pieces.signalMarkers}</span>
              {player.passed ? (
                <span className='col-span-2 text-warning-300'>Passed this round</span>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
