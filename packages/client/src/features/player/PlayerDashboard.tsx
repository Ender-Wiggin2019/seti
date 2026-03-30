import type { IBaseCard } from '@seti/common/types/BaseCard';
import type { ETechId } from '@seti/common/types/tech';
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

export function PlayerDashboard({
  player,
  pendingInput,
  onFreeAction,
  income,
  playedMissions,
  techs,
}: IPlayerDashboardProps): React.JSX.Element {
  const missionCount = playedMissions?.length ?? 0;
  const techCount = techs?.length ?? player.techs.length;
  const cardInputActive = pendingInput?.type === EPlayerInputType.CARD;

  return (
    <section className='space-y-1.5' data-testid='player-dashboard'>
      <ResourceBar player={player} />

      <div className='relative overflow-hidden rounded-md border border-surface-700/50 bg-surface-950/60 p-1.5'>
        <div
          className='absolute inset-0 opacity-65'
          style={{
            backgroundImage:
              'linear-gradient(rgba(8, 13, 25, 0.68), rgba(8, 13, 25, 0.68)), url(/assets/seti/boards/playerBoard.png)',
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

            <div className='rounded border border-surface-700/55 bg-surface-950/65 p-2'>
              <p className='font-mono text-[10px] uppercase tracking-wide text-text-500'>
                Missions
              </p>
              <div className='mt-1 flex items-center justify-between text-xs'>
                <div className='flex items-center gap-1'>
                  <img
                    src='/assets/seti/icons/missionSatellite.png'
                    alt='Mission'
                    className='h-4 w-4'
                  />
                  <span className='text-text-300'>Played</span>
                </div>
                <span className='font-mono font-bold text-text-100'>
                  {missionCount}
                </span>
              </div>
              <div className='mt-1 flex items-center justify-between text-xs'>
                <div className='flex items-center gap-1'>
                  <img
                    src='/assets/seti/icons/progress.png'
                    alt='Tech count'
                    className='h-4 w-4'
                  />
                  <span className='text-text-300'>Tech</span>
                </div>
                <span className='font-mono font-bold text-text-100'>
                  {techCount}
                </span>
              </div>
              {cardInputActive ? (
                <p className='mt-1 text-[10px] uppercase tracking-wide text-accent-300'>
                  Card selection active
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
