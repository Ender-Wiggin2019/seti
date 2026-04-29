import { EAlienType } from '@seti/common/types/protocol/enums';
import { FloodingTheMediaSpaceCard } from '@/engine/cards/alien/FloodingTheMediaSpaceCard.js';
import {
  createAnomaliesGame,
  resolveDeferredInputs,
} from './AnomaliesCardTestHelpers.js';

describe('FloodingTheMediaSpaceCard', () => {
  it('takes up to three cards from the anomalies row and deck', () => {
    const { game, player } = createAnomaliesGame('flooding-media-space');
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!board) throw new Error('expected anomalies board');
    board.faceUpAlienCardId = 'ET.11';
    board.alienDeckDrawPile = ['ET.12', 'ET.13'];

    new FloodingTheMediaSpaceCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(player.hand).toEqual(
      expect.arrayContaining(['ET.11', 'ET.12', 'ET.13']),
    );
  });

  it('stops safely when only the face-up anomalies card is available', () => {
    const { game, player } = createAnomaliesGame('flooding-media-space-empty');
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    if (!board) throw new Error('expected anomalies board');
    board.faceUpAlienCardId = 'ET.11';
    board.alienDeckDrawPile = [];
    board.alienDeckDiscardPile = [];

    new FloodingTheMediaSpaceCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(player.hand).toEqual(expect.arrayContaining(['ET.11']));
  });
});
