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
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
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
  /**
   * Per-resource income from cards tucked during play (excludes the
   * starting income card). Optional — when undefined the income
   * tracker just shows totals.
   */
  tuckedCredit?: number;
  tuckedEnergy?: number;
  tuckedCard?: number;
}

interface IPersonalBoardHotspot {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  color?: string;
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

const PLAYER_BOARD_RESOURCE_BASE_WIDTH = 600;
const PLAYER_BOARD_RESOURCE_BASE_HEIGHT = 48;
const PLAYER_BOARD_MAIN_BASE_WIDTH = 1000;
const PLAYER_BOARD_MAIN_BASE_HEIGHT = 420;
const PLAYER_BOARD_MAIN_HOTSPOTS: IPersonalBoardHotspot[] = [
  {
    id: 'tech-launch',
    label: 'player board launch tech',
    xPct: 26,
    yPct: 19,
    widthPct: 42,
    heightPct: 27,
    color: '#f97316',
  },
  {
    id: 'tech-scan',
    label: 'player board scan tech',
    xPct: 73,
    yPct: 19,
    widthPct: 42,
    heightPct: 27,
    color: '#f97316',
  },
  {
    id: 'data-pool',
    label: 'player board data pool',
    xPct: 9,
    yPct: 56,
    widthPct: 15,
    heightPct: 23,
    color: '#60a5fa',
  },
  {
    id: 'analyze',
    label: 'player board analyze',
    xPct: 93,
    yPct: 56,
    widthPct: 10,
    heightPct: 25,
    color: '#22c55e',
  },
  {
    id: 'income',
    label: 'player board income',
    xPct: 25,
    yPct: 86,
    widthPct: 45,
    heightPct: 20,
    color: '#a78bfa',
  },
  {
    id: 'mission-summary',
    label: 'player board mission summary',
    xPct: 74,
    yPct: 86,
    widthPct: 38,
    heightPct: 20,
    color: '#a78bfa',
  },
];

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

  const hotspotVariant = textMode ? 'text' : 'image';

  return (
    <section className='space-y-1.5' data-testid='player-dashboard'>
      <div className='relative'>
        <ResourceBar player={player} showExofossils={showExofossils} />
        <PlayerBoardResourceHotspots
          showExofossils={showExofossils}
          variant={hotspotVariant}
        />
      </div>
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
              tuckedCreditIncome={income?.tuckedCredit}
              tuckedEnergyIncome={income?.tuckedEnergy}
              tuckedCardIncome={income?.tuckedCard}
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
        <PlayerBoardMainHotspots variant={hotspotVariant} />
      </div>
    </section>
  );
}

function PlayerBoardResourceHotspots({
  showExofossils,
  variant,
}: {
  showExofossils: boolean;
  variant: 'image' | 'text';
}): React.JSX.Element {
  const ids = showExofossils
    ? ['credit', 'energy', 'publicity', 'signal-token', 'score', 'exofossils']
    : ['credit', 'energy', 'publicity', 'signal-token', 'score'];
  const widthPct = 100 / ids.length;

  return (
    <>
      {ids.map((id, index) => (
        <HotspotAnchor
          key={`player-board-resource-${id}`}
          sceneId='player-board'
          hotspotId={`resource-${id}`}
          variant={variant}
          baseWidth={PLAYER_BOARD_RESOURCE_BASE_WIDTH}
          baseHeight={PLAYER_BOARD_RESOURCE_BASE_HEIGHT}
          x={(PLAYER_BOARD_RESOURCE_BASE_WIDTH * (index + 0.5)) / ids.length}
          y={PLAYER_BOARD_RESOURCE_BASE_HEIGHT / 2}
          width={(PLAYER_BOARD_RESOURCE_BASE_WIDTH * widthPct) / 100}
          height={PLAYER_BOARD_RESOURCE_BASE_HEIGHT}
          shape='rect'
          color='#38bdf8'
          opacity={0.2}
          debugLabel={`player board ${id}`}
        />
      ))}
    </>
  );
}

function PlayerBoardMainHotspots({
  variant,
}: {
  variant: 'image' | 'text';
}): React.JSX.Element {
  return (
    <>
      {PLAYER_BOARD_MAIN_HOTSPOTS.map((hotspot) => (
        <HotspotAnchor
          key={`player-board-${hotspot.id}`}
          sceneId='player-board'
          hotspotId={hotspot.id}
          variant={variant}
          baseWidth={PLAYER_BOARD_MAIN_BASE_WIDTH}
          baseHeight={PLAYER_BOARD_MAIN_BASE_HEIGHT}
          x={(PLAYER_BOARD_MAIN_BASE_WIDTH * hotspot.xPct) / 100}
          y={(PLAYER_BOARD_MAIN_BASE_HEIGHT * hotspot.yPct) / 100}
          width={(PLAYER_BOARD_MAIN_BASE_WIDTH * hotspot.widthPct) / 100}
          height={(PLAYER_BOARD_MAIN_BASE_HEIGHT * hotspot.heightPct) / 100}
          shape='rect'
          color={hotspot.color}
          opacity={0.2}
          debugLabel={hotspot.label}
        />
      ))}
      {Array.from({ length: 6 }, (_, index) => {
        const xPct = 24 + index * 10.5;
        return (
          <HotspotAnchor
            key={`player-board-computer-top-${index}`}
            sceneId='player-board'
            hotspotId={`computer-top-${index}`}
            variant={variant}
            baseWidth={PLAYER_BOARD_MAIN_BASE_WIDTH}
            baseHeight={PLAYER_BOARD_MAIN_BASE_HEIGHT}
            x={(PLAYER_BOARD_MAIN_BASE_WIDTH * xPct) / 100}
            y={(PLAYER_BOARD_MAIN_BASE_HEIGHT * 48) / 100}
            width={(PLAYER_BOARD_MAIN_BASE_WIDTH * 8.5) / 100}
            height={(PLAYER_BOARD_MAIN_BASE_HEIGHT * 11) / 100}
            shape='rect'
            color='#22c55e'
            opacity={0.2}
            debugLabel={`player board computer top ${index + 1}`}
          />
        );
      })}
      {Array.from({ length: 6 }, (_, index) => {
        const xPct = 24 + index * 10.5;
        return (
          <HotspotAnchor
            key={`player-board-computer-bottom-${index}`}
            sceneId='player-board'
            hotspotId={`computer-bottom-${index}`}
            variant={variant}
            baseWidth={PLAYER_BOARD_MAIN_BASE_WIDTH}
            baseHeight={PLAYER_BOARD_MAIN_BASE_HEIGHT}
            x={(PLAYER_BOARD_MAIN_BASE_WIDTH * xPct) / 100}
            y={(PLAYER_BOARD_MAIN_BASE_HEIGHT * 65) / 100}
            width={(PLAYER_BOARD_MAIN_BASE_WIDTH * 8.5) / 100}
            height={(PLAYER_BOARD_MAIN_BASE_HEIGHT * 11) / 100}
            shape='rect'
            color='#22c55e'
            opacity={0.2}
            debugLabel={`player board computer bottom ${index + 1}`}
          />
        );
      })}
    </>
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
