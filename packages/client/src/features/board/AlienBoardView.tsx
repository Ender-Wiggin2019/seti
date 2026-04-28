import { EffectFactory } from '@seti/cards';
import { ANOMALY_COLUMN_REWARD_LADDER } from '@seti/common/constant/alienBoardConfig';
import { ALL_CARDS } from '@seti/common/data/index';
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
import type {
  IPublicAlienCardZone,
  IPublicAlienState,
  IPublicAnomaliesBoard,
  IPublicGenericAlienBoard,
  IPublicOumuamuaBoard,
  IPublicTraceSlot,
  TPublicAlienBoard,
  TPublicSlotReward,
} from '@/types/re-exports';
import { EAlienType, ETrace } from '@/types/re-exports';

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
}

interface IAlienBoardRendererProps {
  board: TPublicAlienBoard;
  playerColors: Record<string, string>;
  alienIndex: number;
}

type TAlienBoardRenderer = (
  props: IAlienBoardRendererProps,
) => React.JSX.Element;

const ALIEN_BOARD_RENDERERS: Partial<Record<EAlienType, TAlienBoardRenderer>> =
  {
    [EAlienType.ANOMALIES]: AnomaliesBoardRenderer,
    [EAlienType.OUMUAMUA]: OumuamuaBoardRenderer,
  };

export function AlienBoardView({
  aliens,
  playerColors,
}: IAlienBoardViewProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='w-full rounded-lg border border-surface-700/40 bg-surface-900/40 p-3'>
      <header className='mb-2'>
        <h2 className='font-display text-base font-bold uppercase tracking-wider text-text-100'>
          {t('client.alien_board.title')}
        </h2>
      </header>

      <div className='grid gap-3 xl:grid-cols-2'>
        {aliens.map((alien) => (
          <AlienCard
            key={alien.alienIndex}
            alien={alien}
            playerColors={playerColors}
          />
        ))}
      </div>
    </section>
  );
}

function AlienCard({
  alien,
  playerColors,
}: {
  alien: IPublicAlienState;
  playerColors: Record<string, string>;
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
      className='rounded-md border border-surface-700/50 bg-surface-900/60 p-3'
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

      <div className='mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]'>
        <div className='space-y-3'>
          {alien.discovered && alien.board ? (
            <DiscoveredAlienBoard
              alien={alien}
              board={alien.board}
              playerColors={playerColors}
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
      className='rounded border border-surface-700/50 bg-surface-950/40 p-2'
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
      className='rounded border border-dashed border-surface-700/60 bg-surface-950/30 p-2'
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
      className='min-h-24 rounded border border-surface-700/50 bg-surface-950/30 p-3'
      data-testid={`alien-${alienIndex}-hidden-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Alien Board
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {TRACE_COLUMN_COLORS.map((color) => (
          <div
            key={color}
            className='rounded border border-surface-700/50 bg-surface-900/30 p-2'
            data-testid={`alien-${alienIndex}-hidden-board-column-${color}`}
          >
            <TraceColumnHeader color={color} />
            <div className='flex min-h-14 items-center justify-center'>
              <div
                className='flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-surface-500/70 bg-surface-800/40 text-[10px] font-semibold text-text-500'
                aria-label={`${TRACE_LABEL[color]} hidden trace slot`}
              >
                ?
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiscoveredAlienBoard({
  alien,
  board,
  playerColors,
}: {
  alien: IPublicAlienState;
  board: TPublicAlienBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const Renderer =
    alien.alienType != null ? ALIEN_BOARD_RENDERERS[alien.alienType] : null;
  if (Renderer) {
    return (
      <Renderer
        alienIndex={alien.alienIndex}
        board={board}
        playerColors={playerColors}
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
    />
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
      className='rounded border border-surface-700/50 bg-surface-950/30 p-2'
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
}: {
  alienIndex: number;
  board: IPublicOumuamuaBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-oumuamua-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Oumuamua Tile
      </div>
      <OumuamuaTile
        alienIndex={alienIndex}
        tile={board.tile}
        playerColors={playerColors}
      />
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

function OumuamuaTile({
  alienIndex,
  tile,
  playerColors,
}: {
  alienIndex: number;
  tile: IPublicOumuamuaBoard['tile'];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  if (!tile) {
    return (
      <div
        className='rounded border border-dashed border-surface-700/70 bg-surface-900/30 p-3 font-mono text-[10px] text-text-500'
        data-testid={`alien-${alienIndex}-oumuamua-tile`}
      >
        Tile not placed
      </div>
    );
  }

  return (
    <div
      className='rounded border border-violet-400/50 bg-violet-500/10 p-3'
      data-testid={`alien-${alienIndex}-oumuamua-tile`}
    >
      <div className='flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-text-300'>
        <span>Data {tile.dataRemaining}</span>
        <span>Sector {tile.sectorId}</span>
      </div>
      <div className='mt-3 flex min-h-5 flex-wrap items-center gap-1'>
        {tile.markerPlayerIds.map((playerId, index) => (
          <span
            key={`${playerId}-${index}`}
            className='h-4 w-4 rounded-full border border-surface-100/60 shadow-[0_1px_3px_rgba(0,0,0,0.45)]'
            data-testid={`oumuamua-tile-marker-${playerId}-${index}`}
            style={{
              backgroundColor: playerColors[playerId] ?? '#9ca3af',
            }}
            title={playerId}
          />
        ))}
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
      className='rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-anomalies-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Alien Board
      </div>
      <div className='grid gap-2 sm:grid-cols-3'>
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
      className='rounded border border-surface-700/60 bg-surface-900/50 p-2'
      data-testid={`alien-${alienIndex}-anomaly-column-${color}`}
    >
      <div
        className='mb-2 h-1 rounded-full'
        style={{ backgroundColor: TRACE_COLOR[color] }}
      />
      <div className='flex min-h-20 flex-col-reverse items-center justify-start gap-1 rounded bg-surface-950/50 p-2'>
        {slot.occupants.map((occ, index) => (
          <OccupantMarker
            key={`${slot.slotId}-${index}`}
            occupant={occ}
            playerColors={playerColors}
          />
        ))}
      </div>
      <div className='mt-2 space-y-1'>
        {ANOMALY_COLUMN_REWARD_LADDER.map((rewards, index) => (
          <div
            key={index}
            className='flex items-center justify-between gap-2 font-mono text-[9px] text-text-500'
          >
            <span>{index + 1}</span>
            <TraceRewardIcons rewards={rewards} size='desc-mini' />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlienDeckPanel({
  alienIndex,
  cardZone,
}: {
  alienIndex: number;
  cardZone: IPublicAlienCardZone;
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
        <div className='mt-2 h-[92px] w-[66px] origin-top-left scale-[0.44] overflow-visible'>
          <CardRender card={faceUpCard} />
        </div>
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
  const traceColor = TRACE_COLOR[slot.traceColor];
  const rewards = toTraceRewardPresentations(slot.rewards);

  return (
    <div className='flex flex-col items-center gap-1'>
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full',
          isOverflow
            ? 'border-2 border-dashed border-surface-500/70 bg-surface-800/50'
            : 'border-2 border-surface-600/80',
          slot.isDiscovery && 'ring-1 ring-accent-400/50',
        )}
        data-testid={`trace-slot-${slot.slotId}-circle`}
        style={
          !isOverflow
            ? {
                backgroundColor: `${traceColor}33`,
                borderColor: `${traceColor}99`,
              }
            : undefined
        }
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' - Discovery' : ''}`}
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
      </div>

      <div className='flex min-h-[14px] flex-wrap justify-center gap-0.5'>
        {slot.occupants.map((occ, index) => (
          <OccupantMarker
            key={`${slot.slotId}-${index}`}
            occupant={occ}
            playerColors={playerColors}
          />
        ))}
      </div>
    </div>
  );
}

function OccupantMarker({
  occupant,
  playerColors,
}: {
  occupant: IPublicTraceSlot['occupants'][number];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <span
      className='inline-block h-2.5 w-2.5 rounded-full border border-surface-200/30'
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
    <div className='grid grid-cols-3 gap-2'>
      {TRACE_COLUMN_COLORS.map((color) => (
        <TraceColumn
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

function TraceColumn({
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
      className='rounded border border-surface-700/50 bg-surface-900/30 p-2'
      data-testid={`alien-${alienIndex}-${area}-column-${color}`}
    >
      <TraceColumnHeader color={color} />
      <div className='flex min-h-14 flex-wrap items-start justify-center gap-2'>
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

function TraceColumnHeader({
  color,
}: {
  color: TTraceColumnColor;
}): React.JSX.Element {
  return (
    <div
      className='mb-2 h-1 rounded-full'
      style={{ backgroundColor: TRACE_COLOR[color] }}
      title={TRACE_LABEL[color]}
    />
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
    <div className='flex flex-wrap items-center justify-center gap-0.5'>
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
      className='inline-flex h-4 w-4 items-center justify-center overflow-visible'
      data-testid={`trace-reward-icon-${testKey}`}
      title={presentation.label}
    >
      <EffectFactory
        effect={{
          ...presentation.effect,
          size,
        }}
      />
    </span>
  );
}
