import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
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
}

export function PlayedMissions({
  missions,
  onCardInspect,
}: IPlayedMissionsProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
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
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {missions.length}
        </span>
      </div>

      {missions.length === 0 ? (
        <div className='flex items-center justify-center rounded-[4px] border border-dashed border-[color:var(--metal-edge-soft)] bg-background-950/50 px-2 py-5'>
          <p className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
            {t('client.played_missions.empty', {
              defaultValue: 'No active missions',
            })}
          </p>
        </div>
      ) : (
        <div className='grid max-h-[180px] grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1 overflow-auto'>
          {missions.map((row, index) => {
            const { card, annotation } = row;
            const key = row.key ?? `${card.id}-${index}`;
            const tone =
              annotation?.tone === 'pending'
                ? 'border-accent-500/50 text-accent-300'
                : 'border-[color:var(--metal-edge-soft)] text-text-400';
            return (
              <button
                key={key}
                type='button'
                data-testid={`played-mission-${card.id}`}
                className='flex flex-col items-stretch justify-start rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 p-0.5 shadow-hairline-inset transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[oklch(0.40_0.04_240)] focus-visible:outline-none focus-visible:shadow-focus-ring'
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
          })}
        </div>
      )}
    </section>
  );
}
