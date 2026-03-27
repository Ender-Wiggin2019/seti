interface IMilestoneItem {
  id: string;
  threshold: number;
  type: 'gold' | 'neutral';
  claimedBy?: string;
}

interface IMilestoneTrackProps {
  milestones: IMilestoneItem[];
}

export function MilestoneTrack({
  milestones,
}: IMilestoneTrackProps): React.JSX.Element {
  if (milestones.length === 0) {
    return <p className='text-xs text-text-500'>No milestone data.</p>;
  }

  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/45 p-2'>
      <p className='mb-2 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        Milestone Track
      </p>
      <div className='flex flex-wrap gap-1.5'>
        {milestones
          .slice()
          .sort((left, right) => left.threshold - right.threshold)
          .map((milestone) => (
            <div
              key={milestone.id}
              className='min-w-[66px] rounded border border-surface-700/60 bg-surface-900/65 px-1.5 py-1'
            >
              <div className='flex items-center gap-1'>
                <img
                  src={
                    milestone.type === 'gold'
                      ? '/assets/seti/icons/vp.png'
                      : '/assets/seti/icons/dangerThreshold1.png'
                  }
                  alt={`${milestone.type} milestone`}
                  className='h-3.5 w-3.5'
                />
                <span className='font-mono text-[10px] text-text-300'>
                  {milestone.threshold}
                </span>
              </div>
              <p className='mt-0.5 truncate font-mono text-[10px] text-text-500'>
                {milestone.claimedBy ?? 'open'}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
}

export type { IMilestoneItem };
