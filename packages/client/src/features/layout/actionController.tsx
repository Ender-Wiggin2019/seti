import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useGameContext } from '@/pages/game/GameContext';
import { useGameViewStore } from '@/stores/gameViewStore';
import { EFreeAction, EPhase } from '@/types/re-exports';
import {
  BuyCardDialog,
  ConvertEnergyDialog,
  ExchangeResourcesDialog,
  PlaceDataDialog,
  SampleDeliveryDialog,
} from './dialogs';
import { useGameSession } from './GameSessionContext';
import {
  buildPlaceDataOptions,
  buildSampleDeliveryOptions,
} from './sessionHelpers';

/**
 * useActionController — orchestrates the free-action dialogs that span
 * sections (BUY_CARD, EXCHANGE, PLACE_DATA, CONVERT_ENERGY, DELIVER_SAMPLE)
 * plus the cross-section flags (cornerSelectionMode, movementMode,
 * armedCardRowBuy). Lives outside any single section adapter so the
 * ActionBar can dispatch from anywhere.
 */
export interface IActionControllerHandle {
  handleFreeActionClick: (
    action: EFreeAction,
    organizationId?: EOrganizationId,
  ) => void;
  dialogs: React.JSX.Element;
}

export function useActionController(): IActionControllerHandle {
  const { t } = useTranslation('common');
  const { gameState, myPlayerId, sendFreeAction } = useGameContext();
  const setActiveTab = useGameViewStore((s) => s.setActiveTab);
  const {
    setCornerSelectionMode,
    setArmedCardRowBuy,
    setMovementModeActive,
    focusSection,
  } = useGameSession();

  const [buyCardOpen, setBuyCardOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [placeDataOpen, setPlaceDataOpen] = useState(false);
  const [convertEnergyOpen, setConvertEnergyOpen] = useState(false);
  const [deliverSampleOpen, setDeliverSampleOpen] = useState(false);

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const missionCards =
    (myPlayer as { playedMissions?: IBaseCard[] } | undefined)
      ?.playedMissions ?? [];
  const completableMissionBranches = myPlayer?.completableMissionBranches ?? [];
  const sampleDeliveryOptions = buildSampleDeliveryOptions(
    gameState,
    myPlayerId,
  );
  const placeDataOptions = buildPlaceDataOptions(myPlayer);
  const maxConvertibleEnergy = myPlayer?.resources?.[EResource.ENERGY] ?? 0;

  const armCardRowBuy = (): void => {
    setArmedCardRowBuy(true);
    setActiveTab('cards');
    focusSection('cardRows');
  };

  const armMoveMode = (): void => {
    setMovementModeActive(true);
    setActiveTab('board');
    focusSection('solarSystem');
  };

  const handleFreeActionClick = (
    action: EFreeAction,
    organizationId?: EOrganizationId,
  ): void => {
    switch (action) {
      case EFreeAction.BUY_CARD:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        setArmedCardRowBuy(false);
        setBuyCardOpen(true);
        return;
      case EFreeAction.PLACE_DATA:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        if (placeDataOptions.length <= 0) {
          toast({
            title: t('client.game_layout.toast.no_computer_slot'),
            description: t('client.game_layout.toast.no_computer_slot_desc'),
            variant: 'warning',
          });
          return;
        }
        setPlaceDataOpen(true);
        return;
      case EFreeAction.COMPLETE_MISSION:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        if (completableMissionBranches.length === 1) {
          const [branch] = completableMissionBranches;
          sendFreeAction({
            type: EFreeAction.COMPLETE_MISSION,
            cardId: branch.cardId,
            branchIndex: branch.branchIndex,
          });
          return;
        }
        if (missionCards.length === 1) {
          sendFreeAction({
            type: EFreeAction.COMPLETE_MISSION,
            cardId: missionCards[0].id,
          });
          return;
        }
        toast({
          title: t('client.game_layout.toast.mission_required'),
          description: t('client.game_layout.toast.mission_required_desc'),
          variant: 'warning',
        });
        return;
      case EFreeAction.DELIVER_SAMPLE:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        if (sampleDeliveryOptions.length === 1) {
          const option = sampleDeliveryOptions[0];
          sendFreeAction({
            type: EFreeAction.DELIVER_SAMPLE,
            capsuleId: option.capsuleId,
            cardId: option.cardId,
          });
          return;
        }
        if (sampleDeliveryOptions.length > 1) {
          setDeliverSampleOpen(true);
          return;
        }
        toast({
          title: t('client.game_layout.toast.sample_delivery_required'),
          description: t(
            'client.game_layout.toast.sample_delivery_required_desc',
          ),
          variant: 'warning',
        });
        return;
      case EFreeAction.USE_CARD_CORNER:
        setMovementModeActive(false);
        if (!myPlayer?.hand?.length) return;
        if (myPlayer.hand.length === 1 && myPlayer.hand[0]?.id) {
          setCornerSelectionMode(false);
          sendFreeAction({
            type: EFreeAction.USE_CARD_CORNER,
            cardId: myPlayer.hand[0].id,
          });
          return;
        }
        setCornerSelectionMode(true);
        toast({
          title: t('client.game_layout.toast.card_required'),
          description: t('client.game_layout.toast.card_required_desc'),
        });
        return;
      case EFreeAction.MOVEMENT:
        setCornerSelectionMode(false);
        setArmedCardRowBuy(false);
        armMoveMode();
        toast({
          title: t('client.game_layout.toast.select_probe'),
          description: t('client.game_layout.toast.select_probe_desc'),
        });
        return;
      case EFreeAction.EXCHANGE_RESOURCES:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        setExchangeOpen(true);
        return;
      case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        if (maxConvertibleEnergy <= 0) {
          toast({
            title: t('client.game_layout.toast.not_enough_energy'),
            description: t('client.game_layout.toast.not_enough_energy_desc'),
            variant: 'warning',
          });
          return;
        }
        setConvertEnergyOpen(true);
        return;
      case EFreeAction.SPEND_SIGNAL_TOKEN:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        setArmedCardRowBuy(false);
        sendFreeAction({ type: EFreeAction.SPEND_SIGNAL_TOKEN });
        return;
      case EFreeAction.USE_ORGANIZATION_POWER:
        setCornerSelectionMode(false);
        setMovementModeActive(false);
        setArmedCardRowBuy(false);
        if (!organizationId) return;
        if (organizationId === EOrganizationId.ORBITAL_DYNAMICS) {
          setActiveTab('board');
          focusSection('solarSystem');
        }
        sendFreeAction({
          type: EFreeAction.USE_ORGANIZATION_POWER,
          organizationId,
        });
        return;
      default:
        return;
    }
  };

  const dialogs = (
    <>
      <BuyCardDialog
        open={buyCardOpen}
        onCancel={() => setBuyCardOpen(false)}
        onBuyFromRow={() => {
          setBuyCardOpen(false);
          armCardRowBuy();
        }}
        onBuyFromDeck={() => {
          sendFreeAction({ type: EFreeAction.BUY_CARD, fromDeck: true });
          setBuyCardOpen(false);
        }}
      />
      <ExchangeResourcesDialog
        open={exchangeOpen}
        player={myPlayer}
        onCancel={() => setExchangeOpen(false)}
        onConfirm={(from, to, cardPick) => {
          sendFreeAction({
            type: EFreeAction.EXCHANGE_RESOURCES,
            from,
            to,
            ...(from === EResource.CARD && cardPick?.spentCardIds
              ? { spentCardIds: cardPick.spentCardIds }
              : {}),
            ...(to === EResource.CARD && cardPick
              ? { fromDeck: cardPick.fromDeck }
              : {}),
          });
          setExchangeOpen(false);
        }}
      />
      <PlaceDataDialog
        open={placeDataOpen}
        options={placeDataOptions}
        onCancel={() => setPlaceDataOpen(false)}
        onConfirm={(slotIndex) => {
          sendFreeAction({ type: EFreeAction.PLACE_DATA, slotIndex });
          setPlaceDataOpen(false);
        }}
      />
      <SampleDeliveryDialog
        open={deliverSampleOpen}
        options={sampleDeliveryOptions}
        onCancel={() => setDeliverSampleOpen(false)}
        onConfirm={(option) => {
          sendFreeAction({
            type: EFreeAction.DELIVER_SAMPLE,
            capsuleId: option.capsuleId,
            cardId: option.cardId,
          });
          setDeliverSampleOpen(false);
        }}
      />
      <ConvertEnergyDialog
        open={convertEnergyOpen}
        maxAmount={maxConvertibleEnergy}
        onCancel={() => setConvertEnergyOpen(false)}
        onConfirm={(amount) => {
          sendFreeAction({
            type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
            amount,
          });
          setConvertEnergyOpen(false);
        }}
      />
    </>
  );

  return { handleFreeActionClick, dialogs };
}

/**
 * Auto-resets armed flags when the player's turn / phase / pending input
 * changes. Mirrors the legacy GameLayout effects but reads from the shared
 * session context.
 */
export function useArmedFlagAutoReset(): void {
  const { gameState, isMyTurn, pendingInput, myPlayerId } = useGameContext();
  const {
    movementModeActive,
    setMovementModeActive,
    playCardSelectionMode,
    setPlayCardSelectionMode,
  } = useGameSession();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const movementPoints = myPlayer?.movementPoints ?? 0;

  useEffect(() => {
    if (!playCardSelectionMode) return;
    if (
      !isMyTurn ||
      pendingInput !== null ||
      gameState?.phase !== EPhase.AWAIT_MAIN_ACTION
    ) {
      setPlayCardSelectionMode(false);
    }
  }, [
    gameState?.phase,
    isMyTurn,
    pendingInput,
    playCardSelectionMode,
    setPlayCardSelectionMode,
  ]);

  useEffect(() => {
    if (!movementModeActive) return;
    if (
      !isMyTurn ||
      pendingInput !== null ||
      (gameState?.phase !== EPhase.AWAIT_MAIN_ACTION &&
        gameState?.phase !== EPhase.AWAIT_END_TURN) ||
      movementPoints <= 0
    ) {
      setMovementModeActive(false);
    }
  }, [
    gameState?.phase,
    isMyTurn,
    movementModeActive,
    movementPoints,
    pendingInput,
    setMovementModeActive,
  ]);
}
