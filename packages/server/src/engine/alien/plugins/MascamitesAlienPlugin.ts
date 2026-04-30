import {
  getMascamitesSampleToken,
  MASCAMITES_SAMPLE_TOKENS,
  type TMascamitesSampleSourcePlanet,
  type TMascamitesSampleTokenId,
} from '@seti/common/constant/mascamites';
import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { getMascamitesSampleDeliveryDestination } from '@seti/common/utils/mascamitesSampleDelivery';
import { loadCardData } from '@/engine/cards/loadCardData.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  type IMascamitesCapsuleComponent,
  type IMascamitesDeliveredSampleComponent,
  isMascamitesAlienBoard,
  type MascamitesAlienBoard,
} from '../AlienBoard.js';
import { executeSimpleSlotRewards } from '../AlienRewards.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

export class MascamitesAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.MASCAMITES;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = this.getBoard(game);
    if (!board || this.hasInitializedSamples(board)) return undefined;

    const shuffled = game.random.shuffle(
      MASCAMITES_SAMPLE_TOKENS.map((token) => token.id),
    );
    board.samplePools.jupiter = shuffled.slice(0, 3);
    board.samplePools.saturn = shuffled.slice(3, 6);
    board.publicSamples = shuffled.slice(6, 7);
    return undefined;
  }

  public createCollectSampleInput(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    missionCardId?: string,
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (!this.isSampleSourcePlanet(planet)) return onComplete?.();
    const board = this.getBoard(game);
    if (!board) return onComplete?.();

    const samples = board.samplePools[planet];
    if (samples.length === 0) return onComplete?.();

    return new SelectOption(
      player,
      samples.map((sampleTokenId) => ({
        id: `sample:${sampleTokenId}`,
        label: sampleTokenId,
        onSelect: () => {
          this.collectSample(
            player,
            game,
            planet,
            sampleTokenId,
            missionCardId,
          );
          return onComplete?.();
        },
      })),
      `Collect Mascamites sample from ${planet}`,
    );
  }

  public collectSample(
    player: IPlayer,
    game: IGame,
    planet: TMascamitesSampleSourcePlanet,
    sampleTokenId: TMascamitesSampleTokenId,
    missionCardId?: string,
  ): IMascamitesCapsuleComponent {
    const board = this.requireBoard(game);
    const pool = board.samplePools[planet];
    const sampleIndex = pool.indexOf(sampleTokenId);
    if (sampleIndex < 0) {
      throw new Error(`Mascamites sample ${sampleTokenId} is not on ${planet}`);
    }
    pool.splice(sampleIndex, 1);

    const space = game.solarSystem?.getSpacesOnPlanet(planet)[0];
    if (!space) {
      throw new Error(`No solar-system space found for ${planet}`);
    }

    return board.createCapsule({
      ownerId: player.id,
      sampleTokenId,
      sourcePlanet: planet,
      spaceId: space.id,
      missionCardId,
    });
  }

  public deliverSample(
    player: IPlayer,
    game: IGame,
    capsuleId: string,
    cardId: string,
    branchIndex = 0,
  ): PlayerInput | undefined {
    const board = this.requireBoard(game);
    const capsule = this.requireOwnedCapsule(game, player, capsuleId);
    const destination = this.resolveDeliveryDestination(cardId);
    if (!this.isCapsuleAtPlanet(game, capsule, destination)) {
      throw new Error(
        `Capsule ${capsuleId} is not at mission destination ${destination}`,
      );
    }

    const removed = board.removeCapsule(capsuleId);
    if (!removed) {
      throw new Error(`Capsule ${capsuleId} was already delivered`);
    }

    const token = getMascamitesSampleToken(removed.sampleTokenId);
    if (!token) {
      throw new Error(`Unknown Mascamites sample ${removed.sampleTokenId}`);
    }
    executeSimpleSlotRewards(player, game, token.rewards);
    this.addDeliveredSampleBlueSlot(game, {
      sampleTokenId: removed.sampleTokenId,
      deliveredBy: player.id,
      deliveredAtRound: game.round,
    });

    return game.missionTracker.completeMissionBranch(
      player,
      game,
      cardId,
      branchIndex,
    );
  }

  public addDeliveredSampleBlueSlot(
    game: IGame,
    delivered: Omit<IMascamitesDeliveredSampleComponent, 'slotId'> & {
      slotId?: string;
    },
  ) {
    const board = this.requireBoard(game);
    const slotId =
      delivered.slotId ??
      `alien-${board.alienIndex}-mascamites-sample-blue-${board.deliveredSamples.length}`;
    const existing = board.getSlot(slotId);
    if (existing) return existing;

    const token = getMascamitesSampleToken(delivered.sampleTokenId);
    if (!token) {
      throw new Error(`Unknown Mascamites sample ${delivered.sampleTokenId}`);
    }

    const slot = board.addTraceSlot({
      slotId,
      alienIndex: board.alienIndex,
      traceColor: ETrace.BLUE,
      maxOccupants: 1,
      rewards: token.rewards.map((reward) => ({ ...reward })),
      isDiscovery: false,
    });
    board.deliveredSamples.push({
      sampleTokenId: delivered.sampleTokenId,
      deliveredBy: delivered.deliveredBy,
      deliveredAtRound: delivered.deliveredAtRound,
      slotId,
    });
    return slot;
  }

  public getBoard(game: IGame): MascamitesAlienBoard | undefined {
    const board = game.alienState?.getBoardByType(EAlienType.MASCAMITES);
    return isMascamitesAlienBoard(board) ? board : undefined;
  }

  private requireBoard(game: IGame): MascamitesAlienBoard {
    const board = this.getBoard(game);
    if (!board) {
      throw new Error('Mascamites board is not available');
    }
    return board;
  }

  private requireOwnedCapsule(
    game: IGame,
    player: IPlayer,
    capsuleId: string,
  ): IMascamitesCapsuleComponent {
    const capsule = this.requireBoard(game).getCapsule(capsuleId);
    if (!capsule || capsule.ownerId !== player.id) {
      throw new Error(`Mascamites capsule ${capsuleId} is not movable`);
    }
    return capsule;
  }

  private hasInitializedSamples(board: MascamitesAlienBoard): boolean {
    return (
      board.samplePools.jupiter.length > 0 ||
      board.samplePools.saturn.length > 0 ||
      board.publicSamples.length > 0 ||
      board.capsules.length > 0 ||
      board.deliveredSamples.length > 0
    );
  }

  private isSampleSourcePlanet(
    planet: EPlanet,
  ): planet is TMascamitesSampleSourcePlanet {
    return planet === EPlanet.JUPITER || planet === EPlanet.SATURN;
  }

  private isCapsuleAtPlanet(
    game: IGame,
    capsule: IMascamitesCapsuleComponent,
    planet: EPlanet,
  ): boolean {
    const space = game.solarSystem?.spaces.find(
      (candidate) => candidate.id === capsule.spaceId,
    );
    return (
      space?.elements.some(
        (element) =>
          (element.type === ESolarSystemElementType.PLANET ||
            element.type === ESolarSystemElementType.EARTH) &&
          element.planet === planet &&
          element.amount > 0,
      ) ?? false
    );
  }

  private resolveDeliveryDestination(cardId: string): EPlanet {
    const cardData = loadCardData(cardId);
    const destination = getMascamitesSampleDeliveryDestination(cardData);
    if (!destination) {
      throw new Error(
        `Mascamites delivery mission ${cardId} does not define a sample delivery destination`,
      );
    }
    return destination;
  }
}
