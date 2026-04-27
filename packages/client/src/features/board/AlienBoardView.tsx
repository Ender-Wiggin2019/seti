import { ANOMALY_COLUMN_REWARD_LADDER } from '@seti/common/constant/alienBoardConfig';
import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import { CardRender } from '@/features/cards/CardRender';
import { cn } from '@/lib/cn';
import type {
  IPublicAlienState,
  IPublicTraceSlot,
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

const TRACE_COLORS = [ETrace.RED, ETrace.YELLOW, ETrace.BLUE] as const;

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

interface IGroupedAlienSlots {
  discoverySlots: IPublicTraceSlot[];
  overflowSlot: IPublicTraceSlot | null;
  anomalyColumns: IPublicTraceSlot[];
  anomalyTokens: IPublicTraceSlot[];
  boardSlots: IPublicTraceSlot[];
}

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
  const groupedSlots = groupAlienSlots(alien.slots);
  const discoveredName =
    alien.alienType != null ? ALIEN_TYPE_I18N_KEY[alien.alienType] : null;
  const title =
    alien.discovered && alien.alienType != null
      ? discoveredName
        ? t(`client.alien_board.types.${discoveredName}`)
        : t('client.alien_board.alien_index', { index: alien.alienIndex + 1 })
      : t('client.alien_board.alien_index', { index: alien.alienIndex + 1 });

  return (
    <article className='rounded-md border border-surface-700/50 bg-surface-900/60 p-3'>
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
          <DiscoveryZone
            alienIndex={alien.alienIndex}
            slots={groupedSlots.discoverySlots}
            playerColors={playerColors}
          />
          {groupedSlots.overflowSlot ? (
            <OverflowZone
              alienIndex={alien.alienIndex}
              slot={groupedSlots.overflowSlot}
              playerColors={playerColors}
            />
          ) : null}

          {alien.discovered ? (
            <DiscoveredAlienBoard
              alien={alien}
              slots={groupedSlots}
              playerColors={playerColors}
            />
          ) : (
            <HiddenBoard alienIndex={alien.alienIndex} />
          )}
        </div>

        {alien.discovered ? <AlienDeckPanel alien={alien} /> : null}
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
      <div className='flex flex-wrap items-start gap-2'>
        {slots.map((slot) => (
          <TraceSlot
            key={slot.slotId}
            slot={slot}
            playerColors={playerColors}
          />
        ))}
      </div>
    </section>
  );
}

function OverflowZone({
  alienIndex,
  slot,
  playerColors,
}: {
  alienIndex: number;
  slot: IPublicTraceSlot;
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
      <TraceSlot slot={slot} playerColors={playerColors} />
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
      <div className='font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Hidden Board
      </div>
    </section>
  );
}

function DiscoveredAlienBoard({
  alien,
  slots,
  playerColors,
}: {
  alien: IPublicAlienState;
  slots: IGroupedAlienSlots;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  if (alien.alienType === EAlienType.ANOMALIES) {
    return (
      <AnomaliesBoard
        alienIndex={alien.alienIndex}
        columns={slots.anomalyColumns}
        tokens={slots.anomalyTokens}
        extraSlots={slots.boardSlots}
        playerColors={playerColors}
      />
    );
  }

  return (
    <GenericAlienBoard
      alienIndex={alien.alienIndex}
      slots={slots.boardSlots}
      playerColors={playerColors}
    />
  );
}

function GenericAlienBoard({
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
      className='rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-generic-board`}
    >
      <div className='flex flex-wrap items-start gap-2'>
        {slots.map((slot) => (
          <TraceSlot
            key={slot.slotId}
            slot={slot}
            playerColors={playerColors}
          />
        ))}
      </div>
    </section>
  );
}

function AnomaliesBoard({
  alienIndex,
  columns,
  tokens,
  extraSlots,
  playerColors,
}: {
  alienIndex: number;
  columns: IPublicTraceSlot[];
  tokens: IPublicTraceSlot[];
  extraSlots: IPublicTraceSlot[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  return (
    <section
      className='rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-anomalies-board`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Anomaly Board
      </div>
      <div className='grid gap-2 sm:grid-cols-3'>
        {TRACE_COLORS.map((color) => {
          const column =
            columns.find((slot) => slot.traceColor === color) ??
            createEmptyColumnSlot(alienIndex, color);
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

      {tokens.length > 0 ? (
        <div className='mt-3'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
            Tokens
          </div>
          <div className='flex flex-wrap gap-2'>
            {tokens.map((token) => (
              <AnomalyToken
                key={token.slotId}
                alienIndex={alienIndex}
                slot={token}
              />
            ))}
          </div>
        </div>
      ) : null}

      {extraSlots.length > 0 ? (
        <div className='mt-3 flex flex-wrap items-start gap-2'>
          {extraSlots.map((slot) => (
            <TraceSlot
              key={slot.slotId}
              slot={slot}
              playerColors={playerColors}
            />
          ))}
        </div>
      ) : null}
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
            <span>{formatRewards([...rewards])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyToken({
  alienIndex,
  slot,
}: {
  alienIndex: number;
  slot: IPublicTraceSlot;
}): React.JSX.Element {
  const parsed = parseAnomalyToken(slot.slotId);
  const color = parsed?.color ?? slot.traceColor;
  const sector = parsed?.sectorIndex ?? '?';

  return (
    <div
      className='flex min-w-20 items-center gap-2 rounded border border-surface-700/60 bg-surface-900/50 px-2 py-1'
      data-testid={`alien-${alienIndex}-anomaly-token-${sector}-${color}`}
    >
      <span
        className='h-4 w-4 rounded-full border border-surface-200/30'
        style={{ backgroundColor: `${TRACE_COLOR[color]}66` }}
      />
      <span className='font-mono text-[10px] text-text-300'>S{sector}</span>
      <span className='font-mono text-[10px] text-text-500'>
        {formatRewards(slot.rewards)}
      </span>
    </div>
  );
}

function AlienDeckPanel({
  alien,
}: {
  alien: IPublicAlienState;
}): React.JSX.Element {
  const faceUpCard = alien.faceUpAlienCardId
    ? CARD_BY_ID.get(alien.faceUpAlienCardId)
    : undefined;

  return (
    <aside
      className='w-full rounded border border-surface-700/50 bg-surface-950/40 p-2 lg:w-28'
      data-testid={`alien-${alien.alienIndex}-deck-panel`}
    >
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Alien Deck
      </div>
      <div className='space-y-1 font-mono text-[10px] text-text-300'>
        <div>Deck {alien.alienDeckSize ?? 0}</div>
        <div>Discard {alien.alienDiscardSize ?? 0}</div>
      </div>
      {faceUpCard ? (
        <div className='mt-2 h-[92px] w-[66px] origin-top-left scale-[0.44] overflow-visible'>
          <CardRender card={faceUpCard} />
        </div>
      ) : alien.faceUpAlienCardId ? (
        <div className='mt-2 rounded border border-surface-700/60 px-2 py-3 text-center font-mono text-[10px] text-text-400'>
          {alien.faceUpAlienCardId}
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
  const rewardLabel = formatRewards(slot.rewards);

  return (
    <div className='flex flex-col items-center gap-1'>
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          isOverflow
            ? 'border-2 border-dashed border-surface-500/70 bg-surface-800/50'
            : 'border-2 border-surface-600/80',
          slot.isDiscovery && 'ring-1 ring-accent-400/50',
        )}
        style={
          !isOverflow
            ? {
                backgroundColor: `${traceColor}33`,
                borderColor: `${traceColor}99`,
              }
            : undefined
        }
        title={`${TRACE_LABEL[slot.traceColor]} slot${isOverflow ? ' (overflow)' : ''}${slot.isDiscovery ? ' — Discovery!' : ''}`}
      >
        {slot.isDiscovery && (
          <span className='text-[8px] font-bold text-accent-300'>★</span>
        )}
        {isOverflow && (
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

      {rewardLabel && (
        <span className='font-mono text-[9px] text-text-400'>
          {rewardLabel}
        </span>
      )}
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

function groupAlienSlots(slots: IPublicTraceSlot[]): IGroupedAlienSlots {
  const discoverySlots = slots.filter(
    (slot) => getSlotKind(slot) === 'discovery',
  );
  const overflowSlot =
    slots.find((slot) => getSlotKind(slot) === 'overflow') ?? null;
  const anomalyColumns = slots.filter(
    (slot) => getSlotKind(slot) === 'anomaly-column',
  );
  const anomalyTokens = slots.filter(
    (slot) => getSlotKind(slot) === 'anomaly-token',
  );
  const boardSlots = slots.filter((slot) => getSlotKind(slot) === 'board');

  return {
    discoverySlots,
    overflowSlot,
    anomalyColumns,
    anomalyTokens,
    boardSlots,
  };
}

function getSlotKind(
  slot: IPublicTraceSlot,
): NonNullable<IPublicTraceSlot['slotKind']> {
  if (slot.slotKind) return slot.slotKind;
  if (slot.isDiscovery) return 'discovery';
  if (slot.slotId.includes('anomaly-column')) return 'anomaly-column';
  if (slot.slotId.includes('anomaly-token')) return 'anomaly-token';
  if (slot.slotId.includes('overflow')) return 'overflow';
  return 'board';
}

function createEmptyColumnSlot(
  alienIndex: number,
  color: ETrace.RED | ETrace.YELLOW | ETrace.BLUE,
): IPublicTraceSlot {
  return {
    slotId: `alien-${alienIndex}-anomaly-column|${color}`,
    traceColor: color,
    occupants: [],
    maxOccupants: -1,
    rewards: [],
    isDiscovery: false,
    slotKind: 'anomaly-column',
  };
}

function parseAnomalyToken(slotId: string): {
  sectorIndex: number;
  color: ETrace.RED | ETrace.YELLOW | ETrace.BLUE;
} | null {
  const parts = slotId.split('|');
  if (parts.length !== 3) return null;
  const sectorIndex = Number(parts[1]);
  const color = parts[2] as ETrace.RED | ETrace.YELLOW | ETrace.BLUE;
  if (!Number.isInteger(sectorIndex)) return null;
  if (!TRACE_COLORS.includes(color)) return null;
  return { sectorIndex, color };
}

function formatRewards(rewards: TPublicSlotReward[]): string {
  if (rewards.length === 0) return '';
  return rewards
    .map((reward) => {
      switch (reward.type) {
        case 'VP':
          return `${reward.amount}VP`;
        case 'PUBLICITY':
          return `${reward.amount}PR`;
        case 'CREDIT':
          return `${reward.amount}CR`;
        case 'ENERGY':
          return `${reward.amount}EN`;
        case 'DATA':
          return `${reward.amount}DATA`;
        case 'CARD':
          return `${reward.amount}CARD`;
        case 'CUSTOM':
          return reward.effectId;
        default: {
          const _exhaustive: never = reward;
          return _exhaustive;
        }
      }
    })
    .join(', ');
}
