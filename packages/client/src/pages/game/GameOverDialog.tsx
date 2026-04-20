import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GoldTileSelector,
  type IGoldTileItem,
  type IMilestoneItem,
  type IScoreBreakdownRow,
  MilestoneTrack,
  ScoreBreakdown,
} from '@/features/scoring';
import { cn } from '@/lib/cn';
import { useGameContext } from '@/pages/game/GameContext';
import { EPhase, type IPublicMilestoneState } from '@/types/re-exports';

export function GameOverDialog(): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const { gameState } = useGameContext();

  if (gameState?.phase !== EPhase.GAME_OVER) return null;

  const extendedState = gameState as typeof gameState & {
    scoreBreakdown?: Record<
      string,
      Partial<Omit<IScoreBreakdownRow, 'playerId' | 'playerName' | 'total'>> & {
        total?: number;
      }
    >;
    milestones?: IMilestoneItem[] | IPublicMilestoneState;
    goldTiles?: IGoldTileItem[];
  };

  const rows: IScoreBreakdownRow[] = gameState.players
    .slice()
    .sort((left, right) => right.score - left.score)
    .map((player) => {
      const breakdown = extendedState.scoreBreakdown?.[player.playerId];
      return {
        playerId: player.playerId,
        playerName: player.playerName,
        total: breakdown?.total ?? player.score,
        base: breakdown?.base ?? player.score,
        cards: breakdown?.cards ?? 0,
        tech: breakdown?.tech ?? 0,
        milestone: breakdown?.milestone ?? 0,
        gold: breakdown?.gold ?? 0,
        alien: breakdown?.alien ?? 0,
      };
    });

  const winner = rows[0];
  const milestoneItems = normalizeMilestones(extendedState.milestones);
  const goldTiles = extendedState.goldTiles ?? [];

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className='max-w-4xl p-0'>
        <DialogHeader className='px-6 pt-6'>
          <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.74_0.10_240)]'>
            <span className='h-px w-6 bg-[oklch(0.68_0.11_240)]' />
            {t('client.game_over.kicker', {
              defaultValue: 'Mission Concluded',
            })}
          </span>
          <DialogTitle className='text-2xl tracking-[0.08em]'>
            {t('client.game_over.title')}
          </DialogTitle>
          <WinnerReadout
            label={t('client.game_over.winner')}
            name={winner?.playerName}
            score={winner?.total}
          />
        </DialogHeader>

        <div className='border-t border-[color:var(--metal-edge-soft)]' />

        <div className='grid gap-4 p-6 lg:grid-cols-[1.4fr_0.9fr]'>
          <div className='space-y-3'>
            <ScoreBreakdown rows={rows} />
            <p className='text-xs text-text-500'>
              {t('client.game_over.breakdown_hint')}
            </p>
          </div>
          <div className='space-y-3'>
            <MilestoneTrack milestones={milestoneItems} />
            <GoldTileSelector tiles={goldTiles} selectedTileId={null} />
            <img
              src='/assets/seti/boards/scoringReminder.jpg'
              alt={t('client.game_over.scoring_reminder_alt')}
              className={cn(
                'w-full rounded-[4px]',
                'border border-[color:var(--metal-edge-soft)]',
                'shadow-hairline-inset',
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WinnerReadout({
  label,
  name,
  score,
}: {
  label: string;
  name?: string;
  score?: number;
}): React.JSX.Element {
  if (!name) {
    return <p className='text-xs text-text-500'>{label}</p>;
  }
  return (
    <div className='flex flex-wrap items-baseline gap-3 pt-2'>
      <p className='flex items-baseline gap-2'>
        <span className='micro-label text-text-500'>{label}:</span>
        <span className='font-display text-lg font-semibold text-text-100'>
          {name}
        </span>
      </p>
      {typeof score === 'number' && (
        <span className='readout text-sm text-[oklch(0.82_0.10_240)]'>
          {score} pts
        </span>
      )}
    </div>
  );
}

function normalizeMilestones(
  raw: IMilestoneItem[] | IPublicMilestoneState | undefined,
): IMilestoneItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  const items: IMilestoneItem[] = [];

  for (const bucket of raw.goldMilestones) {
    if (!bucket.resolvedPlayerIds.length) {
      items.push({
        id: `gold-${bucket.threshold}`,
        threshold: bucket.threshold,
        type: 'gold',
      });
      continue;
    }
    for (const playerId of bucket.resolvedPlayerIds) {
      items.push({
        id: `gold-${bucket.threshold}-${playerId}`,
        threshold: bucket.threshold,
        type: 'gold',
        claimedBy: playerId,
      });
    }
  }

  for (const bucket of raw.neutralMilestones) {
    if (!bucket.resolvedPlayerIds.length) {
      items.push({
        id: `neutral-${bucket.threshold}`,
        threshold: bucket.threshold,
        type: 'neutral',
      });
      continue;
    }
    for (const playerId of bucket.resolvedPlayerIds) {
      items.push({
        id: `neutral-${bucket.threshold}-${playerId}`,
        threshold: bucket.threshold,
        type: 'neutral',
        claimedBy: playerId,
      });
    }
  }

  return items;
}
