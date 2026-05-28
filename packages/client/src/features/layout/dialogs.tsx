import { EResource } from '@seti/common/types/element';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { IPublicPlayerState } from '@/types/re-exports';
import type { IPlaceDataOption, ISampleDeliveryOption } from './sessionHelpers';

const RESOURCE_I18N_KEY: Partial<Record<EResource, string>> = {
  [EResource.CREDIT]: 'credit',
  [EResource.ENERGY]: 'energy',
  [EResource.CARD]: 'card',
};

type TExchangeOption =
  | { from: EResource; to: EResource; cardSource?: undefined }
  | { from: EResource; to: EResource.CARD; cardSource: 'row' | 'deck' };

const EXCHANGE_OPTIONS: TExchangeOption[] = [
  { from: EResource.CREDIT, to: EResource.ENERGY },
  { from: EResource.CREDIT, to: EResource.CARD, cardSource: 'row' },
  { from: EResource.CREDIT, to: EResource.CARD, cardSource: 'deck' },
  { from: EResource.ENERGY, to: EResource.CREDIT },
  { from: EResource.ENERGY, to: EResource.CARD, cardSource: 'row' },
  { from: EResource.ENERGY, to: EResource.CARD, cardSource: 'deck' },
  { from: EResource.CARD, to: EResource.CREDIT },
  { from: EResource.CARD, to: EResource.ENERGY },
];

export function ExchangeResourcesDialog({
  open,
  player,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  player: IPublicPlayerState | null | undefined;
  onCancel: () => void;
  onConfirm: (
    from: EResource,
    to: EResource,
    cardPick?: { fromDeck?: boolean; spentCardIds?: string[] },
  ) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const [spentCardIds, setSpentCardIds] = useState<string[]>([]);
  useEffect(() => {
    if (!open) setSpentCardIds([]);
  }, [open]);
  const handCards = player?.hand ?? [];
  const toggleSpentCard = (cardId: string): void => {
    setSpentCardIds((current) => {
      if (current.includes(cardId))
        return current.filter((id) => id !== cardId);
      if (current.length >= 2) return current;
      return [...current, cardId];
    });
  };
  const canAfford = (from: EResource): boolean => {
    if (!player) return false;
    if (from === EResource.CARD) {
      return handCards.length >= 2 && spentCardIds.length === 2;
    }
    if (from === EResource.CREDIT)
      return (player.resources[EResource.CREDIT] ?? 0) >= 2;
    if (from === EResource.ENERGY)
      return (player.resources[EResource.ENERGY] ?? 0) >= 2;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('client.game_layout.exchange_title')}</DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.exchange_desc')}
          </p>
        </DialogHeader>
        {handCards.length > 0 ? (
          <div className='rounded-md border border-surface-700/50 p-2'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-300'>
              Select 2 cards to spend
            </p>
            <div className='grid grid-cols-1 gap-1.5'>
              {handCards.map((card) => {
                const isSelected = spentCardIds.includes(card.id);
                return (
                  <Button
                    key={card.id}
                    type='button'
                    variant={isSelected ? 'primary' : 'ghost'}
                    aria-pressed={isSelected}
                    onClick={() => toggleSpentCard(card.id)}
                    className='h-9 justify-start px-3 text-left text-xs'
                  >
                    {card.name ?? card.id}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className='grid grid-cols-1 gap-1.5'>
          {EXCHANGE_OPTIONS.map((opt) => {
            const key =
              opt.to === EResource.CARD && opt.cardSource
                ? `${opt.from}-${opt.to}-${opt.cardSource}`
                : `${opt.from}-${opt.to}`;
            const label =
              opt.to === EResource.CARD && opt.cardSource
                ? t('client.game_layout.exchange_into_card', {
                    from: t(`client.resources.${RESOURCE_I18N_KEY[opt.from]}`),
                    source:
                      opt.cardSource === 'row'
                        ? t('client.game_layout.buy_from_row')
                        : t('client.game_layout.buy_from_deck'),
                  })
                : t('client.game_layout.exchange_option', {
                    from: t(`client.resources.${RESOURCE_I18N_KEY[opt.from]}`),
                    to: t(`client.resources.${RESOURCE_I18N_KEY[opt.to]}`),
                  });
            return (
              <Button
                key={key}
                variant='ghost'
                disabled={!canAfford(opt.from)}
                onClick={() => {
                  const cardPick = {
                    ...(opt.from === EResource.CARD ? { spentCardIds } : {}),
                    ...(opt.to === EResource.CARD && opt.cardSource
                      ? { fromDeck: opt.cardSource === 'deck' }
                      : {}),
                  };
                  onConfirm(
                    opt.from,
                    opt.to,
                    Object.keys(cardPick).length > 0 ? cardPick : undefined,
                  );
                }}
                className='h-10 justify-start gap-2 px-3 text-left text-sm'
              >
                <span
                  aria-hidden
                  className='inline-block h-px w-3 bg-accent-500/80'
                />
                <span className='flex-1 font-body text-[13px] text-text-100'>
                  {label}
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PlaceDataDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: IPlaceDataOption[];
  onCancel: () => void;
  onConfirm: (slotIndex: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('client.game_layout.place_data_title')}</DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.place_data_desc')}
          </p>
        </DialogHeader>
        <div className='grid grid-cols-1 gap-1.5'>
          {options.map((opt) => (
            <Button
              key={`${opt.row}-${opt.slotIndex}`}
              variant='ghost'
              onClick={() => onConfirm(opt.slotIndex)}
              className='h-10 justify-start gap-2 px-3 text-left text-sm'
            >
              <img
                src='/assets/seti/tokens/data.png'
                alt=''
                aria-hidden
                className='h-5 w-5'
              />
              <span className='flex-1 font-body text-[13px] text-text-100'>
                {opt.row === 'top'
                  ? t('client.game_layout.place_data_top', {
                      index: opt.slotIndex + 1,
                    })
                  : t('client.game_layout.place_data_bottom', {
                      index: opt.slotIndex + 1,
                    })}
              </span>
              <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
                {opt.row === 'top' ? 'A' : 'B'}
                {opt.slotIndex + 1}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SampleDeliveryDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: ISampleDeliveryOption[];
  onCancel: () => void;
  onConfirm: (option: ISampleDeliveryOption) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('client.game_layout.deliver_sample_title')}
          </DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.deliver_sample_desc')}
          </p>
        </DialogHeader>
        <div className='grid grid-cols-1 gap-1.5'>
          {options.map((option) => (
            <Button
              key={`${option.capsuleId}-${option.cardId}`}
              variant='ghost'
              onClick={() => onConfirm(option)}
              className='h-10 justify-start gap-2 px-3 text-left text-sm'
            >
              <span
                aria-hidden
                className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-text-100/60 bg-surface-950 font-mono text-[9px] font-bold text-text-100'
              >
                S
              </span>
              <span className='flex-1 font-body text-[13px] text-text-100'>
                {option.label}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConvertEnergyDialog({
  open,
  maxAmount,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  maxAmount: number;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const options = Array.from(
    { length: Math.max(0, maxAmount) },
    (_, i) => i + 1,
  ).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('client.game_layout.convert_energy_title')}
          </DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.convert_energy_desc')}
          </p>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-1.5 sm:grid-cols-4'>
          {options.map((amount) => (
            <Button
              key={amount}
              variant='ghost'
              onClick={() => onConfirm(amount)}
              className='h-11 flex-col gap-0.5 px-3 text-sm'
            >
              <span className='readout text-[15px] font-semibold text-text-100 leading-none'>
                {amount}
              </span>
              <span className='font-mono text-[9px] uppercase tracking-[0.14em] text-text-500'>
                {t('client.game_layout.convert_energy_unit', {
                  defaultValue: '⚡ → MOV',
                })}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BuyCardDialog({
  open,
  onCancel,
  onBuyFromRow,
  onBuyFromDeck,
}: {
  open: boolean;
  onCancel: () => void;
  onBuyFromRow: () => void;
  onBuyFromDeck: () => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('client.game_layout.buy_card_title')}</DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.buy_card_desc')}
          </p>
        </DialogHeader>
        <div className='instrument-panel p-3'>
          <div className='section-head mb-2'>
            <span aria-hidden className='section-head__tick' />
            <p className='micro-label'>{t('client.action_confirm.cost')}</p>
            <div aria-hidden className='section-head__rule' />
          </div>
          <p className='readout font-mono text-[13px] text-text-100'>
            {t('client.game_layout.buy_card_cost')}
          </p>
        </div>
        <div className='flex justify-end gap-2 mt-2'>
          <Button variant='ghost' onClick={onBuyFromRow}>
            {t('client.game_layout.buy_from_row')}
          </Button>
          <Button onClick={onBuyFromDeck}>
            {t('client.game_layout.buy_from_deck')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
