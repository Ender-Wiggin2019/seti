import { getAvailableMainActions } from '@seti/common/rules';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useTranslation } from 'react-i18next';
import {
  type IPlayedMissionRow,
  PlayedMissions,
  PlayerDashboard,
} from '@/features/player';
import { RivalPanel } from '@/features/solo';
import { useGameContext } from '@/pages/game/GameContext';
import { EPhase } from '@/types/re-exports';
import { useGameSession } from '../GameSessionContext';
import type { ISectionRenderProps } from '../sectionRegistry';
import {
  buildPendingCentaurianRows,
  findOumuamuaTile,
} from '../sessionHelpers';

/**
 * PlayerBoardSection — owns the player dashboard, mission slot, and rival
 * panel. It avoids its own scroll container so SectionFrame / shell panels
 * control layout consistently.
 */
export function PlayerBoardSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { t } = useTranslation('common');
  const {
    gameState,
    myPlayerId,
    isMyTurn,
    pendingInput,
    sendAction,
    sendFreeAction,
  } = useGameContext();
  const { inspectCard } = useGameSession();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const extendedPlayer = myPlayer as
    | (typeof myPlayer & {
        creditIncome?: number;
        energyIncome?: number;
        cardIncome?: number;
        tuckedCreditIncome?: number;
        tuckedEnergyIncome?: number;
        tuckedCardIncome?: number;
        playedMissions?: IBaseCard[];
        endGameCards?: IBaseCard[];
        completedMissions?: IBaseCard[];
        missionClaims?: Array<{ cardId: string; branchClaims: boolean[] }>;
      })
    | undefined;

  const missionCards = [
    ...(extendedPlayer?.playedMissions ?? []),
    ...(extendedPlayer?.endGameCards ?? []),
  ];
  const completedMissions = extendedPlayer?.completedMissions ?? [];
  const branchClaimsByCardId: Record<string, boolean[]> = Object.fromEntries(
    (extendedPlayer?.missionClaims ?? []).map((entry) => [
      entry.cardId,
      entry.branchClaims,
    ]),
  );
  const missionRows: IPlayedMissionRow[] = [
    ...missionCards.map((card) => {
      const claims = branchClaimsByCardId[card.id];
      const annotation =
        claims && claims.length > 1 && claims.some((c) => c)
          ? {
              label: `${claims.filter((c) => c).length} / ${claims.length} claimed`,
              tone: 'pending' as const,
            }
          : undefined;
      return annotation ? { card, annotation } : { card };
    }),
    ...buildPendingCentaurianRows(
      gameState?.aliens,
      myPlayerId,
      myPlayer?.score ?? 0,
    ),
  ];

  const personalOumuamuaTile = findOumuamuaTile(gameState?.aliens);
  const playerBoardAvailableMainActions =
    gameState &&
    myPlayer &&
    isMyTurn &&
    pendingInput === null &&
    gameState.phase === EPhase.AWAIT_MAIN_ACTION
      ? getAvailableMainActions(myPlayer, gameState)
      : [];
  const isSyntheticRivalView =
    gameState?.rival?.rivalPlayerId !== undefined &&
    myPlayerId === gameState.rival.rivalPlayerId;

  if (!gameState) return <></>;

  return (
    <div className='flex flex-col gap-3'>
      <section data-testid='bottom-dashboard'>
        <div className='section-head mb-2'>
          <span aria-hidden className='section-head__tick' />
          <p className='micro-label'>
            {t('client.game_layout.personal_board')}
          </p>
          <div aria-hidden className='section-head__rule' />
        </div>
        {myPlayer ? (
          <PlayerDashboard
            player={myPlayer}
            pendingInput={pendingInput}
            onFreeAction={sendFreeAction}
            onMainAction={sendAction}
            availableMainActions={playerBoardAvailableMainActions}
            income={{
              credit: extendedPlayer?.creditIncome ?? 0,
              energy: extendedPlayer?.energyIncome ?? 0,
              card: extendedPlayer?.cardIncome ?? 0,
              tuckedCredit: extendedPlayer?.tuckedCreditIncome,
              tuckedEnergy: extendedPlayer?.tuckedEnergyIncome,
              tuckedCard: extendedPlayer?.tuckedCardIncome,
            }}
            playedMissions={missionCards}
            showExofossils={personalOumuamuaTile !== null}
          />
        ) : null}
      </section>

      {gameState.isSoloMode && gameState.rival ? (
        <section data-testid='rival-area'>
          <div className='section-head mb-2'>
            <span aria-hidden className='section-head__tick' />
            <p className='micro-label'>
              {t('client.game_layout.rival_board', {
                defaultValue: 'Rival Board',
              })}
            </p>
            <div aria-hidden className='section-head__rule' />
          </div>
          <RivalPanel rival={gameState.rival} />
        </section>
      ) : null}

      {!isSyntheticRivalView ? (
        <section data-testid='mission-area'>
          <div className='section-head mb-2'>
            <span aria-hidden className='section-head__tick' />
            <p className='micro-label'>
              {t('client.game_layout.mission_area')}
            </p>
            <div aria-hidden className='section-head__rule' />
          </div>
          <PlayedMissions
            missions={missionRows}
            onCardInspect={inspectCard}
            completedCards={completedMissions}
            branchClaimsByCardId={branchClaimsByCardId}
            ownerPlayerColor={myPlayer?.color}
          />
        </section>
      ) : null}
    </div>
  );
}
