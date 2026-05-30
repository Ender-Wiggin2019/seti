import { PRELUDE_CARDS_BY_ID } from '@seti/common/data/preludeCards';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { ETech } from '@seti/common/types/element';
import { ETechId, getTechDescriptor } from '@seti/common/types/tech';
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
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import { QuickStartCardPreview } from '@/features/setup/QuickStartCardPreview';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IFreeActionRequest,
  IMainActionRequest,
  IPlayerInputModel,
  IPublicPlayerState,
} from '@/types/re-exports';
import { EFreeAction, EMainAction, EPlayerInputType } from '@/types/re-exports';
import { getTechTileImageById } from '../tech/techTileImages';
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
  onMainAction?: (action: IMainActionRequest) => void;
  availableMainActions?: readonly EMainAction[];
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
const PLAYER_BOARD_IMAGE_SRC =
  '/assets/seti/refine/8e4f86f5-9689-4000-88fd-344aa94604eb.png';
const PLAYER_BOARD_IMAGE_BASE_WIDTH = 2160;
const PLAYER_BOARD_IMAGE_BASE_HEIGHT = 728;
const PLAYER_BOARD_TECH_TILE_WIDTH = 197;
const PLAYER_BOARD_TECH_TILE_HEIGHT = 276;
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

const PLAYER_BOARD_IMAGE_ANCHORS: IPersonalBoardHotspot[] = [
  {
    id: 'tech-launch',
    label: 'player board launch tech',
    xPct: 26,
    yPct: 24,
    widthPct: 43,
    heightPct: 30,
    color: '#f97316',
  },
  {
    id: 'tech-scan',
    label: 'player board scan tech',
    xPct: 74,
    yPct: 24,
    widthPct: 42,
    heightPct: 30,
    color: '#a855f7',
  },
  {
    id: 'data-pool',
    label: 'player board data pool',
    xPct: 22,
    yPct: 72,
    widthPct: 13,
    heightPct: 22,
    color: '#38bdf8',
  },
  {
    id: 'analyze',
    label: 'player board analyze',
    xPct: 86,
    yPct: 70,
    widthPct: 10,
    heightPct: 18,
    color: '#22c55e',
  },
  {
    id: 'income',
    label: 'player board income',
    xPct: 4,
    yPct: 68,
    widthPct: 7,
    heightPct: 51,
    color: '#a78bfa',
  },
  {
    id: 'mission-summary',
    label: 'player board mission summary',
    xPct: 91,
    yPct: 70,
    widthPct: 15,
    heightPct: 18,
    color: '#a78bfa',
  },
];

const PLAYER_BOARD_DATA_POOL_POINTS = [
  { xPct: 17.7, yPct: 66.8 },
  { xPct: 21.65, yPct: 66.8 },
  { xPct: 25.6, yPct: 66.8 },
  { xPct: 17.7, yPct: 77.9 },
  { xPct: 21.65, yPct: 77.9 },
  { xPct: 25.6, yPct: 77.9 },
];

const PLAYER_BOARD_COMPUTER_POINTS = [
  { xPct: 35.4, topYPct: 66.8, bottomYPct: 75.4 },
  { xPct: 44.5, topYPct: 66.8, bottomYPct: 75.4 },
  { xPct: 52.2, topYPct: 66.8, bottomYPct: 75.4 },
  { xPct: 61.7, topYPct: 66.8, bottomYPct: 75.4 },
  { xPct: 71.7, topYPct: 66.8, bottomYPct: 75.4 },
  { xPct: 78.7, topYPct: 66.8, bottomYPct: 75.4 },
];

const PLAYER_BOARD_MAIN_ACTION_POINTS: Array<{
  action:
    | EMainAction.LAUNCH_PROBE
    | EMainAction.SCAN
    | EMainAction.ANALYZE_DATA;
  hotspotId: string;
  testId: string;
  label: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  color: string;
}> = [
  {
    action: EMainAction.LAUNCH_PROBE,
    hotspotId: 'main-action-launch-probe',
    testId: 'player-board-main-action-launch-probe',
    label: 'player board launch probe action',
    xPct: 3.6,
    yPct: 23.5,
    widthPct: 6,
    heightPct: 16,
    color: '#f97316',
  },
  {
    action: EMainAction.SCAN,
    hotspotId: 'main-action-scan',
    testId: 'player-board-main-action-scan',
    label: 'player board scan action',
    xPct: 3.6,
    yPct: 58.5,
    widthPct: 6,
    heightPct: 16,
    color: '#e879f9',
  },
  {
    action: EMainAction.ANALYZE_DATA,
    hotspotId: 'main-action-analyze-data',
    testId: 'player-board-main-action-analyze-data',
    label: 'player board analyze data action',
    xPct: 86.5,
    yPct: 70,
    widthPct: 12,
    heightPct: 18,
    color: '#22c55e',
  },
];

const PLAYER_BOARD_TECH_POINTS: Partial<
  Record<ETechId, { xPct: number; yPct: number }>
> = {
  [ETechId.PROBE_DOUBLE_PROBE]: { xPct: 13.2, yPct: 27 },
  [ETechId.PROBE_ASTEROID]: { xPct: 21.4, yPct: 27 },
  [ETechId.PROBE_ROVER_DISCOUNT]: { xPct: 34.6, yPct: 27 },
  [ETechId.PROBE_MOON]: { xPct: 43.4, yPct: 27 },
  [ETechId.SCAN_EARTH_LOOK]: { xPct: 68, yPct: 27 },
  [ETechId.SCAN_POP_SIGNAL]: { xPct: 77.7, yPct: 27 },
  [ETechId.SCAN_HAND_SIGNAL]: { xPct: 87.4, yPct: 27 },
  [ETechId.SCAN_ENERGY_LAUNCH]: { xPct: 96.2, yPct: 27 },
  [ETechId.COMPUTER_VP_CREDIT]: { xPct: 35.4, yPct: 70 },
  [ETechId.COMPUTER_VP_ENERGY]: { xPct: 52.2, yPct: 70 },
  [ETechId.COMPUTER_VP_CARD]: { xPct: 61.7, yPct: 70 },
  [ETechId.COMPUTER_VP_PUBLICITY]: { xPct: 71.7, yPct: 70 },
};

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
  onMainAction,
  availableMainActions,
  income,
  playedMissions,
  techs,
  showExofossils = false,
}: IPlayerDashboardProps): React.JSX.Element {
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

      {textMode ? (
        <PlayerBoardTextModePanel
          player={player}
          playerTechs={playerTechs}
          income={income}
          missionCount={missionCount}
          techCount={techCount}
          cardInputActive={cardInputActive}
          onFreeAction={onFreeAction}
        />
      ) : (
        <PlayerBoardImageModePanel
          player={player}
          playerTechs={playerTechs}
          income={income}
          missionCount={missionCount}
          techCount={techCount}
          cardInputActive={cardInputActive}
          onFreeAction={onFreeAction}
          onMainAction={onMainAction}
          availableMainActions={availableMainActions}
        />
      )}
    </section>
  );
}

function PlayerBoardTextModePanel({
  player,
  playerTechs,
  income,
  missionCount,
  techCount,
  cardInputActive,
  onFreeAction,
}: {
  player: IPublicPlayerState;
  playerTechs: ETechId[];
  income?: IPlayerIncomeInfo;
  missionCount: number;
  techCount: number;
  cardInputActive: boolean;
  onFreeAction: (action: IFreeActionRequest) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className='instrument-panel relative overflow-hidden p-1.5'>
      <div className='relative flex flex-col gap-1.5'>
        <TechRow techs={playerTechs} />

        <ComputerRow
          computer={player.computer}
          dataPoolCount={player.dataPoolCount}
          dataPoolMax={player.dataPoolMax}
          onPlaceData={(_row, columnIndex) =>
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
      <PlayerBoardMainHotspots variant='text' />
    </div>
  );
}

function PlayerBoardImageModePanel({
  player,
  playerTechs,
  income,
  missionCount,
  techCount,
  cardInputActive,
  onFreeAction,
  onMainAction,
  availableMainActions,
}: {
  player: IPublicPlayerState;
  playerTechs: ETechId[];
  income?: IPlayerIncomeInfo;
  missionCount: number;
  techCount: number;
  cardInputActive: boolean;
  onFreeAction: (action: IFreeActionRequest) => void;
  onMainAction?: (action: IMainActionRequest) => void;
  availableMainActions?: readonly EMainAction[];
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div
      className='relative overflow-hidden rounded-[4px] border border-[color:var(--metal-edge)] bg-background-950 shadow-hairline-inset aspect-[2160/728]'
      data-reference-layout='player-board'
      data-testid='player-board-image-mode'
    >
      <img
        src={PLAYER_BOARD_IMAGE_SRC}
        alt={t('client.player_dashboard.board_alt', {
          defaultValue: 'Player board',
        })}
        className='block h-full w-full object-cover'
        data-testid='player-board-image'
        draggable={false}
      />

      <PlayerBoardImageAnchors
        income={income}
        missionCount={missionCount}
        techCount={techCount}
        cardInputActive={cardInputActive}
      />
      <PlayerBoardMainActionHotspots
        onMainAction={onMainAction}
        availableMainActions={availableMainActions}
      />
      <PlayerBoardDataPoolOverlay count={player.dataPoolCount} />
      <PlayerBoardTechOverlay techs={playerTechs} />
      <PlayerBoardComputerOverlay
        computer={player.computer}
        dataPoolCount={player.dataPoolCount}
        onPlaceData={(columnIndex) =>
          onFreeAction({
            type: EFreeAction.PLACE_DATA,
            slotIndex: columnIndex,
          })
        }
      />
    </div>
  );
}

function PlayerBoardImageAnchors({
  income,
  missionCount,
  techCount,
  cardInputActive,
}: {
  income?: IPlayerIncomeInfo;
  missionCount: number;
  techCount: number;
  cardInputActive: boolean;
}): React.JSX.Element {
  return (
    <>
      {PLAYER_BOARD_IMAGE_ANCHORS.map((hotspot) => (
        <HotspotAnchor
          key={`player-board-image-${hotspot.id}`}
          sceneId='player-board'
          hotspotId={hotspot.id}
          variant='image'
          baseWidth={PLAYER_BOARD_IMAGE_BASE_WIDTH}
          baseHeight={PLAYER_BOARD_IMAGE_BASE_HEIGHT}
          x={(PLAYER_BOARD_IMAGE_BASE_WIDTH * hotspot.xPct) / 100}
          y={(PLAYER_BOARD_IMAGE_BASE_HEIGHT * hotspot.yPct) / 100}
          width={(PLAYER_BOARD_IMAGE_BASE_WIDTH * hotspot.widthPct) / 100}
          height={(PLAYER_BOARD_IMAGE_BASE_HEIGHT * hotspot.heightPct) / 100}
          shape='rect'
          color={hotspot.color}
          opacity={0.2}
          debugLabel={hotspot.label}
        >
          {hotspot.id === 'income' ? (
            <ImageReadout>
              +{income?.credit ?? 0}C +{income?.energy ?? 0}E +
              {income?.card ?? 0}
            </ImageReadout>
          ) : null}
          {hotspot.id === 'mission-summary' ? (
            <span className='flex flex-col items-center gap-0.5'>
              <ImageReadout>{missionCount}M</ImageReadout>
              <ImageReadout>{techCount}T</ImageReadout>
              {cardInputActive ? (
                <span
                  aria-hidden
                  className='h-1.5 w-1.5 rounded-full bg-accent-300 shadow-[0_0_8px_oklch(0.82_0.11_240/0.8)] motion-safe:animate-pulse'
                />
              ) : null}
            </span>
          ) : null}
        </HotspotAnchor>
      ))}
    </>
  );
}

function ImageReadout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span className='pointer-events-none flex min-h-6 min-w-6 items-center justify-center rounded-[3px] border border-background-950/70 bg-background-950/85 px-1.5 readout text-[10px] font-semibold text-text-100 shadow-hairline-inset'>
      {children}
    </span>
  );
}

function PlayerBoardMainActionHotspots({
  onMainAction,
  availableMainActions,
}: {
  onMainAction?: (action: IMainActionRequest) => void;
  availableMainActions?: readonly EMainAction[];
}): React.JSX.Element {
  return (
    <>
      {PLAYER_BOARD_MAIN_ACTION_POINTS.map((point) => {
        const enabled =
          onMainAction !== undefined &&
          (availableMainActions === undefined ||
            availableMainActions.includes(point.action));
        const x = (PLAYER_BOARD_IMAGE_BASE_WIDTH * point.xPct) / 100;
        const y = (PLAYER_BOARD_IMAGE_BASE_HEIGHT * point.yPct) / 100;
        const width = (PLAYER_BOARD_IMAGE_BASE_WIDTH * point.widthPct) / 100;
        const height = (PLAYER_BOARD_IMAGE_BASE_HEIGHT * point.heightPct) / 100;

        return (
          <span key={`player-board-${point.hotspotId}`}>
            <HotspotAnchor
              sceneId='player-board'
              hotspotId={point.hotspotId}
              variant='image'
              baseWidth={PLAYER_BOARD_IMAGE_BASE_WIDTH}
              baseHeight={PLAYER_BOARD_IMAGE_BASE_HEIGHT}
              x={x}
              y={y}
              width={width}
              height={height}
              shape='rect'
              color={point.color}
              opacity={0.18}
              debugLabel={point.label}
            />
            <HotspotButton
              sceneId='player-board'
              hotspotId={point.hotspotId}
              variant='image'
              baseWidth={PLAYER_BOARD_IMAGE_BASE_WIDTH}
              baseHeight={PLAYER_BOARD_IMAGE_BASE_HEIGHT}
              x={x}
              y={y}
              width={width}
              height={height}
              shape='rect'
              color={point.color}
              opacity={enabled ? 0.22 : 0.12}
              disabled={!enabled}
              debugLabel={point.label}
              ariaLabel={point.label}
              testId={point.testId}
              className={cn(
                enabled &&
                  'focus-visible:ring-2 focus-visible:ring-accent-300 hover:bg-accent-400/10',
              )}
              onClick={() => onMainAction?.({ type: point.action })}
            />
          </span>
        );
      })}
    </>
  );
}

function PlayerBoardDataPoolOverlay({
  count,
}: {
  count: number;
}): React.JSX.Element {
  return (
    <>
      {PLAYER_BOARD_DATA_POOL_POINTS.slice(0, Math.max(0, count)).map(
        (point, index) => (
          <img
            key={`player-board-data-token-${index}`}
            src='/assets/seti/tokens/data.png'
            alt=''
            aria-hidden
            className='pointer-events-none absolute z-20 h-[7%] w-auto -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]'
            data-testid={`player-board-data-token-${index}`}
            draggable={false}
            style={{ left: `${point.xPct}%`, top: `${point.yPct}%` }}
          />
        ),
      )}
    </>
  );
}

function PlayerBoardTechOverlay({
  techs,
}: {
  techs: ETechId[];
}): React.JSX.Element {
  const acquired = new Set(techs);
  return (
    <>
      {Object.values(ETechId).map((techId) => {
        const point = PLAYER_BOARD_TECH_POINTS[techId];
        if (!point) return null;
        const isAcquired = acquired.has(techId);
        const techType = getTechDescriptor(techId).type;
        const color =
          techType === ETech.PROBE
            ? '#f97316'
            : techType === ETech.SCAN
              ? '#a855f7'
              : '#38bdf8';
        return (
          <HotspotAnchor
            key={`player-board-tech-slot-${techId}`}
            sceneId='player-board'
            hotspotId={`tech-slot-${techId}`}
            variant='image'
            baseWidth={PLAYER_BOARD_IMAGE_BASE_WIDTH}
            baseHeight={PLAYER_BOARD_IMAGE_BASE_HEIGHT}
            x={(PLAYER_BOARD_IMAGE_BASE_WIDTH * point.xPct) / 100}
            y={(PLAYER_BOARD_IMAGE_BASE_HEIGHT * point.yPct) / 100}
            width={PLAYER_BOARD_TECH_TILE_WIDTH}
            height={PLAYER_BOARD_TECH_TILE_HEIGHT}
            shape='rect'
            color={color}
            opacity={0.16}
            debugLabel={`player board tech slot ${techId}`}
            testId={`player-board-tech-slot-${techId}`}
          >
            {isAcquired ? (
              <img
                src={getTechTileImageById(techId)}
                alt=''
                aria-hidden
                className='pointer-events-none h-full w-full rounded-[4px] border border-background-950/70 object-cover shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
                data-testid={`player-board-tech-${techId}`}
                draggable={false}
              />
            ) : null}
          </HotspotAnchor>
        );
      })}
    </>
  );
}

function PlayerBoardComputerOverlay({
  computer,
  dataPoolCount,
  onPlaceData,
}: {
  computer: IPublicPlayerState['computer'];
  dataPoolCount: number;
  onPlaceData: (columnIndex: number) => void;
}): React.JSX.Element {
  const canPlace = dataPoolCount > 0;

  return (
    <>
      {computer.columns.map((column, index) => {
        const point = PLAYER_BOARD_COMPUTER_POINTS[index];
        if (!point) return null;
        const topInteractive =
          canPlace &&
          !column.topFilled &&
          computer.columns.slice(0, index).every((c) => c.topFilled);
        const bottomInteractive =
          canPlace &&
          column.hasBottomSlot &&
          column.topFilled &&
          !column.bottomFilled;

        return (
          <div key={`player-board-computer-column-${index}`}>
            <PlayerBoardComputerSlotHotspot
              row='top'
              columnIndex={index}
              xPct={point.xPct}
              yPct={point.topYPct}
              filled={column.topFilled}
              interactive={topInteractive}
              onClick={() => onPlaceData(index)}
            />
            {column.hasBottomSlot || column.bottomFilled ? (
              <PlayerBoardComputerSlotHotspot
                row='bottom'
                columnIndex={index}
                xPct={point.xPct}
                yPct={point.bottomYPct}
                filled={column.bottomFilled}
                interactive={bottomInteractive}
                onClick={() => onPlaceData(index)}
              />
            ) : column.techSlotAvailable ? (
              <PlayerBoardComputerSlotAnchor
                row='bottom'
                columnIndex={index}
                xPct={point.xPct}
                yPct={point.bottomYPct}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function PlayerBoardComputerSlotHotspot({
  row,
  columnIndex,
  xPct,
  yPct,
  filled,
  interactive,
  onClick,
}: {
  row: 'top' | 'bottom';
  columnIndex: number;
  xPct: number;
  yPct: number;
  filled: boolean;
  interactive: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <HotspotButton
      sceneId='player-board'
      hotspotId={`computer-${row}-${columnIndex}`}
      variant='image'
      baseWidth={PLAYER_BOARD_IMAGE_BASE_WIDTH}
      baseHeight={PLAYER_BOARD_IMAGE_BASE_HEIGHT}
      x={(PLAYER_BOARD_IMAGE_BASE_WIDTH * xPct) / 100}
      y={(PLAYER_BOARD_IMAGE_BASE_HEIGHT * yPct) / 100}
      width={92}
      height={54}
      shape='rect'
      color={interactive ? '#22c55e' : '#38bdf8'}
      opacity={interactive ? 0.24 : 0.14}
      disabled={!interactive}
      debugLabel={`player board computer ${row} ${columnIndex + 1}`}
      testId={`player-board-computer-slot-${row}-${columnIndex}`}
      className={cn(
        'grid place-items-center',
        interactive &&
          'focus-visible:ring-2 focus-visible:ring-accent-300 hover:bg-accent-400/10',
      )}
      onClick={onClick}
    >
      {filled ? (
        <img
          src='/assets/seti/tokens/data.png'
          alt=''
          aria-hidden
          className='pointer-events-none h-[76%] w-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]'
          draggable={false}
        />
      ) : interactive ? (
        <span
          aria-hidden
          className='pointer-events-none h-2.5 w-2.5 rounded-full border border-accent-200/80 bg-accent-300/60 shadow-[0_0_10px_oklch(0.82_0.11_240/0.7)]'
        />
      ) : null}
    </HotspotButton>
  );
}

function PlayerBoardComputerSlotAnchor({
  row,
  columnIndex,
  xPct,
  yPct,
}: {
  row: 'top' | 'bottom';
  columnIndex: number;
  xPct: number;
  yPct: number;
}): React.JSX.Element {
  return (
    <HotspotAnchor
      sceneId='player-board'
      hotspotId={`computer-${row}-${columnIndex}`}
      variant='image'
      baseWidth={PLAYER_BOARD_IMAGE_BASE_WIDTH}
      baseHeight={PLAYER_BOARD_IMAGE_BASE_HEIGHT}
      x={(PLAYER_BOARD_IMAGE_BASE_WIDTH * xPct) / 100}
      y={(PLAYER_BOARD_IMAGE_BASE_HEIGHT * yPct) / 100}
      width={92}
      height={54}
      shape='rect'
      color='#38bdf8'
      opacity={0.14}
      debugLabel={`player board computer ${row} ${columnIndex + 1}`}
    />
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
