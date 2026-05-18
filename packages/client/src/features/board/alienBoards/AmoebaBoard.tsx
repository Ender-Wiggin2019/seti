import { DescRender } from '@seti/cards';
import { AMOEBA_TRACE_SLOTS } from '@seti/common/constant/spaceAgencyAliens';
import { useTranslation } from 'react-i18next';
import type { IPublicAmoebaBoard } from '@/types/re-exports';
import { ETrace } from '@/types/re-exports';
import { TraceColumnGrid } from './AlienBoardTraceGrid';

const TRACE_COLOR: Record<ETrace, string> = {
  [ETrace.RED]: '#e93e27',
  [ETrace.YELLOW]: '#f5c242',
  [ETrace.BLUE]: '#3478d8',
  [ETrace.ANY]: '#6b7280',
};

const AMOEBA_TRACE_COLOR_BY_POSITION = new Map(
  AMOEBA_TRACE_SLOTS.map((slot) => [slot.position, slot.traceColor]),
);

export function AmoebaBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicAmoebaBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2' data-testid={`alien-${alienIndex}-amoeba-board`}>
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.amoeba.organelles')}</div>
      <div className='grid grid-cols-3 gap-1.5'>
        {Array.from({ length: 9 }, (_, position) => {
          const organelle = board.organelles.find((token) => token.position === position);
          const traceColor = AMOEBA_TRACE_COLOR_BY_POSITION.get(position);
          const color = traceColor ? TRACE_COLOR[traceColor] : undefined;
          return (
            <div
              key={position}
              className='flex min-h-12 items-center justify-center rounded border border-surface-700/50 bg-surface-900/35'
              data-trace-color={traceColor}
              data-testid={`alien-${alienIndex}-amoeba-cell-${position}`}
              style={color ? { backgroundColor: `${color}14`, borderColor: `${color}88` } : undefined}
            >
              {organelle ? (
                <span className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-surface-500/60 bg-surface-950/70' data-testid={`alien-${alienIndex}-amoeba-organelle-${position}`} title={organelle.tokenId}>
                  <DescRender desc={`{${organelle.color}-1}`} size='xs' smartSize />
                </span>
              ) : (
                <span className='font-mono text-[10px] text-text-600'>{position}</span>
              )}
            </div>
          );
        })}
      </div>
      {board.traceSlots.length > 0 ? (
        <div className='mt-3'>
          <TraceColumnGrid alienIndex={alienIndex} area='amoeba-trace' slots={board.traceSlots} playerColors={playerColors} />
        </div>
      ) : null}
    </section>
  );
}
