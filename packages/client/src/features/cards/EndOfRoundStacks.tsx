import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { CardRender } from './CardRender';

export type TEndOfRoundMode = 'idle' | 'select';

interface IEndOfRoundStacksProps {
  stacks: IBaseCard[][];
  stackCounts?: number[];
  currentRoundIndex: number;
  mode?: TEndOfRoundMode;
  onSelectCard?: (card: IBaseCard) => void;
  /**
   * True once the first player has passed this round (rotation token
   * already consumed). When false, the current round's stack carries
   * a rotation reminder token overlay.
   */
  hasRoundFirstPassOccurred?: boolean;
  /**
   * Current round number (1-indexed) and maximum rounds. Used to flag
   * the final round — round `maxRounds` has no end-of-round draw, so
   * we replace the per-stack highlight with a "Final Round" banner so
   * the player knows the round bonus is no longer live.
   */
  round?: number;
  maxRounds?: number;
}

export function EndOfRoundStacks({
  stacks,
  stackCounts,
  currentRoundIndex,
  mode = 'idle',
  onSelectCard,
  hasRoundFirstPassOccurred = false,
  round,
  maxRounds,
}: IEndOfRoundStacksProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const currentStack = stacks[currentRoundIndex] ?? [];
  const visibleStackCount = stackCounts?.length ?? stacks.length;
  const isFinalRound =
    round !== undefined && maxRounds !== undefined && round >= maxRounds;
  // Final round (e.g. round 5) has no end-of-round draw — stacks are
  // empty and no rotation token applies, so suppress both the current-
  // round highlight and the rotation overlay.
  const showRotationToken = !hasRoundFirstPassOccurred && !isFinalRound;

  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2 flex items-center justify-between gap-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.end_of_round.title')}
        </h2>
        {isFinalRound ? (
          <span
            data-testid='end-of-round-final-banner'
            className='rounded border border-signal-amber/70 bg-signal-amber/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-signal-amber-hi'
            title={t('client.end_of_round.final_round_hint', {
              defaultValue: 'No end-of-round draw',
            })}
          >
            {t('client.end_of_round.final_round', {
              defaultValue: 'Final Round',
            })}
          </span>
        ) : null}
      </header>

      <div className='flex items-stretch gap-2'>
        {Array.from({ length: visibleStackCount }, (_, index) => {
          const stackCards = stacks[index] ?? [];
          const stackCardCount = stackCounts?.[index] ?? stackCards.length;
          // Current-round highlight only applies during the bonus
          // round window (rounds 1..maxRounds-1). In the final round
          // there's no live stack to play to, so all tiles render in
          // the muted "completed" style.
          const isCurrent = !isFinalRound && index === currentRoundIndex;
          const showTokenOnTile = isCurrent && showRotationToken;
          return (
            <div
              key={`round-stack-${index}`}
              data-testid={`round-stack-${index}`}
              className={cn(
                'flex flex-col items-center rounded-md border p-2 transition-all',
                // Current round: 2× the flex weight + accent palette
                // (filled tint + ring) so it pops vs idle rounds.
                // Idle rounds shrink to a single flex unit and use
                // a muted surface so they read as supporting info.
                isCurrent
                  ? 'flex-[2] border-accent-500 bg-accent-500/10 ring-1 ring-accent-500/60 shadow-[0_0_12px_oklch(0.68_0.11_240/0.18)]'
                  : 'flex-1 border-surface-700/40 bg-surface-900/40 opacity-80',
              )}
            >
              <p
                className={cn(
                  'font-mono text-[10px] uppercase tracking-wider',
                  isCurrent ? 'text-accent-300' : 'text-text-500',
                )}
              >
                {t('client.end_of_round.round', { index: index + 1 })}
                {isCurrent ? (
                  <span className='ml-1 text-[8px] font-bold tracking-[0.2em]'>
                    ●
                  </span>
                ) : null}
              </p>
              {/*
                Card-back tile. Current round: full 1.4× size matching
                the surrounding card row layout (105×147). Idle rounds:
                ~⅔ scale so the row stays compact and the focus visibly
                shifts to the active stack.
              */}
              <div
                className={cn(
                  'relative mt-1',
                  isCurrent ? 'h-[147px] w-[105px]' : 'h-[98px] w-[70px]',
                )}
              >
                <div className='absolute inset-0 rounded border border-surface-700/50 bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center' />
                {showTokenOnTile ? (
                  <RotationReminderToken
                    testId={`rotation-token-stack-${index}`}
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  'mt-1 font-mono text-[10px]',
                  isCurrent ? 'text-text-100' : 'text-text-400',
                )}
              >
                {t('client.end_of_round.cards', { count: stackCardCount })}
              </p>
            </div>
          );
        })}
      </div>

      {mode === 'select' && (
        <div className='mt-3 rounded-md border border-accent-500/40 bg-accent-500/10 p-2'>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-wider text-accent-300'>
            {t('client.end_of_round.select_one')}
          </p>
          <div className='flex flex-wrap gap-2'>
            {currentStack.map((card) => (
              <button
                key={card.id}
                type='button'
                data-testid={`round-stack-card-${card.id}`}
                onClick={() => onSelectCard?.(card)}
                className='w-fit shrink-0 overflow-hidden rounded border border-surface-700/50 bg-surface-900/70 p-2 text-left transition-colors hover:border-accent-500'
              >
                <div
                  className='pointer-events-none'
                  style={{
                    width: '210px',
                    height: '293px',
                    position: 'relative',
                  }}
                >
                  <div
                    className='absolute left-0 top-0 origin-top-left'
                    style={{ transform: 'scale(1.4)' }}
                  >
                    <CardRender card={card} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Rotation reminder token — the physical "first to pass rotates the
 * solar system" token. Sits on top of the current round's end-of-round
 * stack until the first player passes; the server clears
 * hasRoundFirstPassOccurred=true when consumed, and on round
 * transition the next round's stack becomes current and the token
 * appears there instead.
 *
 * Visual: small accent-bordered disc with the rotate glyph from the
 * shared seti-icons spritesheet, slightly oversized + off-center on
 * the card-back so it reads as a physical token sitting on top.
 */
function RotationReminderToken({
  testId,
}: {
  testId: string;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <img
      data-testid={testId}
      src='/assets/seti/cards/rotation-token.png'
      alt={t('client.alien_board_extra.rotation_token_alt', {
        defaultValue: 'Rotation reminder token',
      })}
      title={t('client.alien_board_extra.rotation_token_title', {
        defaultValue: 'First player to pass rotates the solar system',
      })}
      draggable={false}
      className='pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 select-none rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.6)]'
    />
  );
}
