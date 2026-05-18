import { ARKHOS_EXPLORATION_CARD_IDS } from '@seti/common/data/arkhosCards';
import { useTranslation } from 'react-i18next';
import type { IPublicArkhosBoard } from '@/types/re-exports';
import { TraceColumnGrid } from './AlienBoardTraceGrid';

const ARKHOS_EXPLORATION_IMAGE_SRC_BY_ID = new Map<string, string>(
  ARKHOS_EXPLORATION_CARD_IDS.map((cardId, index) => {
    const assetNumber = (index + 1).toString().padStart(2, '0');
    return [cardId, `/assets/seti/aliens/arkhos/exploration/AI_${assetNumber}.jpg`];
  }),
);

export function ArkhosBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicArkhosBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2' data-testid={`alien-${alienIndex}-arkhos-board`}>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <span className='font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.types.arkhos')}</span>
        <span className='rounded border border-cyan-400/40 bg-cyan-950/30 px-2 py-0.5 font-mono text-[10px] text-cyan-100' data-testid={`alien-${alienIndex}-arkhos-exploration-counts`}>
          {t('client.alien_board.arkhos.exploration_counts', { deck: board.explorationDeckSize, reserve: board.explorationReserveSize, discard: board.explorationDiscardSize })}
        </span>
      </div>
      <div className='grid gap-2 md:grid-cols-2'>
        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.arkhos.security')}</div>
          <div className='space-y-2'>
            {Object.entries(board.securityCardsByPlayer).length === 0 ? (
              <div className='rounded border border-dashed border-surface-700/50 px-2 py-3 font-mono text-[10px] text-text-500'>{t('client.alien_board.arkhos.no_security_cards')}</div>
            ) : (
              Object.entries(board.securityCardsByPlayer).map(([playerId, cards]) => (
                <div key={playerId} className='rounded border border-surface-700/50 bg-surface-950/40 px-2 py-1.5' data-testid={`alien-${alienIndex}-arkhos-security-${playerId}`}>
                  <div className='mb-1 flex items-center gap-1.5'>
                    <span className='h-2.5 w-2.5 shrink-0 rounded-full border border-surface-200/30' style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }} />
                    <span className='truncate font-mono text-[10px] text-text-300'>{playerId}</span>
                  </div>
                  <div className='grid grid-cols-3 gap-1'>
                    {cards.map((card) => (
                      <span key={card.cardId} className='rounded border border-surface-700/60 bg-surface-900/60 px-1.5 py-1 text-center font-mono text-[9px] text-text-300' data-testid={`alien-${alienIndex}-arkhos-security-card-${card.cardId}`} title={`${t(`client.alien_board.arkhos.trace.${card.traceColor}`)} ${t(`client.alien_board.arkhos.zone.${card.zone}`)}`}>
                        {card.cardId}<span className='block uppercase text-text-500'>{t(`client.alien_board.arkhos.zone.${card.zone}`)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.arkhos.access')}</div>
          <div className='space-y-1.5'>
            {Object.entries(board.accessByPlayer).length === 0 ? (
              <div className='rounded border border-dashed border-surface-700/50 px-2 py-3 font-mono text-[10px] text-text-500'>{t('client.alien_board.arkhos.no_access_records')}</div>
            ) : (
              Object.entries(board.accessByPlayer).map(([playerId, access]) => (
                <div key={playerId} className='flex items-center justify-between gap-2 rounded border border-surface-700/50 bg-surface-950/40 px-2 py-1.5' data-testid={`alien-${alienIndex}-arkhos-access-${playerId}`}>
                  <span className='flex min-w-0 items-center gap-1.5'><span className='h-2.5 w-2.5 shrink-0 rounded-full border border-surface-200/30' style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }} /><span className='truncate font-mono text-[10px] text-text-300'>{playerId}</span></span>
                  <span className='font-mono text-[10px] text-text-300'>{t('client.alien_board.arkhos.access_record', { level: access.accessLevel, breached: access.breachedCount })}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      {board.traceSlots.length > 0 ? <div className='mt-3'><TraceColumnGrid alienIndex={alienIndex} area='arkhos-trace' slots={board.traceSlots} playerColors={playerColors} /></div> : null}
      {board.resolvedExplorationRewards.length > 0 ? <ArkhosResolvedRewards alienIndex={alienIndex} rewards={board.resolvedExplorationRewards} /> : null}
    </section>
  );
}

function ArkhosResolvedRewards({
  alienIndex,
  rewards,
}: {
  alienIndex: number;
  rewards: IPublicArkhosBoard['resolvedExplorationRewards'];
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='mt-3 rounded border border-surface-700/50 bg-surface-900/35 p-2' data-testid={`alien-${alienIndex}-arkhos-resolved-rewards`}>
      <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.arkhos.resolved_rewards')}</div>
      <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
        {rewards.map((reward, index) => {
          const imageSrc = ARKHOS_EXPLORATION_IMAGE_SRC_BY_ID.get(reward.cardId);
          const sizeLabel = t(`client.alien_board.arkhos.reward_size.${reward.size}`);
          return (
            <figure key={`${reward.cardId}-${reward.size}-${reward.playerId}-${index}`} className='overflow-hidden rounded border border-surface-700/60 bg-surface-950/45' data-testid={`alien-${alienIndex}-arkhos-reward-${index}`} title={reward.effectId}>
              {imageSrc ? <img src={imageSrc} alt={t('client.alien_board.arkhos.reward_image_alt', { card: reward.cardId, size: sizeLabel, player: reward.playerId })} className='aspect-[490/348] w-full bg-surface-950 object-cover' loading='lazy' /> : null}
              <figcaption className='flex items-center justify-between gap-2 px-2 py-1 font-mono text-[10px] text-text-300'><span className='truncate'>{reward.playerId}</span><span className='shrink-0 uppercase text-text-500'>{sizeLabel}</span></figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
