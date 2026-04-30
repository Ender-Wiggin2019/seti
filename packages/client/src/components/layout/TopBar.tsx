import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useGameContext } from '@/pages/game/GameContext';
import { EPhase } from '@/types/re-exports';

/**
 * TopBar — the in-game instrument strip.
 *
 * Left cluster: exit control, round readout, current phase tag.
 * Right cluster: whose turn, spectator flag, session ID readout.
 *
 * Everything numeric or status-bearing is rendered as an instrument:
 * mono font, tabular digits, micro-label captions, hairline dividers.
 */
export function TopBar(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { gameState, isMyTurn, isSpectator } = useGameContext();

  const currentPlayerName = gameState?.players.find(
    (p) => p.playerId === gameState.currentPlayerId,
  )?.playerName;

  const isGameOver = gameState?.phase === EPhase.GAME_OVER;

  return (
    <header
      className={cn(
        'flex h-12 shrink-0 items-center justify-between px-4',
        'border-b border-[color:var(--metal-edge-soft)]',
        'bg-background-950/80 backdrop-blur-md',
      )}
    >
      <div className='flex items-center gap-4'>
        <Link
          to='/lobby'
          className={cn(
            'flex items-center gap-1.5',
            'font-mono text-[0.6875rem] uppercase tracking-microlabel',
            'text-text-500 transition-colors hover:text-text-100',
          )}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-3 w-3'
            aria-hidden
          >
            <path d='M15 18l-6-6 6-6' />
          </svg>
          {t('client.top_bar.exit')}
        </Link>

        <Divider />

        {gameState && (
          <>
            <Readout
              label={t('client.top_bar.round')}
              value={String(gameState.round)}
            />
            <Divider />
            <PhaseChip
              label={t(`client.top_bar.phases.${gameState.phase}`)}
              active={isGameOver}
            />
          </>
        )}
      </div>

      <div className='flex items-center gap-4'>
        {gameState && currentPlayerName && (
          <div className='flex items-center gap-2.5'>
            <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
              {t('client.top_bar.current')}
            </span>
            <span
              className={cn(
                'font-mono text-sm font-medium tracking-readout tabular-nums',
                isMyTurn ? 'text-[oklch(0.82_0.10_240)]' : 'text-text-300',
              )}
            >
              {isMyTurn ? t('client.top_bar.your_turn') : currentPlayerName}
            </span>
            {isMyTurn && <TurnPulse />}
          </div>
        )}

        {isSpectator && (
          <span
            className={cn(
              'font-mono text-[0.6875rem] uppercase tracking-microlabel',
              'text-text-500',
              'border border-[color:var(--metal-edge-soft)]',
              'rounded-[3px] px-2 py-[3px]',
            )}
          >
            {t('client.top_bar.spectating')}
          </span>
        )}

        {gameState && (
          <span className='font-mono text-[10px] text-text-500 tracking-readout'>
            {gameState.gameId.slice(0, 8)}
          </span>
        )}
      </div>
    </header>
  );
}

function Divider(): React.JSX.Element {
  return (
    <span aria-hidden className='h-4 w-px bg-[color:var(--metal-edge-soft)]' />
  );
}

interface IReadoutProps {
  label: string;
  value: string;
}

function Readout({ label, value }: IReadoutProps): React.JSX.Element {
  return (
    <div className='flex items-center gap-2'>
      <span className='font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
        {label}
      </span>
      <span className='font-mono text-sm font-semibold text-text-100 tabular-nums tracking-readout'>
        {value}
      </span>
    </div>
  );
}

interface IPhaseChipProps {
  label: string;
  active: boolean;
}

function PhaseChip({ label, active }: IPhaseChipProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'rounded-[3px] px-2 py-0.5',
        'font-mono text-[0.6875rem] font-medium uppercase tracking-microlabel',
        active
          ? 'bg-[oklch(0.30_0.08_240/0.5)] text-[oklch(0.88_0.10_240)] border border-[oklch(0.50_0.10_240/0.6)]'
          : 'bg-[oklch(0.18_0.025_260)] text-text-300 border border-[color:var(--metal-edge-soft)]',
      )}
    >
      {label}
    </span>
  );
}

function TurnPulse(): React.JSX.Element {
  return (
    <span
      aria-hidden
      className='relative inline-flex h-2 w-2 items-center justify-center'
    >
      <span className='absolute inset-0 animate-ping rounded-full bg-[oklch(0.68_0.11_240/0.6)]' />
      <span className='relative h-2 w-2 rounded-full bg-[oklch(0.82_0.10_240)] shadow-[0_0_6px_oklch(0.68_0.11_240/0.8)]' />
    </span>
  );
}
