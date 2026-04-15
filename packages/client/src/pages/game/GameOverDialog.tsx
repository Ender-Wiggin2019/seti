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
      <DialogContent className='max-w-4xl bg-surface-900/95'>
        <DialogHeader>
          <DialogTitle className='font-display text-xl uppercase tracking-wider'>
            {t('client.game_over.title')}
          </DialogTitle>
          <p className='text-xs text-text-400'>
            {t('client.game_over.winner')}:{' '}
            <span className='font-semibold text-text-100'>
              {winner?.playerName}
            </span>
          </p>
        </DialogHeader>

        <div className='grid gap-3 lg:grid-cols-[1.4fr_0.9fr]'>
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
              className='w-full rounded border border-surface-700/60'
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
