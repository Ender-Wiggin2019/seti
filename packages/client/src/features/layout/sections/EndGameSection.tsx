import { useTranslation } from 'react-i18next';
import { MilestoneTrack } from '@/features/scoring';
import { useGameContext } from '@/pages/game/GameContext';
import type {
  IPublicGoldScoringTile,
  IPublicPlayerState,
} from '@/types/re-exports';
import type { ISectionRenderProps } from '../sectionRegistry';
import { buildMilestoneItems } from '../sessionHelpers';

export function EndGameSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { gameState } = useGameContext();
  const { t } = useTranslation('common');
  if (!gameState) return <></>;

  const playerColors = gameState.players.reduce<Record<string, string>>(
    (acc, p) => {
      acc[p.playerId] = p.color;
      return acc;
    },
    {},
  );

  return (
    <div className='space-y-4'>
      <section className='instrument-panel p-3'>
        <div className='section-head mb-2'>
          <span aria-hidden className='section-head__tick' />
          <p className='micro-label'>{t('client.game_layout.scores')}</p>
          <div aria-hidden className='section-head__rule' />
        </div>
        <ScoreLadder players={gameState.players} />
      </section>

      <MilestoneTrack
        milestones={buildMilestoneItems(gameState.milestones, playerColors)}
      />

      <GoldScoringTilesView
        tiles={gameState.goldScoringTiles}
        playerColors={playerColors}
      />
    </div>
  );
}

function ScoreLadder({
  players,
}: {
  players: IPublicPlayerState[];
}): React.JSX.Element {
  const sorted = players.slice().sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  const range = Math.max(1, top);
  return (
    <div className='flex flex-col gap-1.5'>
      {sorted.map((p, index) => {
        const isLeader = p.score === top && p.score > 0;
        const ratio = Math.min(100, Math.round((p.score / range) * 100));
        return (
          <div
            key={p.playerId}
            className='relative flex items-center gap-3 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 px-3 py-1.5 shadow-hairline-inset'
          >
            <span className='w-5 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              aria-hidden
              className='h-2 w-2 shrink-0 rounded-full border border-[oklch(0.96_0.008_260/0.4)]'
              style={{ backgroundColor: p.color }}
            />
            <span className='flex-1 truncate text-[13px] font-medium text-text-100'>
              {p.playerName}
            </span>
            <div className='hidden min-w-[80px] flex-[0.5] items-center sm:flex'>
              <div className='meter flex-1' data-full={isLeader}>
                <div className='meter__fill' style={{ width: `${ratio}%` }} />
              </div>
            </div>
            <span
              className={
                isLeader
                  ? 'readout text-[15px] font-semibold text-text-100 leading-none'
                  : 'readout text-[15px] text-text-200 leading-none'
              }
            >
              {p.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GoldScoringTilesView({
  tiles,
  playerColors,
}: {
  tiles: IPublicGoldScoringTile[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  if (tiles.length === 0) {
    return (
      <p className='font-mono text-[10px] tracking-[0.08em] text-text-500'>
        {t('client.game_layout.no_gold_tiles')}
      </p>
    );
  }
  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-2'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.game_layout.gold_scoring_tiles')}
        </p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {tiles.length}
        </span>
      </div>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {tiles.map((tile) => {
          const claimedSlots = new Map(
            tile.claims.map((c) => [c.value, c.playerId]),
          );
          return (
            <div
              key={tile.id}
              className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 p-2 shadow-hairline-inset'
            >
              <div className='mb-1.5 flex items-center gap-1.5'>
                <img
                  src='/assets/seti/icons/vp.png'
                  alt=''
                  aria-hidden
                  className='h-3.5 w-3.5 opacity-90'
                />
                <span className='font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-200'>
                  {tile.id}
                </span>
                <span
                  className='chip ml-auto'
                  title={t('client.game_layout.side', { side: tile.side })}
                >
                  {tile.side}
                </span>
              </div>
              <div className='flex flex-wrap gap-1'>
                {tile.slotValues.map((value, idx) => {
                  const claimer = claimedSlots.get(value);
                  const claimerColor = claimer
                    ? (playerColors[claimer] ?? undefined)
                    : undefined;
                  return (
                    <div
                      key={`${tile.id}-slot-${idx}`}
                      className={[
                        'flex min-w-[38px] items-center justify-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
                        claimer
                          ? 'border-accent-500/60 bg-accent-500/[0.08] text-text-100 shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.2)]'
                          : 'border-[color:var(--metal-edge-soft)] bg-background-950/50 text-text-500',
                      ].join(' ')}
                    >
                      {claimer ? (
                        <span
                          aria-hidden
                          className='inline-block h-2 w-2 rounded-full border border-[oklch(0.96_0.008_260/0.4)]'
                          style={{ backgroundColor: claimerColor }}
                        />
                      ) : null}
                      {value}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
