import { DescRender } from '@seti/cards';
import { ANOMALY_COLUMN_REWARD_LADDER } from '@seti/common/constant/alienBoardConfig';
import {
  type IPlanetaryBoardConfig,
  PLANETARY_BOARD_CONFIG,
} from '@seti/common/constant/boardLayout';
import { ALL_CARDS } from '@seti/common/data/index';
import { canLandOnPlanet, canOrbitPlanet } from '@seti/common/rules';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  type TTraceColumnColor,
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { useTranslation } from 'react-i18next';
import { CardRender } from '@/features/cards/CardRender';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type {
  IPublicAlienCardZone,
  IPublicAlienState,
  IPublicAnomaliesBoard,
  IPublicCentauriansBoard,
  IPublicExertiansBoard,
  IPublicGameState,
  IPublicGenericAlienBoard,
  IPublicMascamitesBoard,
  IPublicOumuamuaBoard,
  IPublicPlanetaryBoard,
  IPublicPlanetState,
  IPublicTraceSlot,
  TPublicAlienBoard,
  TPublicSlotReward,
} from '@/types/re-exports';
import { EAlienType, EMainAction, EPlanet, ETrace } from '@/types/re-exports';
import {
  formatFirstLandData,
  formatFirstOrbitRewardList,
  formatPlanetRewardList,
} from './PlanetCard';

const ALIEN_TYPE_I18N_KEY: Partial<Record<EAlienType, string>> = {
  [EAlienType.ANOMALIES]: 'anomalies',
  [EAlienType.CENTAURIANS]: 'centaurians',
  [EAlienType.EXERTIANS]: 'exertians',
  [EAlienType.MASCAMITES]: 'mascamites',
  [EAlienType.OUMUAMUA]: 'oumuamua',
  [EAlienType.AMOEBA]: 'amoeba',
  [EAlienType.GLYPHIDS]: 'glyphids',
  [EAlienType.DUMMY]: 'dummy',
};

const TRACE_COLOR: Record<ETrace, string> = {
  [ETrace.RED]: '#e93e27',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
  [ETrace.ANY]: '#6b7280',
};

const TRACE_LABEL: Record<ETrace, string> = {
  [ETrace.RED]: 'Red',
  [ETrace.YELLOW]: 'Yellow',
  [ETrace.BLUE]: 'Blue',
  [ETrace.ANY]: 'Any',
};

const CARD_BY_ID = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

interface IAlienBoardViewProps {
  aliens: IPublicAlienState[];
  playerColors: Record<string, string>;
  planetaryBoard?: IPublicPlanetaryBoard;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
  onCardInspect?: (card: IBaseCard) => void;
}

interface IAlienBoardRendererProps {
  board: TPublicAlienBoard;
  playerColors: Record<string, string>;
  alienIndex: number;
  planetaryBoard?: IPublicPlanetaryBoard;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
}

type TAlienBoardRenderer = (
  props: IAlienBoardRendererProps,
) => React.JSX.Element;

const ALIEN_BOARD_RENDERERS: Partial<Record<EAlienType, TAlienBoardRenderer>> =
  {
    [EAlienType.ANOMALIES]: AnomaliesBoardRenderer,
    [EAlienType.CENTAURIANS]: CentauriansBoardRenderer,
    [EAlienType.EXERTIANS]: ExertiansBoardRenderer,
    [EAlienType.MASCAMITES]: MascamitesBoardRenderer,
    [EAlienType.OUMUAMUA]: OumuamuaBoardRenderer,
  };

export function AlienBoardView({
  aliens,
  playerColors,
  planetaryBoard,
  gameState,
  myPlayerId,
  planetActionMode,
  onSelectMainActionPlanet,
  onCardInspect,
}: IAlienBoardViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='w-full min-w-0 rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.alien_board.title')}
        </h2>
      </header>

      <div
        className='grid gap-2 min-[420px]:grid-cols-2 sm:gap-3'
        data-testid='alien-board-grid'
      >
        {aliens.map((alien) => (
          <AlienCard
            key={alien.alienIndex}
            alien={alien}
            playerColors={playerColors}
            planetaryBoard={planetaryBoard}
            gameState={gameState}
            myPlayerId={myPlayerId}
            planetActionMode={planetActionMode}
            onSelectMainActionPlanet={onSelectMainActionPlanet}
            onCardInspect={onCardInspect}
          />
        ))}
      </div>
    </section>
  );
}

function AlienCard({
  alien,
  playerColors,
  planetaryBoard,
  gameState,
  myPlayerId,
  planetActionMode,
  onSelectMainActionPlanet,
  onCardInspect,
}: {
  alien: IPublicAlienState;
  playerColors: Record<string, string>;
  planetaryBoard?: IPublicPlanetaryBoard;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
  onCardInspect?: (card: IBaseCard) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const discoveredName =
    alien.alienType != null ? ALIEN_TYPE_I18N_KEY[alien.alienType] : null;
  const title =
    alien.discovered && alien.alienType != null
      ? discoveredName
        ? t(`client.alien_board.types.${discoveredName}`)
        : t('client.alien_board.alien_index', { index: alien.alienIndex + 1 })
      : t('client.alien_board.alien_index', { index: alien.alienIndex + 1 });

  return (
    <article
      className='min-w-0 rounded-md border border-surface-700/50 bg-surface-900/60 p-2 sm:p-3'
      data-testid={`alien-${alien.alienIndex}-card`}
    >
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-mono text-xs font-semibold uppercase tracking-wider text-text-200'>
          {title}
        </h3>
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[10px]',
            alien.discovered
              ? 'border-green-500/70 bg-green-500/10 text-green-300'
              : 'border-surface-600 bg-surface-800/50 text-text-500',
          )}
        >
          {alien.discovered
            ? t('client.alien_board.discovered')
            : t('client.common.unknown')}
        </span>
      </div>

      <div className='mt-2 grid min-w-0 gap-2 lg:mt-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-3'>
        <div className='min-w-0 space-y-2 lg:space-y-3'>
          {alien.discovered && alien.board ? (
            <DiscoveredAlienBoard
              alien={alien}
              board={alien.board}
              playerColors={playerColors}
              planetaryBoard={planetaryBoard}
              gameState={gameState}
              myPlayerId={myPlayerId}
              planetActionMode={planetActionMode}
              onSelectMainActionPlanet={onSelectMainActionPlanet}
            />
          ) : (
            <HiddenBoard alienIndex={alien.alienIndex} />
          )}

          <DiscoveryZone
            alienIndex={alien.alienIndex}
            slots={alien.discovery.zones}
            playerColors={playerColors}
          />
          <OverflowZone
            alienIndex={alien.alienIndex}
            slots={alien.discovery.overflowZones}
            playerColors={playerColors}
          />
        </div>

        {alien.cardZone ? (
          <AlienDeckPanel
            alienIndex={alien.alienIndex}
            cardZone={alien.cardZone}
            onCardInspect={onCardInspect}
          />
        ) : null}
      </div>
    </article>
  );
}

function DiscoveryZone({
  alienIndex,
  slots,
  playerColors,
}: {
  alienIndex: number;
  slots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/40 p-2'
      data-testid={`alien-${alienIndex}-discovery-zone`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Discovery
      </div>
      <TraceColumnGrid
        alienIndex={alienIndex}
        area='discovery'
        slots={slots}
        playerColors={playerColors}
      />
    </section>
  );
}

function OverflowZone({
  alienIndex,
  slots,
  playerColors,
}: {
  alienIndex: number;
  slots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-dashed border-surface-700/60 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-overflow-zone`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Overflow
      </div>
      <TraceColumnGrid
        alienIndex={alienIndex}
        area='overflow'
        slots={slots}
        playerColors={playerColors}
      />
    </section>
  );
}

function HiddenBoard({
  alienIndex,
}: {
  alienIndex: number;
}): React.JSX.Element {
  return (
    <section
      className='min-h-[360px] min-w-0 rounded border border-surface-800/70 bg-black/60'
      data-testid={`alien-${alienIndex}-hidden-board`}
      aria-label='Alien Board'
    />
  );
}

function DiscoveredAlienBoard({
  alien,
  board,
  playerColors,
  planetaryBoard,
  gameState,
  myPlayerId,
  planetActionMode,
  onSelectMainActionPlanet,
}: {
  alien: IPublicAlienState;
  board: TPublicAlienBoard;
  playerColors: Record<string, string>;
  planetaryBoard?: IPublicPlanetaryBoard;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
}): React.JSX.Element {
  const Renderer =
    alien.alienType != null ? ALIEN_BOARD_RENDERERS[alien.alienType] : null;
  if (Renderer) {
    return (
      <Renderer
        alienIndex={alien.alienIndex}
        board={board}
        playerColors={playerColors}
        planetaryBoard={planetaryBoard}
        gameState={gameState}
        myPlayerId={myPlayerId}
        planetActionMode={planetActionMode}
        onSelectMainActionPlanet={onSelectMainActionPlanet}
      />
    );
  }

  if (board.type === 'generic') {
    return (
      <GenericAlienBoard
        alienIndex={alien.alienIndex}
        board={board}
        playerColors={playerColors}
      />
    );
  }

  return (
    <GenericAlienBoard
      alienIndex={alien.alienIndex}
      board={{ type: 'generic', slots: [] }}
      playerColors={playerColors}
    />
  );
}

function AnomaliesBoardRenderer({
  alienIndex,
  board,
  playerColors,
}: IAlienBoardRendererProps): React.JSX.Element {
  if (board.type !== 'anomalies') {
    return (
      <GenericAlienBoard
        alienIndex={alienIndex}
        board={{ type: 'generic', slots: [] }}
        playerColors={playerColors}
      />
    );
  }

  return (
    <AnomaliesBoard
      alienIndex={alienIndex}
      board={board}
      playerColors={playerColors}
    />
  );
}

function OumuamuaBoardRenderer({
  alienIndex,
  board,
  playerColors,
  planetaryBoard,
  gameState,
  myPlayerId,
  planetActionMode,
  onSelectMainActionPlanet,
}: IAlienBoardRendererProps): React.JSX.Element {
  if (board.type !== 'oumuamua') {
    return (
      <GenericAlienBoard
        alienIndex={alienIndex}
        board={{ type: 'generic', slots: [] }}
        playerColors={playerColors}
      />
    );
  }

  return (
    <OumuamuaBoard
      alienIndex={alienIndex}
      board={board}
      playerColors={playerColors}
      planetaryBoard={planetaryBoard}
      gameState={gameState}
      myPlayerId={myPlayerId}
      planetActionMode={planetActionMode}
      onSelectMainActionPlanet={onSelectMainActionPlanet}
    />
  );
}

function ExertiansBoardRenderer({
  alienIndex,
  board,
  playerColors,
}: IAlienBoardRendererProps): React.JSX.Element {
  if (board.type !== 'exertians') {
    return (
      <GenericAlienBoard
        alienIndex={alienIndex}
        board={{ type: 'generic', slots: [] }}
        playerColors={playerColors}
      />
    );
  }

  return (
    <ExertiansBoard
      alienIndex={alienIndex}
      board={board}
      playerColors={playerColors}
    />
  );
}

function CentauriansBoardRenderer({
  alienIndex,
  board,
  playerColors,
}: IAlienBoardRendererProps): React.JSX.Element {
  if (board.type !== 'centaurians') {
    return (
      <GenericAlienBoard
        alienIndex={alienIndex}
        board={{ type: 'generic', slots: [] }}
        playerColors={playerColors}
      />
    );
  }

  return (
    <CentauriansBoard
      alienIndex={alienIndex}
      board={board}
      playerColors={playerColors}
    />
  );
}

function MascamitesBoardRenderer({
  alienIndex,
  board,
  playerColors,
}: IAlienBoardRendererProps): React.JSX.Element {
  if (board.type !== 'mascamites') {
    return (
      <GenericAlienBoard
        alienIndex={alienIndex}
        board={{ type: 'generic', slots: [] }}
        playerColors={playerColors}
      />
    );
  }

  return (
    <MascamitesBoard
      alienIndex={alienIndex}
      board={board}
      playerColors={playerColors}
    />
  );
}

function CentauriansBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicCentauriansBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-1.5'
      data-testid={`alien-${alienIndex}-centaurians-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Messages
      </div>
      <div className='grid gap-2 sm:grid-cols-2'>
        {board.messageMilestones.length === 0 ? (
          <div className='rounded border border-surface-700/50 bg-surface-900/40 px-2 py-3 font-mono text-[10px] text-text-500'>
            No messages
          </div>
        ) : (
          board.messageMilestones.map((milestone) => {
            const pendingCount =
              board.pendingMessagesByPlayer[milestone.playerId]?.length ?? 0;
            return (
              <div
                key={`${milestone.playerId}-${milestone.threshold}`}
                className='flex items-center justify-between gap-2 rounded border border-surface-700/60 bg-surface-900/50 px-2 py-1.5'
                data-testid={`alien-${alienIndex}-centaurians-message-${milestone.playerId}`}
              >
                <span className='flex min-w-0 items-center gap-1.5'>
                  <span
                    className='h-2.5 w-2.5 shrink-0 rounded-full border border-surface-200/30'
                    style={{
                      backgroundColor:
                        playerColors[milestone.playerId] ?? '#cbd5e1',
                    }}
                  />
                  <span className='truncate font-mono text-[10px] text-text-300'>
                    {milestone.playerId}
                  </span>
                </span>
                <span className='shrink-0 font-mono text-[11px] font-semibold text-text-100'>
                  {milestone.threshold} VP
                  {pendingCount > 0 ? ` / ${pendingCount}` : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className='mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
        {board.rewardSlots.map((slot) => (
          <div
            key={slot.slotId}
            className='rounded border border-surface-700/50 bg-surface-900/35 px-2 py-1.5'
            data-testid={`alien-${alienIndex}-centaurians-reward-${slot.slotId}`}
          >
            <div className='flex items-center justify-between gap-2 font-mono text-[10px] text-text-300'>
              <span>{slot.slotId}</span>
              <span>
                {slot.dataCost > 0 ? `${slot.dataCost} data` : 'free'}
              </span>
            </div>
            <div className='mt-1 flex justify-start'>
              <TraceRewardIcons rewards={slot.rewards} size='xs' />
            </div>
            <div className='mt-1 font-mono text-[10px] text-text-500'>
              {slot.claimedByPlayerId ?? 'open'}
            </div>
          </div>
        ))}
      </div>
      {board.traceSlots.length > 0 ? (
        <div className='mt-3'>
          <TraceColumnGrid
            alienIndex={alienIndex}
            area='centaurians-trace'
            slots={board.traceSlots}
            playerColors={playerColors}
          />
        </div>
      ) : null}
    </section>
  );
}

function MascamitesBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicMascamitesBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-mascamites-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Samples
      </div>

      <div className='grid gap-2 sm:grid-cols-3'>
        <MascamitesSamplePoolCard
          alienIndex={alienIndex}
          label='Jupiter'
          testId={`alien-${alienIndex}-mascamites-jupiter`}
          sampleCount={board.samplePools[EPlanet.JUPITER] ?? 0}
        />
        <MascamitesSamplePoolCard
          alienIndex={alienIndex}
          label='Saturn'
          testId={`alien-${alienIndex}-mascamites-saturn`}
          sampleCount={board.samplePools[EPlanet.SATURN] ?? 0}
        />
        <MascamitesSamplePoolCard
          alienIndex={alienIndex}
          label='Public'
          testId={`alien-${alienIndex}-mascamites-public`}
          sampleIds={board.publicSamples}
        />
      </div>

      <div className='mt-3 grid gap-2 lg:grid-cols-2'>
        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
            Capsules
          </div>
          <div className='space-y-2'>
            {board.capsules.length === 0 ? (
              <div className='rounded border border-dashed border-surface-700/50 px-2 py-3 font-mono text-[10px] text-text-500'>
                No active capsules
              </div>
            ) : (
              board.capsules.map((capsule) => (
                <div
                  key={capsule.capsuleId}
                  className='rounded border border-surface-700/50 bg-surface-950/40 px-2 py-2'
                  data-testid={`alien-${alienIndex}-mascamites-capsule-${capsule.capsuleId}`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-mono text-[10px] uppercase tracking-widest text-text-400'>
                      {capsule.capsuleId}
                    </span>
                    <span
                      className='inline-block h-2.5 w-2.5 rounded-full border border-surface-200/30'
                      style={{
                        backgroundColor:
                          playerColors[capsule.ownerId] ?? '#cbd5e1',
                      }}
                      title={capsule.ownerId}
                    />
                  </div>
                  <div className='mt-1 grid gap-0.5 font-mono text-[10px] text-text-300'>
                    <div>From {capsule.sourcePlanet}</div>
                    <div>At {capsule.spaceId}</div>
                    {capsule.missionCardId ? (
                      <div>{capsule.missionCardId}</div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
            Delivered Samples
          </div>
          <div className='space-y-2'>
            {board.deliveredSamples.length === 0 ? (
              <div className='rounded border border-dashed border-surface-700/50 px-2 py-3 font-mono text-[10px] text-text-500'>
                No delivered samples
              </div>
            ) : (
              board.deliveredSamples.map((sample, index) => (
                <div
                  key={`${sample.slotId}-${index}`}
                  className='rounded border border-surface-700/50 bg-surface-950/40 px-2 py-2'
                  data-testid={`alien-${alienIndex}-mascamites-delivered-${index}`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-mono text-[10px] uppercase tracking-widest text-text-400'>
                      {sample.sampleTokenId}
                    </span>
                    <span
                      className='inline-block h-2.5 w-2.5 rounded-full border border-surface-200/30'
                      style={{
                        backgroundColor:
                          playerColors[sample.deliveredBy] ?? '#cbd5e1',
                      }}
                      title={sample.deliveredBy}
                    />
                  </div>
                  <div className='mt-1 grid gap-0.5 font-mono text-[10px] text-text-300'>
                    <div>Round {sample.deliveredAtRound}</div>
                    <div>{sample.slotId}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className='mt-3'>
        <TraceColumnGrid
          alienIndex={alienIndex}
          area='mascamites-trace'
          slots={board.traceSlots}
          playerColors={playerColors}
        />
      </div>
    </section>
  );
}

function MascamitesSamplePoolCard({
  label,
  testId,
  sampleCount,
  sampleIds,
}: {
  alienIndex: number;
  label: string;
  testId: string;
  sampleCount?: number;
  sampleIds?: readonly string[];
}): React.JSX.Element {
  const count = sampleCount ?? sampleIds?.length ?? 0;
  const countLabel = `${count} sample${count === 1 ? '' : 's'}`;

  return (
    <section
      className='rounded border border-surface-700/50 bg-surface-900/35 p-2'
      data-testid={testId}
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='font-mono text-[10px] uppercase tracking-widest text-text-500'>
          {label}
        </span>
        <span className='font-mono text-[10px] text-text-300'>
          {countLabel}
        </span>
      </div>
      <div className='mt-2 flex flex-wrap gap-1'>
        {count === 0 ? (
          <span className='rounded border border-dashed border-surface-700/50 px-1.5 py-0.5 font-mono text-[10px] text-text-500'>
            Empty
          </span>
        ) : sampleIds !== undefined ? (
          sampleIds.map((sampleId) => (
            <span
              key={sampleId}
              className='rounded border border-surface-700/60 bg-surface-950/45 px-1.5 py-0.5 font-mono text-[10px] text-text-200'
            >
              {sampleId}
            </span>
          ))
        ) : (
          <span className='rounded border border-surface-700/60 bg-surface-950/45 px-1.5 py-0.5 font-mono text-[10px] text-text-200'>
            Hidden
          </span>
        )}
      </div>
    </section>
  );
}

function ExertiansBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicExertiansBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const countsByPlayer = board.faceDownCards.reduce<Record<string, number>>(
    (counts, card) => {
      counts[card.ownerId] = (counts[card.ownerId] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-exertians-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Face-down Exertians
      </div>
      <div className='grid gap-2 sm:grid-cols-2'>
        {Object.entries(countsByPlayer).length === 0 ? (
          <div className='rounded border border-surface-700/50 bg-surface-900/40 px-2 py-3 font-mono text-[10px] text-text-500'>
            No hidden cards
          </div>
        ) : (
          Object.entries(countsByPlayer).map(([playerId, count]) => (
            <div
              key={playerId}
              className='flex items-center justify-between gap-2 rounded border border-surface-700/60 bg-surface-900/50 px-2 py-1.5'
              data-testid={`alien-${alienIndex}-exertians-hidden-${playerId}`}
            >
              <span className='flex min-w-0 items-center gap-1.5'>
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-full border border-surface-200/30'
                  style={{
                    backgroundColor: playerColors[playerId] ?? '#cbd5e1',
                  }}
                />
                <span className='truncate font-mono text-[10px] text-text-300'>
                  {playerId}
                </span>
              </span>
              <span className='font-mono text-[11px] font-semibold text-text-100'>
                {count}
              </span>
            </div>
          ))
        )}
      </div>
      {board.milestones.length > 0 ? (
        <div className='mt-3 grid gap-1 font-mono text-[10px] text-text-400'>
          {board.milestones.map((milestone, index) => (
            <div
              key={`${milestone.threshold}-${index}`}
              className='flex items-center justify-between gap-2 rounded border border-surface-700/50 bg-surface-900/30 px-2 py-1'
              data-testid={`alien-${alienIndex}-exertians-milestone-${index}`}
            >
              <span>{milestone.threshold} VP</span>
              <span>
                Cost {milestone.creditCost}C /{' '}
                {milestone.claimedByPlayerIds.length} claimed
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {board.traceSlots.length > 0 ? (
        <div className='mt-3'>
          <TraceColumnGrid
            alienIndex={alienIndex}
            area='exertians-trace'
            slots={board.traceSlots}
            playerColors={playerColors}
          />
        </div>
      ) : null}
    </section>
  );
}

function GenericAlienBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicGenericAlienBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-generic-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Alien Board
      </div>
      <TraceColumnGrid
        alienIndex={alienIndex}
        area='generic-board'
        slots={board.slots}
        playerColors={playerColors}
      />
    </section>
  );
}

function OumuamuaBoard({
  alienIndex,
  board,
  playerColors,
  planetaryBoard,
  gameState,
  myPlayerId,
  planetActionMode,
  onSelectMainActionPlanet,
}: {
  alienIndex: number;
  board: IPublicOumuamuaBoard;
  playerColors: Record<string, string>;
  planetaryBoard?: IPublicPlanetaryBoard;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-oumuamua-board`}
    >
      <div data-testid={`alien-${alienIndex}-oumuamua-landing-area`}>
        <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
          Oumuamua Landing Area
        </div>
        <OumuamuaLandingArea
          alienIndex={alienIndex}
          planetState={planetaryBoard?.planets[EPlanet.OUMUAMUA]}
          playerColors={playerColors}
          gameState={gameState}
          myPlayerId={myPlayerId}
          planetActionMode={planetActionMode}
          onSelectMainActionPlanet={onSelectMainActionPlanet}
        />
      </div>
      <div className='mt-3'>
        <TraceColumnGrid
          alienIndex={alienIndex}
          area='oumuamua-trace'
          slots={board.traceSlots}
          playerColors={playerColors}
        />
      </div>
    </section>
  );
}

function createEmptyPlanetState(
  config: IPlanetaryBoardConfig,
): IPublicPlanetState {
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: Array.from(
      { length: config.land.firstData.length },
      () => false,
    ),
    moonOccupants: [],
  };
}

function OumuamuaTokenDot({
  alienIndex,
  kind,
  playerId,
  playerColors,
  index,
}: {
  alienIndex: number;
  kind: 'orbit' | 'landing';
  playerId: string;
  playerColors: Record<string, string>;
  index: number;
}): React.JSX.Element {
  return (
    <span
      className='inline-flex h-3.5 w-3.5 rounded-full border border-surface-200/40 shadow-[0_1px_3px_rgba(0,0,0,0.45)]'
      data-testid={`alien-${alienIndex}-oumuamua-${kind}-token-${playerId}-${index}`}
      style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }}
      title={playerId}
      aria-label={`oumuamua-${kind}-${playerId}`}
    />
  );
}

function OumuamuaLandingArea({
  alienIndex,
  planetState,
  playerColors,
  gameState,
  myPlayerId,
  planetActionMode,
  onSelectMainActionPlanet,
}: {
  alienIndex: number;
  planetState?: IPublicPlanetState;
  playerColors: Record<string, string>;
  gameState?: IPublicGameState | null;
  myPlayerId?: string;
  planetActionMode?: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet?: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
}): React.JSX.Element {
  const textMode = useTextMode();
  const config = PLANETARY_BOARD_CONFIG[EPlanet.OUMUAMUA];
  const state = planetState ?? createEmptyPlanetState(config);
  const mainActionPlayer = gameState?.players.find(
    (player) => player.playerId === myPlayerId,
  );
  const orbitSelectable =
    planetActionMode === EMainAction.ORBIT &&
    gameState !== undefined &&
    gameState !== null &&
    mainActionPlayer !== undefined &&
    canOrbitPlanet(EPlanet.OUMUAMUA, state, mainActionPlayer, gameState);
  const landSelectable =
    planetActionMode === EMainAction.LAND &&
    gameState !== undefined &&
    gameState !== null &&
    mainActionPlayer !== undefined &&
    canLandOnPlanet(EPlanet.OUMUAMUA, state, mainActionPlayer, gameState);
  const orbitSummary = [
    formatPlanetRewardList(config.orbit.rewards),
    formatFirstOrbitRewardList(config.orbit.firstRewards),
  ]
    .filter(Boolean)
    .join(' + ');
  const landSummary = [
    formatPlanetRewardList(config.land.rewards),
    config.land.firstData.length > 0
      ? `first data ${formatFirstLandData(config.land.firstData)}`
      : '',
  ]
    .filter(Boolean)
    .join(' + ');

  return (
    <div
      className='min-w-0 space-y-2 rounded border border-violet-400/50 bg-violet-500/10 p-3'
      data-testid={`alien-${alienIndex}-oumuamua-landing-surface`}
    >
      <div
        className={cn(
          'rounded-sm border border-surface-700/60 bg-surface-950/55 p-2',
          textMode && 'border-cyan-100/60 bg-surface-950/95 font-mono',
        )}
        data-testid={`alien-${alienIndex}-oumuamua-cell`}
      >
        {textMode ? (
          <div className='mb-2 space-y-0.5 font-mono leading-tight'>
            <div className='text-[10px] font-bold uppercase text-text-100'>
              oumuamua
            </div>
            <div className='text-[8px] text-text-300'>O: {orbitSummary}</div>
            <div className='text-[8px] text-text-300'>L: {landSummary}</div>
          </div>
        ) : null}

        <div className='grid grid-cols-2 gap-2'>
          <section
            className='rounded border border-surface-700/50 bg-surface-800/40 p-2'
            data-testid={`alien-${alienIndex}-oumuamua-orbit-area`}
          >
            <p className='mb-1 font-mono text-[10px] uppercase tracking-wider text-text-500'>
              Orbit
            </p>
            <div className='flex min-h-5 flex-wrap gap-1'>
              {state.orbitSlots.length === 0 ? (
                <span className='text-[11px] text-text-500'>Empty</span>
              ) : (
                state.orbitSlots.map((slot, index) => (
                  <OumuamuaTokenDot
                    key={`${slot.playerId}-orbit-${index}`}
                    alienIndex={alienIndex}
                    kind='orbit'
                    playerId={slot.playerId}
                    playerColors={playerColors}
                    index={index}
                  />
                ))
              )}
            </div>
            {planetActionMode === EMainAction.ORBIT ? (
              <button
                type='button'
                data-testid='planet-target-oumuamua'
                disabled={!orbitSelectable}
                onClick={() => onSelectMainActionPlanet?.(EPlanet.OUMUAMUA)}
                className='mt-2 w-full rounded border border-accent-500/70 bg-accent-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-200 disabled:border-surface-700 disabled:bg-surface-900/60 disabled:text-text-500'
              >
                Orbit Oumuamua
              </button>
            ) : null}
          </section>

          <section
            className='rounded border border-surface-700/50 bg-surface-800/40 p-2'
            data-testid={`alien-${alienIndex}-oumuamua-landing-cells`}
          >
            <p className='mb-1 font-mono text-[10px] uppercase tracking-wider text-text-500'>
              Landing
            </p>
            <div className='flex min-h-5 flex-wrap gap-1'>
              {state.landingSlots.length === 0 ? (
                <span className='text-[11px] text-text-500'>Empty</span>
              ) : (
                state.landingSlots.map((slot, index) => (
                  <OumuamuaTokenDot
                    key={`${slot.playerId}-landing-${index}`}
                    alienIndex={alienIndex}
                    kind='landing'
                    playerId={slot.playerId}
                    playerColors={playerColors}
                    index={index}
                  />
                ))
              )}
            </div>
            {planetActionMode === EMainAction.LAND ? (
              <button
                type='button'
                data-testid='planet-target-oumuamua'
                disabled={!landSelectable}
                onClick={() => onSelectMainActionPlanet?.(EPlanet.OUMUAMUA)}
                className='mt-2 w-full rounded border border-accent-500/70 bg-accent-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-200 disabled:border-surface-700 disabled:bg-surface-900/60 disabled:text-text-500'
              >
                Land Oumuamua
              </button>
            ) : null}
          </section>
        </div>

        <div className='mt-2 grid gap-1 font-mono text-[10px] leading-snug text-text-300'>
          <p>
            <span className='uppercase tracking-[0.12em] text-text-500'>
              Orbit reward:{' '}
            </span>
            <span className='text-text-100'>{orbitSummary}</span>
          </p>
          <p>
            <span className='uppercase tracking-[0.12em] text-text-500'>
              Land reward:{' '}
            </span>
            <span className='text-text-100'>{landSummary}</span>
          </p>
        </div>

        <div className='mt-2 flex flex-wrap gap-1'>
          {config.land.firstData.map((amount, index) => (
            <span
              key={`oumuamua-first-land-data-${index}`}
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                state.firstLandDataBonusTaken[index]
                  ? 'border-surface-600 text-text-500'
                  : 'border-accent-500/70 text-accent-300',
              )}
              data-testid={`alien-${alienIndex}-oumuamua-first-land-data-${index + 1}`}
            >
              Data {index + 1}: {amount}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnomaliesBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicAnomaliesBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-anomalies-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Alien Board
      </div>
      <div
        className='grid grid-cols-3 gap-1'
        data-testid={`alien-${alienIndex}-anomaly-trace-grid`}
      >
        {TRACE_COLUMN_COLORS.map((color) => {
          const column = board.traceBoard.columns[color];
          return (
            <AnomalyColumn
              key={color}
              alienIndex={alienIndex}
              color={color}
              slot={column}
              playerColors={playerColors}
            />
          );
        })}
      </div>
    </section>
  );
}

function AnomalyColumn({
  alienIndex,
  color,
  slot,
  playerColors,
}: {
  alienIndex: number;
  color: ETrace.RED | ETrace.YELLOW | ETrace.BLUE;
  slot: IPublicTraceSlot;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <div
      className='min-w-0 rounded border border-surface-700/60 bg-surface-900/50 p-1'
      data-testid={`alien-${alienIndex}-anomaly-column-${color}`}
    >
      <div
        className='mb-1 h-1 rounded-full'
        style={{ backgroundColor: TRACE_COLOR[color] }}
      />
      <div className='flex min-h-12 flex-col-reverse items-center justify-start gap-1 rounded bg-surface-950/50 p-1'>
        {slot.occupants.map((occ, index) => (
          <OccupantMarker
            key={`${slot.slotId}-${index}`}
            testId={`trace-slot-${slot.slotId}-occupant-${index}`}
            occupant={occ}
            playerColors={playerColors}
          />
        ))}
      </div>
      <div
        className='mt-1 flex flex-col-reverse items-center gap-0.5'
        data-testid={`alien-${alienIndex}-anomaly-column-${color}-rewards`}
      >
        {ANOMALY_COLUMN_REWARD_LADDER.map((rewards, index) => (
          <TraceRewardFrame
            key={index}
            traceColor={color}
            compact
            variant={
              index === ANOMALY_COLUMN_REWARD_LADDER.length - 1
                ? 'pill'
                : 'circle'
            }
            testId={`alien-${alienIndex}-anomaly-column-${color}-reward-${index}`}
            title={`${TRACE_LABEL[color]} anomaly reward`}
          >
            <TraceRewardIcons rewards={rewards} size='xxs' />
          </TraceRewardFrame>
        ))}
      </div>
    </div>
  );
}

function AlienDeckPanel({
  alienIndex,
  cardZone,
  onCardInspect,
}: {
  alienIndex: number;
  cardZone: IPublicAlienCardZone;
  onCardInspect?: (card: IBaseCard) => void;
}): React.JSX.Element {
  const faceUpCard = cardZone.faceUpCardId
    ? CARD_BY_ID.get(cardZone.faceUpCardId)
    : undefined;

  return (
    <aside
      className='w-full rounded border border-surface-700/50 bg-surface-950/40 p-2 lg:w-28'
      data-testid={`alien-${alienIndex}-deck-panel`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Alien Deck
      </div>
      <div className='space-y-1 font-mono text-[10px] text-text-300'>
        <div>Deck {cardZone.drawPileSize}</div>
        <div>Discard {cardZone.discardPileSize}</div>
      </div>
      {faceUpCard ? (
        <button
          type='button'
          className={cn(
            'relative mt-2 h-[92px] w-[66px] overflow-hidden rounded-[3px] border border-surface-700/60 transition-[border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:shadow-focus-ring',
            onCardInspect
              ? 'cursor-pointer hover:-translate-y-0.5 hover:border-accent-500/70'
              : 'cursor-default',
          )}
          data-testid={`alien-${alienIndex}-deck-face-up-card`}
          aria-label={`Preview ${faceUpCard.name}`}
          onClick={() => onCardInspect?.(faceUpCard)}
        >
          <div className='pointer-events-none absolute left-0 top-0 origin-top-left scale-[0.44]'>
            <CardRender card={faceUpCard} />
          </div>
        </button>
      ) : cardZone.faceUpCardId ? (
        <div className='mt-2 rounded border border-surface-700/60 px-2 py-3 text-center font-mono text-[10px] text-text-400'>
          {cardZone.faceUpCardId}
        </div>
      ) : null}
    </aside>
  );
}

function TraceSlot({
  slot,
  playerColors,
}: {
  slot: IPublicTraceSlot;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const isOverflow = slot.maxOccupants === -1;
  const rewards = toTraceRewardPresentations(slot.rewards);

  return (
    <div className='flex shrink-0 flex-col items-center gap-1'>
      <TraceRewardFrame
        traceColor={slot.traceColor}
        variant={isOverflow ? 'pill' : 'circle'}
        testId={`trace-slot-${slot.slotId}-circle`}
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' - Discovery' : ''}`}
        highlighted={slot.isDiscovery}
      >
        {rewards.length > 0 ? (
          <TraceRewardPresentations presentations={rewards} />
        ) : null}
        {rewards.length === 0 && slot.isDiscovery && (
          <span className='text-[8px] font-bold text-accent-300'>★</span>
        )}
        {rewards.length === 0 && isOverflow && (
          <span className='font-mono text-[8px] text-text-500'>∞</span>
        )}
      </TraceRewardFrame>

      <div className='flex min-h-[14px] flex-wrap justify-center gap-0.5'>
        {slot.occupants.map((occ, index) => (
          <OccupantMarker
            key={`${slot.slotId}-${index}`}
            testId={`trace-slot-${slot.slotId}-occupant-${index}`}
            occupant={occ}
            playerColors={playerColors}
          />
        ))}
      </div>
    </div>
  );
}

type TTraceRewardFrameVariant = 'circle' | 'pill';

function TraceRewardFrame({
  traceColor,
  variant,
  testId,
  title,
  highlighted = false,
  compact = false,
  children,
}: {
  traceColor: ETrace;
  variant: TTraceRewardFrameVariant;
  testId: string;
  title: string;
  highlighted?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  const color = TRACE_COLOR[traceColor];

  return (
    <div
      className={cn(
        'flex items-center justify-center border-2 bg-surface-950/70',
        compact &&
          variant === 'pill' &&
          'min-h-20 w-10 rounded-full px-0.5 py-1.5',
        compact && variant === 'circle' && 'h-10 w-10 rounded-full',
        !compact &&
          (variant === 'pill'
            ? 'min-h-24 w-12 rounded-full px-1 py-2'
            : 'h-12 w-12 rounded-full'),
        highlighted && 'ring-1 ring-accent-400/50',
      )}
      data-testid={testId}
      data-trace-color={traceColor}
      style={{
        backgroundColor: `${color}1f`,
        borderColor: color,
      }}
      title={title}
    >
      {children}
    </div>
  );
}

function OccupantMarker({
  occupant,
  playerColors,
  testId,
}: {
  occupant: IPublicTraceSlot['occupants'][number];
  playerColors: Record<string, string>;
  testId: string;
}): React.JSX.Element {
  return (
    <span
      className='inline-block h-2.5 w-2.5 rounded-full border border-surface-200/30'
      data-testid={testId}
      style={{
        backgroundColor:
          occupant.source === 'neutral'
            ? '#9ca3af'
            : (playerColors[occupant.source.playerId] ?? '#cbd5e1'),
      }}
      title={
        occupant.source === 'neutral' ? 'Neutral' : occupant.source.playerId
      }
    />
  );
}

function TraceColumnGrid({
  alienIndex,
  area,
  slots,
  playerColors,
}: {
  alienIndex: number;
  area: string;
  slots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const groupedSlots = groupTraceSlotsByColor(slots);

  return (
    <div className='grid min-w-0 grid-cols-3 gap-2'>
      {TRACE_COLUMN_COLORS.map((color) => (
        <TraceColorColumn
          key={color}
          alienIndex={alienIndex}
          area={area}
          color={color}
          slots={groupedSlots[color]}
          playerColors={playerColors}
        />
      ))}
    </div>
  );
}

function TraceColorColumn({
  alienIndex,
  area,
  color,
  slots,
  playerColors,
}: {
  alienIndex: number;
  area: string;
  color: TTraceColumnColor;
  slots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <div
      className='min-w-0 rounded border border-surface-700/50 bg-surface-900/30 p-2'
      data-testid={`alien-${alienIndex}-${area}-column-${color}`}
    >
      <TraceColumnLabel color={color} />
      <div
        className='flex min-h-14 flex-col-reverse items-center gap-2'
        data-testid={`alien-${alienIndex}-${area}-column-${color}-slots`}
      >
        {slots.map((slot) => (
          <TraceSlot
            key={slot.slotId}
            slot={slot}
            playerColors={playerColors}
          />
        ))}
        {slots.length === 0 ? (
          <span
            aria-hidden
            className='mt-1 h-10 w-10 rounded-full border border-dashed border-surface-700/70 bg-surface-950/30'
          />
        ) : null}
      </div>
    </div>
  );
}

function TraceColumnLabel({
  color,
}: {
  color: TTraceColumnColor;
}): React.JSX.Element {
  return (
    <div className='mb-2 space-y-1'>
      <div
        className='h-1 rounded-full'
        style={{ backgroundColor: TRACE_COLOR[color] }}
        title={TRACE_LABEL[color]}
      />
      <div className='text-center font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
        {TRACE_LABEL[color]}
      </div>
    </div>
  );
}

function TraceRewardIcons({
  rewards,
  size = 'desc-mini',
}: {
  rewards: readonly TPublicSlotReward[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs';
}): React.JSX.Element {
  return (
    <TraceRewardPresentations
      presentations={toTraceRewardPresentations(rewards)}
      size={size}
    />
  );
}

function TraceRewardPresentations({
  presentations,
  size = 'desc-mini',
}: {
  presentations: TTraceRewardPresentation[];
  size?: 'desc-mini' | 'desc' | 'xxs' | 'xs';
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-nowrap items-center justify-center',
        size === 'xxs' ? 'gap-0' : 'gap-0.5',
      )}
    >
      {presentations.map((presentation, index) => (
        <TraceRewardPresentationItem
          key={`${presentation.token}-${index}`}
          presentation={presentation}
          size={size}
        />
      ))}
    </div>
  );
}

function TraceRewardPresentationItem({
  presentation,
  size,
}: {
  presentation: TTraceRewardPresentation;
  size: 'desc-mini' | 'desc' | 'xxs' | 'xs';
}): React.JSX.Element {
  const testKey = presentation.token.replace(/[{}]/g, '');
  if (presentation.kind === 'text') {
    return (
      <span
        className='max-w-10 truncate font-mono text-[8px] text-text-300'
        data-testid={`trace-reward-icon-${testKey}`}
        title={presentation.label}
      >
        {presentation.text}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-visible',
        size === 'xxs' ? 'h-5 w-5' : 'h-4 w-4',
      )}
      data-testid={`trace-reward-icon-${testKey}`}
      title={presentation.label}
    >
      <DescRender desc={presentation.token} size={size} smartSize />
    </span>
  );
}
