import { getAvailableMainActions } from '@seti/common/rules';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { Game } from '@/engine/Game.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createTestGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'serializer-seed',
    'game-serializer-test',
  );
  resolveSetupTucks(game);
  return game;
}

describe('GameSerializer', () => {
  it('serializes core state and RNG snapshot', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(dto.gameId).toBe(game.id);
    expect(dto.version).toBe(7);
    expect(dto.seed).toBe(game.seed);
    expect(typeof dto.rngState).toBe('number');
    expect(dto.players).toHaveLength(2);
    expect(dto.mainDeck.drawPile.length + dto.mainDeck.discardPile.length).toBe(
      game.mainDeck.totalSize,
    );
  });

  it('projects hidden information per viewer', () => {
    const game = createTestGame();
    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });

    const p1View = projectGameState(game, 'p1');
    const p2ForP1 = p1View.players.find((player) => player.playerId === 'p2');
    expect(p2ForP1?.hand).toBeUndefined();
    expect(typeof p2ForP1?.handSize).toBe('number');

    const p2View = projectGameState(game, 'p2');
    const p2Self = p2View.players.find((player) => player.playerId === 'p2');
    expect(Array.isArray(p2Self?.hand)).toBe(true);
    expect(p2View.solarSystem.spaces.length).toBeGreaterThan(0);
  });

  it('projects orbit and land as available when a probe is on a planet', () => {
    const game = createTestGame();
    const player = game.players[0];
    const marsSpace = game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0];
    if (!marsSpace || !game.solarSystem) {
      throw new Error('expected Mars space in solar system');
    }

    game.solarSystem.placeProbe(player.id, marsSpace.id);
    player.probesInSpace = 1;

    const publicState = projectGameState(game, player.id);
    const publicPlayer = publicState.players.find((p) => p.playerId === player.id);
    if (!publicPlayer) {
      throw new Error('expected projected player state');
    }

    const actions = getAvailableMainActions(publicPlayer, publicState);
    expect(actions).toContain(EMainAction.ORBIT);
    expect(actions).toContain(EMainAction.LAND);
  });

  it('does not persist redundant planetSpaceId inside planetary board state', () => {
    const game = createTestGame();
    const dto = serializeGame(game, 7);

    expect(
      dto.planetaryBoard?.planets.every(
        (planet) => !('planetSpaceId' in planet.state),
      ),
    ).toBe(true);
  });
});
