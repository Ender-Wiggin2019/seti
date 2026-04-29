import { EMainAction } from '@seti/common/types/protocol/enums';
import { findSectorById } from '@/engine/effects/scan/ScanEffectUtils.js';
import { Game } from '@/engine/Game.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGameWithProbe(seed: string): Game {
  const game = Game.create(PLAYERS, { playerCount: 2 }, seed);
  resolveSetupTucks(game);
  const player = game.players[0];
  const solarSystem = game.solarSystem;
  if (!solarSystem) throw new Error('expected solar system');
  const probeSpace = solarSystem.spaces.find(
    (space) =>
      space.ringIndex > 0 &&
      solarSystem.getSectorIndexOfSpace(space.id) !== null,
  );
  if (!probeSpace) throw new Error('expected probe space');
  solarSystem.placeProbe(player.id, probeSpace.id);
  player.probesInSpace = 1;
  player.hand = ['120'];
  player.resources.gain({ credits: 10 });
  return game;
}

function getProbeSector(game: Game) {
  const solarSystem = game.solarSystem;
  if (!solarSystem) throw new Error('expected solar system');
  const probeSpace = solarSystem.spaces.find((space) =>
    space.occupants.some((occupant) => occupant.playerId === 'p1'),
  );
  if (!probeSpace) throw new Error('expected player probe');
  const sectorIndex = solarSystem.getSectorIndexOfSpace(probeSpace.id);
  if (sectorIndex === null) throw new Error('expected probe sector index');
  const sector = game.sectors[sectorIndex];
  return findSectorById(game, sector.id) ?? sector;
}

describe('OrbitingLagrangePointCard (card 120)', () => {
  it('marks a signal in a probe sector and returns to hand when it is the only own signal there', () => {
    const game = createGameWithProbe('orbiting-lagrange-return');
    const player = game.players[0];
    const sector = getProbeSector(game);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(sector.getPlayerMarkerCount(player.id)).toBe(1);
    expect(player.hand).toEqual(['120']);
    expect(game.mainDeck.getDiscardPile()).not.toContain('120');
  });

  it('stays discarded when the selected sector already had one own signal', () => {
    const game = createGameWithProbe('orbiting-lagrange-discard');
    const player = game.players[0];
    const sector = getProbeSector(game);
    sector.markSignal(player.id);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(sector.getPlayerMarkerCount(player.id)).toBe(2);
    expect(player.hand).toEqual([]);
    expect(game.mainDeck.getDiscardPile()).toContain('120');
  });
});
