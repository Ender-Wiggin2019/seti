import { useTranslation } from 'react-i18next';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type { TRivalObjectiveId } from '@/types/re-exports';
import {
  formatRivalObjectiveTask,
  getRivalObjectiveDefinition,
  getRivalObjectiveImageSrc,
} from './rivalObjectivePresentation';

interface IRivalObjectiveCardProps {
  objectiveId: TRivalObjectiveId;
  markedTaskIndexes: number[];
}

export function RivalObjectiveCard({
  objectiveId,
  markedTaskIndexes,
}: IRivalObjectiveCardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  const definition = getRivalObjectiveDefinition(objectiveId);
  const imageSrc = getRivalObjectiveImageSrc(objectiveId);
  const taskCount = Math.max(definition?.tasks.length ?? 1, 1);
  const normalizedMarkedTaskIndexes = normalizeMarkedTaskIndexes(
    markedTaskIndexes,
    taskCount,
  );
  const markedCount = normalizedMarkedTaskIndexes.length;

  return (
    <div
      className='min-w-0 overflow-hidden rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 shadow-hairline-inset'
      data-testid={`rival-objective-${objectiveId}`}
    >
      {!textMode && imageSrc ? (
        <div className='relative'>
          <img
            src={imageSrc}
            alt={t('client.rival_objective.image_alt', {
              objective: objectiveId,
              defaultValue: 'Rival objective {{objective}}',
            })}
            className='aspect-square w-full object-cover'
            data-testid={`rival-objective-image-${objectiveId}`}
            loading='lazy'
          />
          <HotspotAnchor
            sceneId='rival-board'
            hotspotId={`objective-${objectiveId}-summary`}
            baseWidth={1000}
            baseHeight={1000}
            x={500}
            y={910}
            width={900}
            height={90}
            shape='rect'
            color='#38bdf8'
            debugLabel={`rival objective ${objectiveId} summary`}
            className='rounded-[3px]'
          >
            <div className='flex h-full w-full items-center justify-between gap-1 rounded-[3px] bg-background-950/85 px-1 py-0.5'>
              <span className='truncate readout text-[9px] text-text-100'>
                {objectiveId}
              </span>
              <span className='readout text-[9px] text-accent-200'>
                {markedCount}/{taskCount}
              </span>
            </div>
          </HotspotAnchor>
          <RivalObjectiveImageMarkers
            objectiveId={objectiveId}
            taskCount={taskCount}
            markedTaskIndexes={normalizedMarkedTaskIndexes}
          />
        </div>
      ) : (
        <RivalObjectiveTextCard
          objectiveId={objectiveId}
          markedTaskIndexes={normalizedMarkedTaskIndexes}
          markedCount={markedCount}
          taskCount={taskCount}
        />
      )}
    </div>
  );
}

function RivalObjectiveImageMarkers({
  objectiveId,
  markedTaskIndexes,
  taskCount,
}: {
  objectiveId: TRivalObjectiveId;
  markedTaskIndexes: number[];
  taskCount: number;
}): React.JSX.Element {
  return (
    <div className='absolute inset-0' aria-hidden>
      {Array.from({ length: taskCount }, (_, index) => {
        const marked = markedTaskIndexes.includes(index);
        return (
          <HotspotAnchor
            key={`${objectiveId}-image-marker-${index}`}
            sceneId='rival-board'
            hotspotId={`objective-${objectiveId}-task-${index}`}
            baseWidth={1000}
            baseHeight={1000}
            x={((index + 0.5) * 1000) / taskCount}
            y={42}
            width={820 / taskCount}
            height={24}
            shape='rect'
            color={marked ? '#facc15' : '#94a3b8'}
            debugLabel={`rival objective ${objectiveId} task ${index + 1}`}
            className='flex items-center rounded-full'
            dataAttributes={{ 'data-marked': marked ? 'true' : 'false' }}
            testId={`rival-objective-marker-${objectiveId}-${index}`}
          >
            <span
              className={cn(
                'h-1.5 w-full rounded-full border border-background-950/70',
                marked ? 'bg-accent-300' : 'bg-background-950/70',
              )}
            />
          </HotspotAnchor>
        );
      })}
    </div>
  );
}

function normalizeMarkedTaskIndexes(
  indexes: readonly number[],
  taskCount: number,
): number[] {
  return [...new Set(indexes)].filter(
    (index) => Number.isInteger(index) && index >= 0 && index < taskCount,
  );
}

function RivalObjectiveTextCard({
  objectiveId,
  markedTaskIndexes,
  markedCount,
  taskCount,
}: {
  objectiveId: TRivalObjectiveId;
  markedTaskIndexes: number[];
  markedCount: number;
  taskCount: number;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const definition = getRivalObjectiveDefinition(objectiveId);

  return (
    <article
      className='space-y-1.5 p-1.5'
      data-testid={`rival-objective-text-card-${objectiveId}`}
    >
      <div className='flex items-center justify-between gap-1'>
        <span className='truncate readout text-[10px] text-text-100'>
          {objectiveId}
        </span>
        <span className='readout text-[10px] text-accent-200'>
          {markedCount}/{taskCount}
        </span>
      </div>
      <div className='space-y-1'>
        {definition?.tasks.map((task, index) => (
          <div
            key={`${objectiveId}-task-${index}`}
            className={cn(
              'rounded-[3px] border px-1 py-0.5 text-[10px] leading-snug',
              markedTaskIndexes.includes(index)
                ? 'border-accent-500/70 bg-accent-500/10 text-text-100'
                : 'border-[color:var(--metal-edge-soft)] bg-background-950/60 text-text-400',
            )}
          >
            {formatRivalObjectiveTask(task, t)}
          </div>
        )) ?? (
          <div className='text-[10px] text-text-500'>
            {t('client.rival_objective.unknown', {
              defaultValue: 'Unknown objective',
            })}
          </div>
        )}
      </div>
      <div className='flex gap-1' aria-hidden>
        {Array.from({ length: taskCount }, (_, index) => (
          <span
            key={`${objectiveId}-progress-${index}`}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              markedTaskIndexes.includes(index)
                ? 'bg-accent-400'
                : 'bg-background-700',
            )}
          />
        ))}
      </div>
    </article>
  );
}
