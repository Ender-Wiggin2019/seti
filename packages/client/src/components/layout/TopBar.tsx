import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { HeaderControls } from '@/components/layout/HeaderControls';
import { Button } from '@/components/ui/button';
import { getPendingInputTitle } from '@/features/input/PendingInputPrompt';
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
  const {
    gameState,
    isMyTurn,
    isSpectator,
    pendingInput,
    requestUndo,
    resync,
  } = useGameContext();

  const currentPlayerName = gameState?.players.find(
    (p) => p.playerId === gameState.currentPlayerId,
  )?.playerName;

  const isGameOver = gameState?.phase === EPhase.GAME_OVER;
  const inputTitle = pendingInput
    ? getPendingInputTitle(t, pendingInput)
    : null;
  const canUndo = gameState?.canUndo ?? false;

  return (
    <header
      className={cn(
        'relative flex h-12 shrink-0 items-center justify-between gap-2 overflow-hidden px-2 sm:px-4',
        'border-b border-[color:var(--metal-edge-soft)]',
        'bg-[oklch(0.09_0.02_262)]/92 backdrop-blur-md',
        'shadow-[inset_0_1px_0_oklch(0.78_0.04_240/0.08)]',
      )}
    >
      <span
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[color:var(--metal-edge-soft)]'
      />
      <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-4'>
        <WordmarkMark />

        <Link
          to='/lobby'
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-[4px] border border-[color:var(--metal-edge-soft)] px-2.5 py-1.5',
            'font-mono text-[0.6875rem] uppercase tracking-microlabel',
            'bg-[var(--surface-instrument)]/68 text-text-500 transition-colors hover:text-text-100',
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
          <span className='hidden sm:inline'>{t('client.top_bar.exit')}</span>
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
            {inputTitle ? (
              <>
                <Divider />
                <InputStatusChip title={inputTitle} />
                <InputRecoveryControls
                  canUndo={canUndo}
                  onResync={resync}
                  onUndo={requestUndo}
                />
              </>
            ) : null}
          </>
        )}
      </div>

      <div className='ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-4'>
        {gameState && currentPlayerName && (
          <div className='hidden items-center gap-2.5 lg:flex'>
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
            {isMyTurn && (
              <span
                aria-hidden
                className='signal-dot'
                data-active='true'
                data-signal='blue'
              />
            )}
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
          <span className='hidden font-mono text-[10px] text-text-500 tracking-readout md:inline'>
            {gameState.gameId.slice(0, 8)}
          </span>
        )}

        <Divider />

        <HeaderControls variant='compact' />
      </div>
    </header>
  );
}

function Divider(): React.JSX.Element {
  return (
    <span
      aria-hidden
      className='hidden h-4 w-px bg-[color:var(--metal-edge-soft)] sm:block'
    />
  );
}

interface IReadoutProps {
  label: string;
  value: string;
}

function Readout({ label, value }: IReadoutProps): React.JSX.Element {
  return (
    <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
      <span className='hidden font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500 sm:inline'>
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
        'min-w-0 truncate rounded-[3px] px-2 py-0.5',
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

interface IInputRecoveryControlsProps {
  canUndo: boolean;
  onResync: () => void;
  onUndo: () => void;
}

/**
 * InputRecoveryControls — an always-reachable escape hatch shown next to
 * the "Input Required" chip whenever the local player has a pending input.
 * The TopBar is never covered by the input prompt, so these stay clickable
 * even if the prompt itself fails to surface an interactive target.
 *
 *   • Resync  — re-pull authoritative state from the server (no game
 *               mutation); recovers a client that dropped/desynced its
 *               input prompt.
 *   • Undo    — roll the turn back to its start (before the action that
 *               spawned the input). Only available to the active player
 *               while the turn is unlocked, so it's hidden otherwise.
 */
function InputRecoveryControls({
  canUndo,
  onResync,
  onUndo,
}: IInputRecoveryControlsProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className='flex items-center gap-1' data-testid='input-recovery'>
      <Button
        variant='ghost'
        size='sm'
        className='h-6 px-2 font-mono text-[10px] uppercase tracking-microlabel'
        data-testid='input-recovery-resync'
        onClick={onResync}
        title={t('client.game_layout.resync_hint', {
          defaultValue: 'Re-sync game state if the prompt is stuck',
        })}
      >
        {t('client.game_layout.resync', { defaultValue: 'Resync' })}
      </Button>
      {canUndo ? (
        <Button
          variant='ghost'
          size='sm'
          className='h-6 px-2 font-mono text-[10px] uppercase tracking-microlabel'
          data-testid='input-recovery-undo'
          onClick={onUndo}
          title={t('client.game_layout.undo_to_turn_start', {
            defaultValue: 'Undo back to the start of your turn',
          })}
        >
          {t('client.game_layout.undo', { defaultValue: 'Undo' })}
        </Button>
      ) : null}
    </div>
  );
}

function InputStatusChip({ title }: { title: string }): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-[18rem] items-center gap-2 rounded-[3px] border border-[color:oklch(0.58_0.1_75/0.42)] px-2 py-0.5',
        'bg-[oklch(0.78_0.13_75/0.07)] text-[color:var(--signal-amber)]',
      )}
      data-testid='topbar-input-status'
      title={title}
    >
      <span
        aria-hidden
        className='signal-dot'
        data-active='true'
        data-signal='amber'
      />
      <span className='shrink-0 font-mono text-[0.625rem] uppercase tracking-microlabel'>
        {t('client.game_layout.awaiting_input', {
          defaultValue: 'Input Required',
        })}
      </span>
      <span className='hidden min-w-0 truncate font-mono text-[0.625rem] uppercase tracking-microlabel text-text-300 lg:block'>
        {title}
      </span>
    </div>
  );
}

/**
 * WordmarkMark — the shared instrument-diamond brand mark (mirrors the lobby
 * AppShell). Three concentric rhombi, hairline-drawn anodized blue; anchors
 * the in-game chrome to the same identity as the mission center.
 */
function WordmarkMark(): React.JSX.Element {
  return (
    <span
      aria-hidden
      className='relative hidden h-6 w-6 shrink-0 items-center justify-center sm:inline-flex'
    >
      <span className='absolute inset-0.5 rotate-45 border border-[color:var(--metal-edge)] bg-[var(--surface-instrument)]' />
      <span className='absolute inset-[6px] rotate-45 border border-[oklch(0.48_0.10_240)] bg-[oklch(0.32_0.08_240)]' />
      <span className='absolute inset-[9px] rotate-45 bg-[var(--signal-blue-hi)]' />
    </span>
  );
}
