import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { getCentaurianMessageDelayedEffect } from '@seti/common/utils/centaurianMessageDelayedEffects';
import type {
  IPublicCentauriansBoard,
  IPublicCentauriansMessageMilestone,
  IPublicPlayerState,
} from '@/types/re-exports';

const CARD_BY_ID = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

interface ICentauriansMessagesPanelProps {
  alienIndex: number;
  board: IPublicCentauriansBoard;
  players: IPublicPlayerState[];
  myPlayerId?: string;
  playerColors: Record<string, string>;
}

interface IPlayerSummary {
  playerId: string;
  playerName: string;
  score: number;
  isSelf: boolean;
  color: string;
  discoveryMilestone: IPublicCentauriansMessageMilestone | null;
  pendingTokens: ITokenRow[];
  resolvedTokenCount: number;
}

interface ITokenRow {
  cardId: string;
  card: IBaseCard | null;
  threshold: number | null;
  toGo: number | null;
  delayedSummary: string;
}

/**
 * Per-player Centaurian "Messages" rail. One collapsible row per
 * player, ordered with self first.
 *
 * Always-visible header: player chip + discovery-milestone status
 * (resolved / N VP to go) + token-count summary.
 *
 * Expanded body shows the discovery-milestone tile and the FIFO
 * token queue with per-card thresholds. Self gets a small pointer
 * to the personal-board missions slot (which already shows your
 * own pending Centaurian cards in full) instead of duplicating
 * card art here.
 *
 * Resolved-tile → reward-slot mapping is intentionally not shown:
 * the printed reward market in image mode already conveys it via
 * the player-color cover, and the protocol does not link the two
 * today.
 */
export function CentauriansMessagesPanel({
  alienIndex,
  board,
  players,
  myPlayerId,
  playerColors,
}: ICentauriansMessagesPanelProps): React.JSX.Element {
  const summaries = buildPlayerSummaries(
    board,
    players,
    myPlayerId,
    playerColors,
  );

  return (
    <section
      className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2'
      data-testid={`alien-${alienIndex}-centaurians-messages`}
    >
      <div className='mb-1.5 font-mono text-[10px] uppercase tracking-widest text-text-500'>
        Messages
      </div>
      {summaries.length === 0 ? (
        <p className='font-mono text-[10px] text-text-500'>
          Centaurians not discovered yet.
        </p>
      ) : (
        <ul className='space-y-1.5'>
          {summaries.map((summary) => (
            <li key={summary.playerId}>
              <PlayerRail alienIndex={alienIndex} summary={summary} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlayerRail({
  alienIndex,
  summary,
}: {
  alienIndex: number;
  summary: IPlayerSummary;
}): React.JSX.Element {
  const { discoveryMilestone, pendingTokens, resolvedTokenCount, isSelf } =
    summary;
  const milestoneStatus = describeMilestoneStatus(
    discoveryMilestone,
    summary.score,
  );
  const tokenSummary = formatTokenSummary(
    pendingTokens.length,
    resolvedTokenCount,
  );

  return (
    <details
      className='group rounded border border-surface-700/60 bg-surface-900/50 open:bg-surface-900/70'
      data-testid={`alien-${alienIndex}-centaurians-messages-rail-${summary.playerId}`}
      open={isSelf}
    >
      <summary
        className='flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 font-mono text-[10px] text-text-300 marker:hidden'
        data-testid={`alien-${alienIndex}-centaurians-messages-header-${summary.playerId}`}
      >
        <span className='flex min-w-0 items-center gap-1.5'>
          <span
            aria-hidden
            className='inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-surface-200/30'
            style={{ backgroundColor: summary.color }}
          />
          <span className='truncate text-text-100'>
            {summary.playerName}
            {isSelf ? ' (you)' : ''}
          </span>
          <span
            aria-hidden
            className='text-[8px] text-text-500 transition-transform group-open:rotate-90'
          >
            ▸
          </span>
        </span>
        <span className='shrink-0 text-text-400'>
          {milestoneStatus} · {tokenSummary}
        </span>
      </summary>

      <div className='space-y-1.5 border-t border-surface-700/60 px-2 py-1.5'>
        <DiscoveryMilestoneRow
          milestone={discoveryMilestone}
          score={summary.score}
        />
        <TokenList tokens={pendingTokens} isSelf={isSelf} />
      </div>
    </details>
  );
}

function DiscoveryMilestoneRow({
  milestone,
  score,
}: {
  milestone: IPublicCentauriansMessageMilestone | null;
  score: number;
}): React.JSX.Element {
  if (!milestone) {
    return (
      <div className='font-mono text-[10px] text-text-500'>
        No discovery milestone yet.
      </div>
    );
  }
  if (milestone.resolved) {
    return (
      <div className='font-mono text-[10px] text-text-400'>
        <span className='text-text-300'>Discovery milestone:</span> ✓ resolved
        at {milestone.threshold} VP
      </div>
    );
  }
  const toGo = Math.max(0, milestone.threshold - score);
  return (
    <div className='font-mono text-[10px] text-text-400'>
      <span className='text-text-300'>Discovery milestone:</span> threshold{' '}
      <span className='text-text-100'>{milestone.threshold} VP</span>{' '}
      <span className='text-accent-300'>({toGo} to go)</span>
    </div>
  );
}

function TokenList({
  tokens,
  isSelf,
}: {
  tokens: ITokenRow[];
  isSelf: boolean;
}): React.JSX.Element {
  if (tokens.length === 0) {
    return (
      <div className='font-mono text-[10px] text-text-500'>
        No pending message tokens.
      </div>
    );
  }
  return (
    <div className='space-y-1'>
      <div className='font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
        Tokens (oldest resolves first)
      </div>
      <ol className='space-y-0.5'>
        {tokens.map((token, index) => (
          <li
            key={`${token.cardId}-${index}`}
            className='flex items-center justify-between gap-2 rounded bg-surface-950/40 px-1.5 py-1 font-mono text-[10px]'
          >
            <span className='flex min-w-0 items-center gap-1.5'>
              <span className='shrink-0 text-text-500'>{index + 1}.</span>
              <span className='truncate text-text-100'>
                {token.card?.name ?? token.cardId}
              </span>
              <span className='shrink-0 text-text-500'>
                {token.delayedSummary}
              </span>
            </span>
            <span className='shrink-0 text-text-400'>
              {token.threshold !== null ? (
                <>
                  ▸ {token.threshold} VP{' '}
                  {token.toGo !== null ? (
                    <span className='text-accent-300'>
                      ({token.toGo} to go)
                    </span>
                  ) : null}
                </>
              ) : (
                'pending'
              )}
            </span>
          </li>
        ))}
      </ol>
      {isSelf ? (
        <p className='font-mono text-[9px] uppercase tracking-[0.1em] text-text-500'>
          See Missions slot for full card art.
        </p>
      ) : null}
    </div>
  );
}

function buildPlayerSummaries(
  board: IPublicCentauriansBoard,
  players: IPublicPlayerState[],
  myPlayerId: string | undefined,
  playerColors: Record<string, string>,
): IPlayerSummary[] {
  const milestonesByPlayer = groupMilestonesByPlayer(board.messageMilestones);
  return [...players]
    .sort((a, b) =>
      a.playerId === myPlayerId ? -1 : b.playerId === myPlayerId ? 1 : 0,
    )
    .map((player) => {
      const playerMilestones = milestonesByPlayer.get(player.playerId) ?? [];
      const discoveryMilestone =
        playerMilestones.find((m) => m.sourceCardId === null) ?? null;
      const pendingCardIds =
        board.pendingMessagesByPlayer[player.playerId] ?? [];
      const pendingTokens = pendingCardIds.map((cardId) =>
        buildTokenRow(cardId, player.score, playerMilestones),
      );
      const resolvedTokenCount = playerMilestones.filter(
        (m) => m.sourceCardId !== null && m.resolved,
      ).length;
      return {
        playerId: player.playerId,
        playerName: player.playerName,
        score: player.score,
        isSelf: player.playerId === myPlayerId,
        color: playerColors[player.playerId] ?? '#cbd5e1',
        discoveryMilestone,
        pendingTokens,
        resolvedTokenCount,
      } satisfies IPlayerSummary;
    });
}

function groupMilestonesByPlayer(
  milestones: readonly IPublicCentauriansMessageMilestone[],
): Map<string, IPublicCentauriansMessageMilestone[]> {
  const out = new Map<string, IPublicCentauriansMessageMilestone[]>();
  for (const milestone of milestones) {
    const list = out.get(milestone.playerId) ?? [];
    list.push(milestone);
    out.set(milestone.playerId, list);
  }
  return out;
}

function buildTokenRow(
  cardId: string,
  playerScore: number,
  playerMilestones: IPublicCentauriansMessageMilestone[],
): ITokenRow {
  const card = CARD_BY_ID.get(cardId) ?? null;
  const milestone = playerMilestones.find(
    (m) => m.sourceCardId === cardId && !m.resolved,
  );
  const threshold = milestone?.threshold ?? null;
  const toGo = threshold !== null ? Math.max(0, threshold - playerScore) : null;
  const delayed = getCentaurianMessageDelayedEffect(cardId);
  return {
    cardId,
    card,
    threshold,
    toGo,
    delayedSummary: formatDelayedEffect(delayed),
  };
}

function describeMilestoneStatus(
  milestone: IPublicCentauriansMessageMilestone | null,
  score: number,
): string {
  if (!milestone) return 'no milestone';
  if (milestone.resolved) return '✓ resolved';
  const toGo = Math.max(0, milestone.threshold - score);
  return `⏳ ${toGo} to go`;
}

function formatTokenSummary(
  pendingCount: number,
  resolvedCount: number,
): string {
  if (pendingCount === 0 && resolvedCount === 0) return 'no tokens';
  const parts: string[] = [];
  if (pendingCount > 0) parts.push(`${pendingCount} pending`);
  if (resolvedCount > 0) parts.push(`${resolvedCount} resolved`);
  return parts.join(' · ');
}

function formatDelayedEffect(
  delayed: ReturnType<typeof getCentaurianMessageDelayedEffect>,
): string {
  if (!delayed) return '';
  switch (delayed.type) {
    case 'income':
      return '→ income';
    case 'trace':
      return `→ ${delayed.trace} trace`;
    case 'credit-and-trace':
      return '→ credit + any trace';
    default:
      return '';
  }
}
