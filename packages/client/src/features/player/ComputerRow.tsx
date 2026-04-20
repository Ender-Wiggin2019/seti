import { IconFactory } from '@seti/cards';
import {
  EResource,
  ESpecialAction,
  type IIconItem,
  type TIcon,
} from '@seti/common/types/element';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { IPublicComputerState } from '@/types/re-exports';

interface IComputerRowProps {
  computer: IPublicComputerState;
  dataPoolCount: number;
  dataPoolMax: number;
  onPlaceData?: (row: 'top' | 'bottom', columnIndex: number) => void;
}

function makeIconItem(icon: TIcon, value = 1): IIconItem {
  return {
    type: icon,
    value,
    options: { size: 'xs' },
  };
}

function canPlaceTopSlot(
  computer: IPublicComputerState,
  columnIndex: number,
): boolean {
  const col = computer.columns[columnIndex];
  if (col.topFilled) return false;
  return computer.columns.slice(0, columnIndex).every((c) => c.topFilled);
}

function canPlaceBottomSlot(
  computer: IPublicComputerState,
  columnIndex: number,
): boolean {
  const col = computer.columns[columnIndex];
  if (!col.hasBottomSlot) return false;
  if (!col.topFilled) return false;
  return !col.bottomFilled;
}

function rewardToIcons(
  reward: {
    vp?: number;
    credits?: number;
    energy?: number;
    publicity?: number;
    drawCard?: number;
    tuckIncome?: number;
  } | null,
): IIconItem[] {
  if (!reward) return [];
  const items: IIconItem[] = [];
  if (reward.vp) items.push(makeIconItem(EResource.SCORE, reward.vp));
  if (reward.credits)
    items.push(makeIconItem(EResource.CREDIT, reward.credits));
  if (reward.energy) items.push(makeIconItem(EResource.ENERGY, reward.energy));
  if (reward.publicity)
    items.push(makeIconItem(EResource.PUBLICITY, reward.publicity));
  if (reward.drawCard)
    items.push(makeIconItem(EResource.CARD, reward.drawCard));
  return items;
}

interface ISlotProps {
  filled: boolean;
  interactive: boolean;
  rewardIcons: IIconItem[];
  isTuckBuiltin: boolean;
  onClick: () => void;
  testId: string;
  ariaLabel: string;
}

function Slot({
  filled,
  interactive,
  rewardIcons,
  isTuckBuiltin,
  onClick,
  testId,
  ariaLabel,
}: ISlotProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <button
      type='button'
      data-testid={testId}
      aria-label={ariaLabel}
      disabled={!interactive}
      onClick={onClick}
      className={cn(
        'relative flex h-9 w-full items-center justify-center rounded-[3px] transition-[background,border-color,box-shadow] duration-150',
        'focus-visible:outline-none focus-visible:shadow-focus-ring',
        filled
          ? [
              'border border-[color:var(--metal-edge)] bg-[oklch(0.13_0.02_260)]',
              'shadow-[inset_0_1px_0_oklch(0.96_0.008_260/0.15)]',
            ]
          : interactive
            ? [
                'border border-accent-500/60 bg-accent-500/[0.07]',
                'shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.15)]',
                'hover:bg-accent-500/15 hover:border-accent-500/90',
                'cursor-pointer',
              ]
            : [
                'border border-[color:var(--metal-edge-soft)] bg-background-900/70',
                'shadow-hairline-inset',
                'cursor-not-allowed',
              ],
      )}
    >
      {filled ? (
        <img
          src='/assets/seti/tokens/data.png'
          alt=''
          aria-hidden
          className='h-6 w-6'
        />
      ) : isTuckBuiltin ? (
        <span className='font-mono text-[8px] uppercase tracking-[0.08em] text-text-300'>
          {t('client.computer_row.tuck', { defaultValue: 'Tuck' })}
        </span>
      ) : rewardIcons.length > 0 ? (
        <div className='flex items-center gap-0.5'>
          {rewardIcons.map((item, idx) => (
            <IconFactory key={`${testId}-rew-${idx}`} iconItem={item} />
          ))}
        </div>
      ) : null}
    </button>
  );
}

interface IColumnProps {
  computer: IPublicComputerState;
  columnIndex: number;
  canPlace: boolean;
  onPlaceData?: (row: 'top' | 'bottom', columnIndex: number) => void;
}

function Column({
  computer,
  columnIndex,
  canPlace,
  onPlaceData,
}: IColumnProps): React.JSX.Element {
  const col = computer.columns[columnIndex];
  const topAvailable = canPlaceTopSlot(computer, columnIndex);
  const topInteractive = canPlace && topAvailable;
  const topIsTuck = !col.topFilled && (col.topReward?.tuckIncome ?? 0) > 0;
  const bottomAvailable = canPlaceBottomSlot(computer, columnIndex);
  const bottomInteractive = canPlace && bottomAvailable;
  const bottomIsTuck =
    !col.bottomFilled && (col.bottomReward?.tuckIncome ?? 0) > 0;

  return (
    <div className='flex flex-col items-stretch gap-0.5'>
      <Slot
        filled={col.topFilled}
        interactive={topInteractive}
        rewardIcons={rewardToIcons(col.topReward)}
        isTuckBuiltin={topIsTuck}
        onClick={() => topInteractive && onPlaceData?.('top', columnIndex)}
        testId={`computer-slot-top-${columnIndex}`}
        ariaLabel={`Computer top slot ${columnIndex + 1}`}
      />
      {col.hasBottomSlot ? (
        <Slot
          filled={col.bottomFilled}
          interactive={bottomInteractive}
          rewardIcons={rewardToIcons(col.bottomReward)}
          isTuckBuiltin={bottomIsTuck}
          onClick={() =>
            bottomInteractive && onPlaceData?.('bottom', columnIndex)
          }
          testId={`computer-slot-bottom-${columnIndex}`}
          ariaLabel={`Computer bottom slot ${columnIndex + 1}`}
        />
      ) : (
        <div
          aria-hidden
          className='h-9 w-full rounded-[3px] border border-dashed border-[color:var(--metal-edge-soft)]/40 bg-background-950/30'
        />
      )}
    </div>
  );
}

/**
 * ComputerRow — the player board's third row.
 *
 * Lays out the data pool readout, the six computer columns (with the
 * built-in publicity / tuck rewards on b and d, blue tech slots on
 * a/c/e/f), and an Analyze cap on the right. Pulls all glyphs from
 * the cards-package sprite sheet so this row stays visually
 * consistent with the rest of the player board.
 */
export function ComputerRow({
  computer,
  dataPoolCount,
  dataPoolMax,
  onPlaceData,
}: IComputerRowProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const canPlace = dataPoolCount > 0 && Boolean(onPlaceData);
  const isFull = dataPoolCount >= dataPoolMax;
  const columnsCount = computer.columns.length;

  return (
    <section data-testid='computer-row' className='instrument-panel p-1.5'>
      <div className='section-head mb-1'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.computer_view.title', { defaultValue: 'Computer' })}
        </p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {columnsCount}
          <span className='opacity-50'> COL</span>
        </span>
      </div>

      <div className='flex items-stretch gap-1.5'>
        <DataPoolGauge
          count={dataPoolCount}
          max={dataPoolMax}
          isFull={isFull}
        />

        <div className='flex min-w-0 flex-1 items-center gap-1 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/50 p-1'>
          <div
            className='grid min-w-0 flex-1 gap-1'
            style={{
              gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
            }}
          >
            {computer.columns.map((_, i) => (
              <Column
                key={`computer-col-${i}`}
                computer={computer}
                columnIndex={i}
                canPlace={canPlace}
                onPlaceData={onPlaceData}
              />
            ))}
          </div>
        </div>

        <div
          className='flex w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-950/70 px-0.5 py-1'
          title={t('client.computer_row.analyze', {
            defaultValue: 'Analyze Data',
          })}
        >
          <IconFactory
            iconItem={{
              type: ESpecialAction.COMPUTER,
              value: 1,
              options: { size: 'sm' },
            }}
          />
          <span className='font-mono text-[8px] uppercase tracking-[0.08em] text-text-300'>
            {t('client.computer_row.analyze', { defaultValue: 'Analyze' })}
          </span>
        </div>
      </div>
    </section>
  );
}

function DataPoolGauge({
  count,
  max,
  isFull,
}: {
  count: number;
  max: number;
  isFull: boolean;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div
      data-testid='data-pool-view'
      className='flex w-[88px] shrink-0 flex-col items-stretch gap-1 rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-950/70 px-2 py-1.5'
      title={t('client.data_pool.title', { defaultValue: 'Data Pool' })}
    >
      <div className='flex items-center justify-between gap-1.5'>
        <img
          src='/assets/seti/tokens/data.png'
          alt=''
          aria-hidden
          className='h-4 w-4 opacity-90'
        />
        <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
          {t('client.data_pool.title', { defaultValue: 'Data Pool' })}
        </span>
      </div>
      <p className='readout text-center text-[15px] font-semibold leading-none tabular-nums text-text-100'>
        {count}
        <span className='text-text-500'> / {max}</span>
      </p>
      {isFull ? (
        <span className='text-center font-mono text-[8px] uppercase tracking-[0.14em] text-accent-400'>
          {t('client.data_pool.full', { defaultValue: 'Full' })}
        </span>
      ) : null}
    </div>
  );
}
