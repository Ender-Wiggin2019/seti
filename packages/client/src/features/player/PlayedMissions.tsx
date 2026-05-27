import { CardRenderContextProvider } from '@seti/cards';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardRender } from '@/features/cards/CardRender';

/**
 * Optional badge rendered under a mission thumbnail. Used for cards
 * that need a per-card status hint — e.g. Centaurian message cards
 * carry a "trigger at N VP" milestone annotation that's not on the
 * card data itself but lives on the alien board.
 */
export interface IPlayedMissionAnnotation {
  /** Short label like "→ 47 VP". */
  label: string;
  /** Optional tail like "(3 to go)". Hidden when absent. */
  hint?: string;
  /** Optional tone tag for styling. Defaults to neutral. */
  tone?: 'neutral' | 'pending';
}

export interface IPlayedMissionRow {
  card: IBaseCard;
  /** Stable key — useful when the same cardId appears in multiple slots. */
  key?: string;
  annotation?: IPlayedMissionAnnotation;
}

interface IPlayedMissionsProps {
  /**
   * Cards kept in play on the personal board that retain ongoing
   * effects through the round/end of game: mission cards (with
   * branch progress), end-game (golden) scoring cards, and pending
   * Centaurian message cards. All occupy the same physical
   * "missions slot" on the printed board.
   */
  missions: IPlayedMissionRow[];
  /** Optional click handler — opens the same enlarged preview used by hand/deck cards. */
  onCardInspect?: (card: IBaseCard) => void;
  /**
   * Completed (flipped face-down) mission cards. Rendered as a single
   * stacked-pile tile after the in-progress thumbnails; clicking the
   * pile opens a dialog showing every completed mission in a row so
   * any player can audit what each opponent has scored.
   */
  completedCards?: IBaseCard[];
  /**
   * Per-card branch claim flags piped to <CardRender> via context so
   * the image-mode Mission renderer overlays player-color tokens on
   * claimed branches, and the text-mode renderer prefixes claimed
   * rows with ✓.
   */
  branchClaimsByCardId?: Record<string, boolean[]>;
  /** Color used for claim tokens (image mode) and ✓ glyph (text mode). */
  ownerPlayerColor?: string;
}

export function PlayedMissions({
  missions,
  onCardInspect,
  completedCards = [],
  branchClaimsByCardId,
  ownerPlayerColor,
}: IPlayedMissionsProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const completedCount = completedCards.length;
  const showEmpty = missions.length === 0 && completedCount === 0;

  return (
    <CardRenderContextProvider
      value={
        branchClaimsByCardId || ownerPlayerColor
          ? {
              branchClaimsByCardId,
              ownerPlayerColor,
            }
          : null
      }
    >
    <section
      className='instrument-panel h-full p-2'
      data-testid='played-missions'
    >
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.played_missions.title', { defaultValue: 'Missions' })}
        </p>
        <div aria-hidden className='section-head__rule' />
        {completedCount > 0 ? (
          <span
            className='font-mono text-[10px] tabular-nums text-accent-300'
            data-testid='played-missions-completed-count'
            title={t('client.played_missions.completed_tooltip', {
              defaultValue: 'Completed missions',
            })}
          >
            ✓ {completedCount}
          </span>
        ) : null}
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {missions.length}
        </span>
      </div>

      {showEmpty ? (
        <div className='flex items-center justify-center rounded-[4px] border border-dashed border-[color:var(--metal-edge-soft)] bg-background-950/50 px-2 py-5'>
          <p className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
            {t('client.played_missions.empty', {
              defaultValue: 'No active missions',
            })}
          </p>
        </div>
      ) : (
        <div className='grid max-h-[180px] grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1 overflow-auto'>
          {missions.map((row, index) => (
            <MissionThumbnail
              key={row.key ?? `${row.card.id}-${index}`}
              row={row}
              onCardInspect={onCardInspect}
            />
          ))}
          {completedCount > 0 ? (
            <CompletedMissionsPile cards={completedCards} />
          ) : null}
        </div>
      )}
    </section>
    </CardRenderContextProvider>
  );
}

function MissionThumbnail({
  row,
  onCardInspect,
}: {
  row: IPlayedMissionRow;
  onCardInspect?: (card: IBaseCard) => void;
}): React.JSX.Element {
  const { card, annotation } = row;
  const tone =
    annotation?.tone === 'pending'
      ? 'border-accent-500/50 text-accent-300'
      : 'border-[color:var(--metal-edge-soft)] text-text-400';
  return (
    <button
      type='button'
      data-testid={`played-mission-${card.id}`}
      className={`flex flex-col items-stretch justify-start rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 p-0.5 shadow-hairline-inset transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[oklch(0.40_0.04_240)] focus-visible:outline-none focus-visible:shadow-focus-ring ${
        onCardInspect ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={() => onCardInspect?.(card)}
    >
      <div className='pointer-events-none relative h-[109px] w-full'>
        <div className='absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[0.52]'>
          <CardRender card={card} />
        </div>
      </div>
      {annotation ? (
        <div
          className={`mt-0.5 flex flex-col items-center gap-0 rounded-[3px] border bg-background-950/70 px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] ${tone}`}
          data-testid={`played-mission-${card.id}-annotation`}
        >
          <span className='leading-tight'>{annotation.label}</span>
          {annotation.hint ? (
            <span className='leading-tight text-text-500'>
              {annotation.hint}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

/**
 * One stacked-pile tile representing every completed mission for the
 * player. Three offset card-back layers + a green ✓N badge convey
 * "stack of flipped cards"; clicking opens a dialog that shows every
 * completed mission's front in a horizontal row (scrolls if many).
 */
function CompletedMissionsPile({
  cards,
}: {
  cards: IBaseCard[];
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        data-testid='played-missions-completed-pile'
        className='flex cursor-pointer flex-col items-stretch justify-start rounded-[4px] border border-accent-500/40 bg-background-900/70 p-0.5 shadow-hairline-inset transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-accent-400 focus-visible:outline-none focus-visible:shadow-focus-ring'
        onClick={() => setOpen(true)}
        title={t('client.played_missions.completed_pile_title', {
          defaultValue: 'Completed missions — click to view',
          count: cards.length,
        })}
      >
        <div className='pointer-events-none relative h-[109px] w-full'>
          <PileLayers count={cards.length} />
        </div>
        <div className='mt-0.5 flex flex-col items-center gap-0 rounded-[3px] border border-accent-500/50 bg-background-950/70 px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-accent-300'>
          <span className='leading-tight'>
            ✓{' '}
            {t('client.played_missions.completed_pile_label', {
              defaultValue: 'Completed',
            })}
          </span>
          <span className='leading-tight text-text-500'>{cards.length}</span>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='w-fit max-w-[min(96vw,_1200px)] bg-surface-900/95'>
          <DialogHeader>
            <DialogTitle>
              {t('client.played_missions.completed_dialog_title', {
                defaultValue: 'Completed missions',
                count: cards.length,
              })}
            </DialogTitle>
          </DialogHeader>
          <div className='overflow-x-auto rounded border border-surface-700/50 bg-surface-950/70 p-3'>
            <div className='flex w-fit flex-nowrap items-start gap-3'>
              {cards.map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className='shrink-0'
                  data-testid={`completed-mission-${card.id}`}
                >
                  <CardRender card={card} />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Three offset card-back layers reading as a small stack. Top layer
 * gets the ✓ badge; the layers underneath only render when the pile
 * has 2+ / 3+ cards so a single completed mission still looks like
 * a single back rather than a fake stack.
 */
function PileLayers({ count }: { count: number }): React.JSX.Element {
  const showSecond = count >= 2;
  const showThird = count >= 3;
  return (
    <>
      {showThird ? (
        <CardBackLayer offsetX={-6} offsetY={6} rotate={-4} opacity={0.65} />
      ) : null}
      {showSecond ? (
        <CardBackLayer offsetX={3} offsetY={3} rotate={2} opacity={0.8} />
      ) : null}
      <CardBackLayer offsetX={0} offsetY={0} rotate={0} opacity={1} top />
    </>
  );
}

function CardBackLayer({
  offsetX,
  offsetY,
  rotate,
  opacity,
  top = false,
}: {
  offsetX: number;
  offsetY: number;
  rotate: number;
  opacity: number;
  top?: boolean;
}): React.JSX.Element {
  return (
    <div
      className='absolute left-1/2 top-0 h-[109px] w-[78px] overflow-hidden rounded-[4px] border border-[color:var(--metal-edge-soft)] shadow-hairline-inset'
      style={{
        transform: `translateX(calc(-50% + ${offsetX}px)) translateY(${offsetY}px) rotate(${rotate}deg)`,
        opacity,
      }}
    >
      <img
        src='/assets/seti/cards/back_base.jpg'
        alt=''
        className='h-full w-full object-cover'
        draggable={false}
      />
      {top ? (
        <span
          aria-hidden
          className='absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-500/90 font-mono text-[9px] font-bold text-background-950 shadow-[0_0_3px_rgba(0,0,0,0.6)]'
        >
          ✓
        </span>
      ) : null}
    </div>
  );
}
