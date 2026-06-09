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

const RESOURCE_ICON_SRC: Partial<Record<EResource, string>> = {
  [EResource.CREDIT]: '/assets/seti/icons/money.png',
  [EResource.ENERGY]: '/assets/seti/icons/energy.png',
  [EResource.CARD]: '/assets/seti/icons/draw.png',
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
          <div className='rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)]/70 p-3 shadow-hairline-inset'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-300'>
              {t('client.layout_v2.dialogs.select_two_cards_to_spend', {
                defaultValue: 'Select 2 cards to spend',
              })}
            </p>
            <div className='grid grid-cols-1 gap-1.5'>
              {handCards.map((card) => {
                const isSelected = spentCardIds.includes(card.id);
                return (
                  <Button
                    key={card.id}
                    type='button'
                    variant={isSelected ? 'primary' : 'ghost'}
                    data-testid={`exchange-spend-card-${card.id}`}
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
                className='h-11 justify-start gap-3 px-3 text-left text-sm'
              >
                <ResourcePairIcon from={opt.from} to={opt.to} />
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
              className='h-11 justify-start gap-3 px-3 text-left text-sm'
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
              className='h-11 justify-start gap-3 px-3 text-left text-sm'
            >
              <img
                src='/assets/seti/icons/missionSatellite.png'
                alt=''
                aria-hidden
                className='h-5 w-5'
              />
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

function ResourcePairIcon({
  from,
  to,
}: {
  from: EResource;
  to: EResource;
}): React.JSX.Element {
  const fromIcon = RESOURCE_ICON_SRC[from];
  const toIcon = RESOURCE_ICON_SRC[to];

  return (
    <span
      aria-hidden
      className='inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)] px-1.5 py-1 shadow-hairline-inset'
    >
      {fromIcon ? <img src={fromIcon} alt='' className='h-4 w-4' /> : null}
      <span className='h-px w-2 bg-[color:var(--metal-edge-soft)]' />
      {toIcon ? <img src={toIcon} alt='' className='h-4 w-4' /> : null}
    </span>
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
