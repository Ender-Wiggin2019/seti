import type { IBaseCard } from '@seti/common/types/BaseCard';
import type { ETechId } from '@seti/common/types/tech';
import { useTranslation } from 'react-i18next';
import type {
  IFreeActionRequest,
  IPlayerInputModel,
  IPublicPlayerState,
} from '@/types/re-exports';
import { EFreeAction, EPlayerInputType } from '@/types/re-exports';
import { ComputerView } from './ComputerView';
import { DataPoolView } from './DataPoolView';
import { IncomeTracker } from './IncomeTracker';
import { PieceInventory } from './PieceInventory';
import { ResourceBar } from './ResourceBar';
import { TechDisplay } from './TechDisplay';

interface IPlayerIncomeInfo {
  credit: number;
  energy: number;
}

interface IPlayerDashboardProps {
  player: IPublicPlayerState;
  pendingInput: IPlayerInputModel | null;
  onFreeAction: (action: IFreeActionRequest) => void;
  income?: IPlayerIncomeInfo;
  playedMissions?: IBaseCard[];
  techs?: ETechId[];
}

/**
 * PlayerDashboard — the observation deck at the bottom of the game.
 * Layout: top resource rail, then a player-board substrate with
 * two instrument columns (left: income / computer / inventory;
 * right: data pool / tech / missions+tech counts).
 */
export function PlayerDashboard({
  player,
  pendingInput,
  onFreeAction,
  income,
  playedMissions,
  techs,
}: IPlayerDashboardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const missionCount = playedMissions?.length ?? 0;
  const techCount = techs?.length ?? player.techs.length;
  const cardInputActive = pendingInput?.type === EPlayerInputType.CARD;

  return (
    <section className='space-y-1.5' data-testid='player-dashboard'>
      <ResourceBar player={player} />

      <div className='instrument-panel relative overflow-hidden p-1.5'>
        <div
          className='pointer-events-none absolute inset-0 opacity-50 mix-blend-luminosity'
          style={{
            backgroundImage:
              'linear-gradient(oklch(0.08 0.018 260 / 0.72), oklch(0.08 0.018 260 / 0.72)), url(/assets/seti/boards/playerBoard.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden
        />

        <div className='relative grid min-h-[174px] grid-cols-[1.25fr_0.85fr] gap-1.5'>
          <div className='space-y-1.5'>
            <IncomeTracker
              creditIncome={income?.credit ?? 0}
              energyIncome={income?.energy ?? 0}
            />
            <ComputerView
              computer={player.computer}
              dataPoolCount={player.dataPoolCount}
              onPlaceData={(row) =>
                onFreeAction({
                  type: EFreeAction.PLACE_DATA,
                  slotIndex: row === 'top' ? 0 : 1,
                })
              }
            />
            <PieceInventory pieces={player.pieces} />
          </div>

          <div className='space-y-1.5'>
            <DataPoolView
              count={player.dataPoolCount}
              max={player.dataPoolMax}
            />
            <TechDisplay techs={techs ?? player.techs} />

            <div className='instrument-panel p-2'>
              <div className='section-head mb-1.5'>
                <span aria-hidden className='section-head__tick' />
                <p className='micro-label'>
                  {t('client.player_dashboard.missions')}
                </p>
                <div aria-hidden className='section-head__rule' />
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <img
                    src='/assets/seti/icons/missionSatellite.png'
                    alt=''
                    aria-hidden
                    className='h-4 w-4 opacity-90'
                  />
                  <span className='font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
                    {t('client.player_dashboard.played')}
                  </span>
                </div>
                <span className='readout text-sm font-semibold text-text-100 leading-none'>
                  {missionCount}
                </span>
              </div>
              <div className='mt-1.5 flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <img
                    src='/assets/seti/icons/progress.png'
                    alt=''
                    aria-hidden
                    className='h-4 w-4 opacity-90'
                  />
                  <span className='font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
                    {t('client.player_dashboard.tech')}
                  </span>
                </div>
                <span className='readout text-sm font-semibold text-text-100 leading-none'>
                  {techCount}
                </span>
              </div>
              {cardInputActive ? (
                <div className='mt-2 flex items-center gap-1.5 border-t border-[color:var(--metal-edge-soft)] pt-1.5'>
                  <span
                    aria-hidden
                    className='h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500 shadow-[0_0_6px_oklch(0.68_0.11_240/0.8)] motion-safe:animate-pulse'
                  />
                  <p className='font-mono text-[10px] uppercase tracking-[0.12em] text-accent-400'>
                    {t('client.player_dashboard.card_selection_active')}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
