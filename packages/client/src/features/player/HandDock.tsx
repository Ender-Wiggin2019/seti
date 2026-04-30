import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { IPlayerInputModel } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { HandView } from './HandView';

interface IHandDockProps {
  cards?: IBaseCard[];
  handSize: number;
  pendingInput: IPlayerInputModel | null;
  cornerSelectionMode: boolean;
  playCardSelectionMode: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSubmitSelection: (cardIds: string[]) => void;
  onCardCornerSelect: (cardId: string) => void;
  onCardPlaySelect: (cardId: string) => void;
  onCardInspect: (card: IBaseCard) => void;
}

/**
 * HandDock — the collapsible hand strip anchored to the bottom of the
 * game layout. Shows its own header rail (count, selection mode tags,
 * toggle chevron) and animates open/closed via a grid-template-rows
 * transition so nothing jumps height or clips abruptly.
 *
 * Collapsed state hides the card grid entirely; only the rail remains.
 * While a CARD-selection input is pending the dock force-expands and
 * locks the toggle, because folding away the cards the server is asking
 * the player to pick would be a usability trap.
 */
export function HandDock({
  cards,
  handSize,
  pendingInput,
  cornerSelectionMode,
  playCardSelectionMode,
  expanded,
  onToggle,
  onSubmitSelection,
  onCardCornerSelect,
  onCardPlaySelect,
  onCardInspect,
}: IHandDockProps): React.JSX.Element {
  const { t } = useTranslation('common');

  const isCardSelectionActive = pendingInput?.type === EPlayerInputType.CARD;

  const effectiveExpanded = useMemo(
    () =>
      expanded ||
      isCardSelectionActive ||
      cornerSelectionMode ||
      playCardSelectionMode,
    [
      expanded,
      isCardSelectionActive,
      cornerSelectionMode,
      playCardSelectionMode,
    ],
  );

  useEffect(() => {
    if (
      (isCardSelectionActive || cornerSelectionMode || playCardSelectionMode) &&
      !expanded
    ) {
      onToggle();
    }
    // We only want to trigger a force-open when a new input or corner mode
    // begins while the dock is collapsed. Disabling the exhaustive-deps lint
    // here is intentional — re-running on `onToggle` identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCardSelectionActive, cornerSelectionMode, playCardSelectionMode]);

  const modeLabel = isCardSelectionActive
    ? t('client.hand_view.mode_select', { defaultValue: 'SELECT' })
    : cornerSelectionMode
      ? t('client.hand_view.mode_corner', { defaultValue: 'CORNER' })
      : playCardSelectionMode
        ? t('client.hand_view.mode_play', { defaultValue: 'PLAY' })
        : null;

  const toggleLabel = effectiveExpanded
    ? t('client.game_layout.hide_hand')
    : t('client.game_layout.show_hand');
  const toggleLocked =
    isCardSelectionActive || cornerSelectionMode || playCardSelectionMode;

  return (
    <div
      className='relative shrink-0 border-t border-[color:var(--metal-edge-soft)] bg-background-950/85 backdrop-blur-sm'
      data-testid='hand-dock'
      data-expanded={effectiveExpanded}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--surface-700)] to-transparent opacity-70'
      />

      {/* Header rail — always visible, even when the dock is collapsed */}
      <div className='flex items-center gap-3 px-4 py-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label whitespace-nowrap'>
          {t('client.game_layout.hand')}
        </p>
        <span className='font-mono text-[10px] text-text-500 tabular-nums whitespace-nowrap'>
          {t('client.hand_view.count', {
            count: handSize,
            defaultValue: `${handSize} cards`,
          })}
        </span>

        {modeLabel ? (
          <span className='font-mono text-[9px] uppercase tracking-[0.14em] text-accent-400 whitespace-nowrap'>
            {modeLabel}
          </span>
        ) : null}

        {!effectiveExpanded && handSize > 0 ? (
          <span className='hidden truncate font-mono text-[10px] text-text-500 md:inline'>
            {t('client.game_layout.hand_collapsed_hint', { count: handSize })}
          </span>
        ) : null}

        <div aria-hidden className='flex-1' />

        <button
          type='button'
          onClick={() => {
            if (toggleLocked) return;
            onToggle();
          }}
          disabled={toggleLocked}
          aria-expanded={effectiveExpanded}
          aria-controls='hand-dock-content'
          data-testid='hand-dock-toggle'
          className={cn(
            'flex items-center gap-1.5 rounded-[3px] border px-2 py-1',
            'font-mono text-[10px] uppercase tracking-[0.14em]',
            'transition-[background,border-color,color] duration-150',
            toggleLocked
              ? 'cursor-not-allowed border-[color:var(--metal-edge-soft)] text-text-500 opacity-60'
              : 'border-[color:var(--metal-edge-soft)] text-text-300 hover:border-[oklch(0.40_0.04_240)] hover:bg-background-800/80 hover:text-text-100',
          )}
        >
          <span
            aria-hidden
            className='inline-block h-1 w-1 rounded-full bg-accent-500/80'
          />
          {toggleLabel}
          <span
            aria-hidden
            className={cn(
              'inline-block h-0 w-0 border-x-[4px] border-x-transparent transition-transform duration-200',
              effectiveExpanded
                ? 'border-b-[5px] border-b-current'
                : 'border-t-[5px] border-t-current',
            )}
          />
        </button>
      </div>

      {/* Collapsible body — animated via grid-template-rows to avoid layout
          jank from animating height directly */}
      <div
        id='hand-dock-content'
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          effectiveExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        aria-hidden={!effectiveExpanded}
      >
        <div className='min-h-0 overflow-hidden'>
          <div className='px-4 pb-2 pt-0.5'>
            <HandView
              cards={cards}
              handSize={handSize}
              pendingInput={pendingInput}
              cornerSelectionMode={cornerSelectionMode}
              playCardSelectionMode={playCardSelectionMode}
              onSubmitSelection={onSubmitSelection}
              onCardCornerSelect={onCardCornerSelect}
              onCardPlaySelect={onCardPlaySelect}
              onCardInspect={onCardInspect}
              variant='dock'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
