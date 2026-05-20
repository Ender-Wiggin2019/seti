import { PRELUDE_CARDS_BY_ID } from '@seti/common/data/preludeCards';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import type { ETechId } from '@seti/common/types/tech';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardRender } from '@/features/cards/CardRender';
import { QuickStartCardPreview } from '@/features/setup/QuickStartCardPreview';
import { useTextMode } from '@/stores/debugStore';
import type {
  IFreeActionRequest,
  IPlayerInputModel,
  IPublicPlayerState,
} from '@/types/re-exports';
import { EFreeAction, EPlayerInputType } from '@/types/re-exports';
import { ComputerRow } from './ComputerRow';
import { IncomeTracker } from './IncomeTracker';
import { OrganizationCard } from './OrganizationCard';
import { ResourceBar } from './ResourceBar';
import { TechRow } from './TechRow';

interface IPlayerIncomeInfo {
  credit: number;
  energy: number;
  card: number;
}

interface IPlayerDashboardProps {
  player: IPublicPlayerState;
  pendingInput: IPlayerInputModel | null;
  onFreeAction: (action: IFreeActionRequest) => void;
  income?: IPlayerIncomeInfo;
  playedMissions?: IBaseCard[];
  techs?: ETechId[];
  /**
   * Whether to render the per-player exofossil cell. Forwarded straight
   * to ResourceBar — only true when an Oumuamua alien board is
   * discovered in the current game.
   */
  showExofossils?: boolean;
}

/**
 * PlayerDashboard — the player's personal board.
 *
 * Three primary rows mirror the physical board:
 *   1. ResourceBar  — credit / energy / publicity / score readouts
 *   2. TechRow      — Launch (4) and Scan (5) tech slots
 *   3. ComputerRow  — Data Pool, six computer columns, and Analyze cap
 *
 * A compact aux strip below carries the income forecast, piece inventory,
 * and mission/tech counts so they remain glanceable without dominating
 * the player board itself.
 */
export function PlayerDashboard({
  player,
  pendingInput,
  onFreeAction,
  income,
  playedMissions,
  techs,
  showExofossils = false,
}: IPlayerDashboardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  const playerTechs = techs ?? player.techs;
  const missionCount = playedMissions?.length ?? 0;
  const techCount = playerTechs.length;
  const cardInputActive = pendingInput?.type === EPlayerInputType.CARD;
  const organizationIds = player.organizationIds ?? [];
  const quickStartCardIds = player.quickStartCardIds ?? [];
  const playedCards = player.playedCards ?? playedMissions ?? [];
  const playedCardCount = quickStartCardIds.length + playedCards.length;

  return (
    <section className='space-y-1.5' data-testid='player-dashboard'>
      <ResourceBar player={player} showExofossils={showExofossils} />
      {organizationIds.length > 0 ? (
        <div
          className='flex items-start gap-2 overflow-x-auto'
          data-testid='player-organizations'
        >
          <div className='flex min-w-0 flex-1 items-start gap-2 overflow-x-auto'>
            {organizationIds.map((organizationId) => (
              <OrganizationCard
                key={organizationId}
                organizationId={organizationId}
                available={
                  player.usableOrganizationPowerIds?.includes(
                    organizationId,
                  ) === true
                }
                used={player.oncePerRoundUsed?.[organizationId] === true}
                state={player.organizationState?.[organizationId]}
                onUse={(id) =>
                  onFreeAction({
                    type: EFreeAction.USE_ORGANIZATION_POWER,
                    organizationId: id,
                  })
                }
              />
            ))}
          </div>
          <PlayedCardsDialog
            quickStartCardIds={quickStartCardIds}
            playedCards={playedCards}
            count={playedCardCount}
          />
        </div>
      ) : null}

      <div className='instrument-panel relative overflow-hidden p-1.5'>
        {!textMode && (
          <div
            className='pointer-events-none absolute inset-0 opacity-40 mix-blend-luminosity'
            style={{
              backgroundImage:
                'linear-gradient(oklch(0.08 0.018 260 / 0.78), oklch(0.08 0.018 260 / 0.78)), url(/assets/seti/boards/playerBoard.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden
          />
        )}

        <div className='relative flex flex-col gap-1.5'>
          <TechRow techs={playerTechs} />

          <ComputerRow
            computer={player.computer}
            dataPoolCount={player.dataPoolCount}
            dataPoolMax={player.dataPoolMax}
            onPlaceData={(row, columnIndex) =>
              onFreeAction({
                type: EFreeAction.PLACE_DATA,
                slotIndex: columnIndex,
              })
            }
          />

          <div className='grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-1.5'>
            <IncomeTracker
              creditIncome={income?.credit ?? 0}
              energyIncome={income?.energy ?? 0}
              cardIncome={income?.card ?? 0}
            />

            <section className='instrument-panel p-2'>
              <div className='section-head mb-1.5'>
                <span aria-hidden className='section-head__tick' />
                <p className='micro-label'>
                  {t('client.player_dashboard.missions')}
                </p>
                <div aria-hidden className='section-head__rule' />
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <img
                    src='/assets/seti/icons/missionSatellite.png'
                    alt=''
                    aria-hidden
                    className='h-4 w-4 opacity-90'
                  />
                  <span className='font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
                    {t('client.player_dashboard.played')}
                  </span>
                </div>
                <span className='readout text-sm font-semibold leading-none text-text-100'>
                  {missionCount}
                </span>
              </div>
              <div className='mt-1.5 flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <img
                    src='/assets/seti/icons/progress.png'
                    alt=''
                    aria-hidden
                    className='h-4 w-4 opacity-90'
                  />
                  <span className='font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
                    {t('client.player_dashboard.tech')}
                  </span>
                </div>
                <span className='readout text-sm font-semibold leading-none text-text-100'>
                  {techCount}
                </span>
              </div>
              {cardInputActive ? (
                <div className='mt-2 flex items-center gap-1.5 border-t border-[color:var(--metal-edge-soft)] pt-1.5'>
                  <span
                    aria-hidden
                    className='h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500 shadow-[0_0_6px_oklch(0.68_0.11_240/0.8)] motion-safe:animate-pulse'
                  />
                  <p className='font-mono text-[10px] uppercase tracking-[0.12em] text-accent-400'>
                    {t('client.player_dashboard.card_selection_active')}
                  </p>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayedCardsDialog({
  quickStartCardIds,
  playedCards,
  count,
}: {
  quickStartCardIds: string[];
  playedCards: IBaseCard[];
  count: number;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => setOpen(true)}
        className='h-auto min-w-[128px] shrink-0 flex-col items-start gap-0.5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em]'
        data-testid='show-all-played-cards'
      >
        <span>{t('client.played_cards.show_all')}</span>
        <span className='text-text-500'>
          {t('client.played_cards.count', { count })}
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{t('client.played_cards.title')}</DialogTitle>
          </DialogHeader>
          {count === 0 ? (
            <div className='rounded-[4px] border border-dashed border-[color:var(--metal-edge-soft)] bg-background-950/50 px-3 py-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
              {t('client.played_cards.empty')}
            </div>
          ) : (
            <div className='max-h-[70vh] space-y-4 overflow-y-auto pr-1'>
              {quickStartCardIds.length > 0 ? (
                <section>
                  <p className='micro-label mb-2'>
                    {t('client.quick_start_card.short_label')}
                  </p>
                  <div className='grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2'>
                    {quickStartCardIds.map((cardId) => {
                      const card = PRELUDE_CARDS_BY_ID[cardId];
                      return card ? (
                        <QuickStartCardPreview key={cardId} card={card} />
                      ) : (
                        <span
                          key={cardId}
                          className='chip font-mono text-[10px]'
                        >
                          {cardId}
                        </span>
                      );
                    })}
                  </div>
                </section>
              ) : null}
              {playedCards.length > 0 ? (
                <section>
                  <p className='micro-label mb-2'>
                    {t('client.played_cards.cards')}
                  </p>
                  <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3'>
                    {playedCards.map((card, index) => (
                      <div
                        key={`${card.id}-${index}`}
                        className='flex justify-center'
                      >
                        <CardRender card={card} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
