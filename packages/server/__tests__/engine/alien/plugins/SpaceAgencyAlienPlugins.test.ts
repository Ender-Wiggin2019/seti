import { AMOEBA_ALIEN_CARD_IDS } from '@seti/common/constant/spaceAgencyAliens';
import { EAlienIcon, ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { PlayCardAction } from '@/engine/actions/PlayCard.js';
import {
  isAmoebaAlienBoard,
  isArkhosAlienBoard,
  isGlyphidsAlienBoard,
} from '@/engine/alien/AlienBoard.js';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { AlienState } from '@/engine/alien/AlienState.js';
import { FreeActionCornerFreeAction } from '@/engine/freeActions/FreeActionCorner.js';
import { Game } from '@/engine/Game.js';
import { resolveSetupTucks } from '../../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame(seed: string): Game {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  return game;
}

describe('Space Agency alien plugins', () => {
  it('registers Glyphids, Amoeba, and Arkhos plugins', () => {
    expect(AlienRegistry.has(EAlienType.GLYPHIDS)).toBe(true);
    expect(AlienRegistry.has(EAlienType.AMOEBA)).toBe(true);
    expect(AlienRegistry.has(EAlienType.ARKHOS)).toBe(true);
  });

  it('injects Glyphids and Amoeba Space Agency alien cards into their alien decks', () => {
    const game = createGame('sa-alien-decks');
    game.alienState = AlienState.createFromHiddenAliens([
      EAlienType.GLYPHIDS,
      EAlienType.AMOEBA,
    ]);
    const glyphids = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    const amoeba = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!glyphids || !amoeba) {
      throw new Error('expected SA alien boards');
    }

    game.alienState.discoverAlien(glyphids, game);
    game.alienState.discoverAlien(amoeba, game);

    expect(
      [...glyphids.alienDeckDrawPile, glyphids.faceUpAlienCardId].sort(),
    ).toEqual(
      Array.from({ length: 10 }, (_, index) => `SA.ET.${index + 1}`).sort(),
    );
    expect(
      [...amoeba.alienDeckDrawPile, amoeba.faceUpAlienCardId].sort(),
    ).toEqual(
      Array.from({ length: 10 }, (_, index) => `SA.ET.${index + 11}`).sort(),
    );
    expect(isGlyphidsAlienBoard(glyphids)).toBe(true);
    expect(isAmoebaAlienBoard(amoeba)).toBe(true);
  });

  it('shuffles Glyphids token bank and deals board tokens on discovery', () => {
    const game = createGame('sa-glyphids-token-bank-shuffle');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    game.random.shuffle = <TItem>(items: readonly TItem[]): TItem[] =>
      [...items].reverse();

    game.alienState.discoverAlien(board, game);

    expect(board.boardTokens).toEqual([
      { position: 0, glyph: EAlienIcon.GLYPH_PURPLE },
      { position: 3, glyph: EAlienIcon.GLYPH_PURPLE },
      { position: 4, glyph: EAlienIcon.GLYPH_PURPLE },
      { position: 7, glyph: EAlienIcon.GLYPH_PURPLE },
      { position: 8, glyph: EAlienIcon.GLYPH_PURPLE },
      { position: 11, glyph: EAlienIcon.GLYPH_BLUE },
    ]);
    expect(board.glyphTokenBank).toHaveLength(29);
    expect(board.glyphTokenBank.slice(0, 4)).toEqual([
      EAlienIcon.GLYPH_BLUE,
      EAlienIcon.GLYPH_BLUE,
      EAlienIcon.GLYPH_BLUE,
      EAlienIcon.GLYPH_BLUE,
    ]);
    expect(board.glyphTokenBank.slice(-5)).toEqual([
      EAlienIcon.GLYPH_GRAY,
      EAlienIcon.GLYPH_GRAY,
      EAlienIcon.GLYPH_GRAY,
      EAlienIcon.GLYPH_GRAY,
      EAlienIcon.GLYPH_GRAY,
    ]);
  });

  it('initializes Glyphids translation tables with randomized sides on discovery', () => {
    const game = createGame('sa-glyphids-translation-sides');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    game.random.shuffle = <TItem>(items: readonly TItem[]): TItem[] => [
      ...items,
    ];
    const nextValues = [0.1, 0.9];
    game.random.next = (): number => nextValues.shift() ?? 0.1;

    game.alienState.discoverAlien(board, game);

    expect(board.translationRows).toEqual([
      {
        rowId: 'glyphids-translation-level-1',
        level: 1,
        side: 1,
        glyphs: [null, null, null, null],
      },
      {
        rowId: 'glyphids-translation-level-2',
        level: 2,
        side: 2,
        glyphs: [null, null, null],
      },
    ]);
  });

  it('enforces Glyphids translation placement constraints', () => {
    const game = createGame('sa-glyphids-translation-placement');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    game.alienState.discoverAlien(board, game);

    expect(board.placeGlyphOnTranslationTable(2, 0, EAlienIcon.GLYPH_RED)).toBe(
      false,
    );
    expect(board.placeGlyphOnTranslationTable(1, 0, EAlienIcon.GLYPH_RED)).toBe(
      true,
    );
    expect(
      board.placeGlyphOnTranslationTable(1, 1, EAlienIcon.GLYPH_BLUE),
    ).toBe(true);
    expect(
      board.placeGlyphOnTranslationTable(2, 0, EAlienIcon.GLYPH_GREEN),
    ).toBe(true);
    expect(
      board.placeGlyphOnTranslationTable(1, 2, EAlienIcon.GLYPH_GREEN),
    ).toBe(false);
    expect(
      board.placeGlyphOnTranslationTable(2, 0, EAlienIcon.GLYPH_YELLOW),
    ).toBe(false);

    expect(board.translationRows.map((row) => row.glyphs)).toEqual([
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE, null, null],
      [EAlienIcon.GLYPH_GREEN, null, null],
    ]);
  });

  it('looks up translated Glyphids by glyph', () => {
    const game = createGame('sa-glyphids-translated-glyph-lookup');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    board.resetTranslationRows([2, 1]);

    expect(board.getTranslatedGlyph(EAlienIcon.GLYPH_RED)).toBeUndefined();
    expect(board.placeGlyphOnTranslationTable(1, 0, EAlienIcon.GLYPH_RED)).toBe(
      true,
    );
    expect(
      board.placeGlyphOnTranslationTable(1, 1, EAlienIcon.GLYPH_BLUE),
    ).toBe(true);
    expect(
      board.placeGlyphOnTranslationTable(2, 0, EAlienIcon.GLYPH_GREEN),
    ).toBe(true);

    expect(board.getTranslatedGlyph(EAlienIcon.GLYPH_RED)).toEqual({
      glyph: EAlienIcon.GLYPH_RED,
      level: 1,
      position: 0,
      rewardColumnIndex: 1,
      rewardRowIndex: 1,
      side: 2,
    });
    expect(board.getTranslatedGlyph(EAlienIcon.GLYPH_GREEN)).toEqual({
      glyph: EAlienIcon.GLYPH_GREEN,
      level: 2,
      position: 0,
      rewardColumnIndex: 1,
      rewardRowIndex: 2,
      side: 1,
    });
  });

  it('places rival Glyphids tokens on the translation table before collecting fallback rows', () => {
    const game = createGame('sa-glyphids-rival-translation-left');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    game.alienState.discoverAlien(board, game);
    expect(board.placeGlyphOnTranslationTable(1, 0, EAlienIcon.GLYPH_RED)).toBe(
      true,
    );
    expect(
      board.placeGlyphOnTranslationTable(1, 1, EAlienIcon.GLYPH_BLUE),
    ).toBe(true);

    expect(
      board.gainRivalGlyphToken(
        'rival:glyphids',
        EAlienIcon.GLYPH_GREEN,
        'left',
      ),
    ).toBe('translated');
    expect(board.glyphRows['rival:glyphids']).toBeUndefined();
    expect(board.translationRows.map((row) => row.glyphs)).toEqual([
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE, null, null],
      [EAlienIcon.GLYPH_GREEN, null, null],
    ]);

    expect(
      board.gainRivalGlyphToken(
        'rival:glyphids',
        EAlienIcon.GLYPH_GREEN,
        'left',
      ),
    ).toBe('collected');
    expect(board.glyphRows['rival:glyphids']).toEqual([
      [EAlienIcon.GLYPH_GREEN],
    ]);
  });

  it('uses rival direction when choosing Glyphids translation positions', () => {
    const game = createGame('sa-glyphids-rival-translation-right');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    game.alienState.discoverAlien(board, game);
    expect(
      board.placeGlyphOnTranslationTable(1, 2, EAlienIcon.GLYPH_GRAY),
    ).toBe(true);
    expect(
      board.placeGlyphOnTranslationTable(1, 3, EAlienIcon.GLYPH_ORANGE),
    ).toBe(true);

    expect(
      board.gainRivalGlyphToken(
        'rival:glyphids',
        EAlienIcon.GLYPH_YELLOW,
        'right',
      ),
    ).toBe('translated');

    expect(board.translationRows.map((row) => row.glyphs)).toEqual([
      [null, null, EAlienIcon.GLYPH_GRAY, EAlienIcon.GLYPH_ORANGE],
      [null, null, EAlienIcon.GLYPH_YELLOW],
    ]);
  });

  it('claims a Glyphids board token into human scoring rows', () => {
    const game = createGame('sa-glyphids-board-token-human-claim');
    const [player] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    board.boardTokens = [{ position: 0, glyph: EAlienIcon.GLYPH_RED }];

    expect(board.claimBoardToken(player.id, 0)).toBe(EAlienIcon.GLYPH_RED);
    expect(board.boardTokens).toEqual([]);
    expect(board.glyphRows[player.id]).toEqual([[EAlienIcon.GLYPH_RED]]);
    expect(board.claimBoardToken(player.id, 0)).toBeUndefined();
  });

  it('claims a Glyphids board token through rival translation placement', () => {
    const game = createGame('sa-glyphids-board-token-rival-claim');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    board.boardTokens = [{ position: 0, glyph: EAlienIcon.GLYPH_GREEN }];
    expect(board.placeGlyphOnTranslationTable(1, 0, EAlienIcon.GLYPH_RED)).toBe(
      true,
    );
    expect(
      board.placeGlyphOnTranslationTable(1, 1, EAlienIcon.GLYPH_BLUE),
    ).toBe(true);

    expect(
      board.claimBoardToken('rival:glyphids', 0, { rivalDirection: 'left' }),
    ).toBe(EAlienIcon.GLYPH_GREEN);

    expect(board.boardTokens).toEqual([]);
    expect(board.glyphRows['rival:glyphids']).toBeUndefined();
    expect(board.translationRows.map((row) => row.glyphs)).toEqual([
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE, null, null],
      [EAlienIcon.GLYPH_GREEN, null, null],
    ]);
  });

  it('ignores empty Glyphids board-token positions', () => {
    const game = createGame('sa-glyphids-board-token-empty-claim');
    const [player] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }
    board.boardTokens = [];

    expect(board.claimBoardToken(player.id, 0)).toBeUndefined();
    expect(board.glyphRows[player.id]).toBeUndefined();
  });

  it('collects human Glyphids tokens into the first row without that glyph', () => {
    const game = createGame('sa-glyphids-human-rows');
    const [player] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.GLYPHIDS]);
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) {
      throw new Error('expected Glyphids board');
    }

    expect(board.collectGlyphToken(player.id, EAlienIcon.GLYPH_RED)).toBe(0);
    expect(board.collectGlyphToken(player.id, EAlienIcon.GLYPH_BLUE)).toBe(0);
    expect(board.collectGlyphToken(player.id, EAlienIcon.GLYPH_RED)).toBe(1);

    expect(board.glyphRows[player.id]).toEqual([
      [EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE],
      [EAlienIcon.GLYPH_RED],
    ]);
  });

  it('shuffles Amoeba organelle token assignment on discovery while preserving marked positions', () => {
    const game = createGame('sa-amoeba-organelle-shuffle');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }
    game.random.shuffle = <TItem>(items: readonly TItem[]): TItem[] =>
      [...items].reverse();

    game.alienState.discoverAlien(board, game);

    expect(board.organelles.map((token) => token.position)).toEqual([
      8, 4, 5, 2, 3,
    ]);
    expect(board.organelles.map((token) => token.color)).toEqual([
      EAlienIcon.ORGANELLE_YELLOW,
      EAlienIcon.ORGANELLE_RED,
      EAlienIcon.ORGANELLE_BLUE,
      EAlienIcon.ORGANELLE_YELLOW,
      EAlienIcon.ORGANELLE_RED,
    ]);
  });

  it('deals Amoeba discovery cards once per marked discovery space', () => {
    const game = createGame('sa-amoeba-discovery-cards');
    const [firstPlayer, secondPlayer] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }

    const discoverySlots = board.getDiscoverySlots();
    board.placeTrace(
      discoverySlots[0],
      { playerId: firstPlayer.id },
      discoverySlots[0].traceColor,
    );
    board.placeTrace(
      discoverySlots[1],
      { playerId: firstPlayer.id },
      discoverySlots[1].traceColor,
    );
    board.placeTrace(
      discoverySlots[2],
      { playerId: secondPlayer.id },
      discoverySlots[2].traceColor,
    );

    game.alienState.discoverAlien(board, game);

    expect(
      firstPlayer.hand.filter(
        (cardId): cardId is string =>
          typeof cardId === 'string' && AMOEBA_ALIEN_CARD_IDS.includes(cardId),
      ),
    ).toHaveLength(2);
    expect(
      secondPlayer.hand.filter(
        (cardId): cardId is string =>
          typeof cardId === 'string' && AMOEBA_ALIEN_CARD_IDS.includes(cardId),
      ),
    ).toHaveLength(1);
  });

  it('reports Amoeba organelles in activation order for a trace-color section', () => {
    const game = createGame('sa-amoeba-organelle-section-order');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }
    board.organelles = [
      {
        tokenId: 'blue-high',
        color: EAlienIcon.ORGANELLE_BLUE,
        position: 8,
      },
      {
        tokenId: 'yellow-other',
        color: EAlienIcon.ORGANELLE_YELLOW,
        position: 4,
      },
      {
        tokenId: 'blue-low',
        color: EAlienIcon.ORGANELLE_BLUE,
        position: 0,
      },
      {
        tokenId: 'red-other',
        color: EAlienIcon.ORGANELLE_RED,
        position: 7,
      },
      {
        tokenId: 'blue-mid',
        color: EAlienIcon.ORGANELLE_BLUE,
        position: 1,
      },
    ];

    expect(
      board.getOrganellesInSection(ETrace.BLUE).map((token) => token.tokenId),
    ).toEqual(['blue-high', 'blue-mid', 'blue-low']);
    expect(board.countOrganellesInSection(ETrace.BLUE)).toBe(3);
    expect(board.countOrganellesInSection(ETrace.YELLOW)).toBe(1);
  });

  it('moves one Amoeba organelle by token id and skips occupied positions', () => {
    const game = createGame('sa-amoeba-single-organelle-move');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }
    board.organelles = [
      {
        tokenId: 'moving',
        color: EAlienIcon.ORGANELLE_YELLOW,
        position: 5,
      },
      {
        tokenId: 'blocker-0',
        color: EAlienIcon.ORGANELLE_RED,
        position: 0,
      },
      {
        tokenId: 'blocker-1',
        color: EAlienIcon.ORGANELLE_BLUE,
        position: 1,
      },
      {
        tokenId: 'inner-a',
        color: EAlienIcon.ORGANELLE_RED,
        position: 7,
      },
      {
        tokenId: 'inner-b',
        color: EAlienIcon.ORGANELLE_YELLOW,
        position: 8,
      },
    ];

    expect(board.moveOrganelleToken('moving')).toBe(true);
    expect(board.moveOrganelleToken('missing')).toBe(false);
    expect(
      Object.fromEntries(
        board.organelles.map((token) => [token.tokenId, token.position]),
      ),
    ).toEqual({
      'blocker-0': 0,
      'blocker-1': 1,
      'inner-a': 7,
      'inner-b': 8,
      moving: 2,
    });
  });

  it('lists and removes Amoeba markers that can trigger SA.ET.19', () => {
    const game = createGame('sa-amoeba-et-19-marker-removal');
    const [player, otherPlayer] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }
    game.alienState.discoverAlien(board, game);

    const boardRed = board.speciesTraceSlots.find(
      (slot) => slot.traceColor === ETrace.PINK,
    );
    const discoveryYellow = board.discoverySlots.find(
      (slot) => slot.traceColor === ETrace.YELLOW,
    );
    const overflowBlue = board.overflowSlots.find(
      (slot) => slot.traceColor === ETrace.BLUE,
    );
    const otherYellow = board.speciesTraceSlots.find(
      (slot) => slot.traceColor === ETrace.YELLOW,
    );
    if (!boardRed || !discoveryYellow || !overflowBlue || !otherYellow) {
      throw new Error('expected Amoeba removable marker slots');
    }
    board.placeTrace(boardRed, { playerId: player.id }, ETrace.PINK);
    board.placeTrace(discoveryYellow, { playerId: player.id }, ETrace.YELLOW);
    board.placeTrace(overflowBlue, { playerId: player.id }, ETrace.BLUE);
    board.placeTrace(otherYellow, { playerId: otherPlayer.id }, ETrace.YELLOW);

    expect(
      board.getRemovableMarkerSlots(player.id).map((slot) => slot.slotId),
    ).toEqual([boardRed.slotId, discoveryYellow.slotId, overflowBlue.slotId]);
    expect(
      board.removePlayerMarkerFromSlot(discoveryYellow.slotId, player.id),
    ).toBe(ETrace.YELLOW);
    expect(discoveryYellow.occupants).toEqual([]);
    expect(
      board.removePlayerMarkerFromSlot(discoveryYellow.slotId, player.id),
    ).toBeUndefined();
    expect(
      board.removePlayerMarkerFromSlot(otherYellow.slotId, player.id),
    ).toBeUndefined();
    expect(otherYellow.occupants).toHaveLength(1);
  });

  it('moves matching Amoeba organelles after marking an Amoeba board space', () => {
    const game = createGame('sa-amoeba-organelle-mutation');
    const [player] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.AMOEBA]);
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board)) {
      throw new Error('expected Amoeba board');
    }
    game.alienState.discoverAlien(board, game);
    board.organelles = [
      {
        tokenId: 'yellow-moving',
        color: EAlienIcon.ORGANELLE_YELLOW,
        position: 5,
      },
      {
        tokenId: 'red-blocker',
        color: EAlienIcon.ORGANELLE_RED,
        position: 0,
      },
      {
        tokenId: 'blue-other',
        color: EAlienIcon.ORGANELLE_BLUE,
        position: 2,
      },
      {
        tokenId: 'red-other',
        color: EAlienIcon.ORGANELLE_RED,
        position: 7,
      },
      {
        tokenId: 'yellow-other',
        color: EAlienIcon.ORGANELLE_YELLOW,
        position: 8,
      },
    ];
    const yellowSlot = board.speciesTraceSlots.find((slot) =>
      slot.slotId.endsWith('yellow-trace-4'),
    );
    if (!yellowSlot) {
      throw new Error('expected Amoeba yellow board slot');
    }

    expect(
      game.alienState.applyTraceToSlot(
        player,
        game,
        yellowSlot.slotId,
        yellowSlot.traceColor,
      ),
    ).toBe(true);

    expect(
      Object.fromEntries(
        board.organelles.map((token) => [token.tokenId, token.position]),
      ),
    ).toEqual({
      'blue-other': 2,
      'red-blocker': 0,
      'red-other': 7,
      'yellow-moving': 1,
      'yellow-other': 8,
    });
  });

  it('initializes Arkhos exploration and security state on discovery', () => {
    const game = createGame('sa-arkhos-discovery');
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.ARKHOS]);
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board)) {
      throw new Error('expected Arkhos board');
    }
    for (const [index, slot] of board.getDiscoverySlots().entries()) {
      board.placeTrace(
        slot,
        { playerId: game.players[index % game.players.length].id },
        slot.traceColor,
      );
    }

    game.alienState.discoverAlien(board, game);

    expect(board.explorationDrawPile).toHaveLength(2);
    expect(board.explorationReservePile).toHaveLength(4);
    expect(board.explorationDiscardPile).toHaveLength(3);
    expect(board.resolvedExplorationRewards).toHaveLength(3);
    expect(Object.values(board.securityCardsByPlayer)).toHaveLength(2);
    for (const cards of Object.values(board.securityCardsByPlayer)) {
      expect(cards).toHaveLength(3);
      expect(cards.map((card) => card.traceColor).sort()).toEqual([
        'blue-trace',
        'red-trace',
        'yellow-trace',
      ]);
      expect(cards.every((card) => card.zone === 'front')).toBe(true);
    }
    expect(board.speciesTraceSlots).toHaveLength(12);
    expect(board.alienDeckDrawPile).toEqual([]);
    expect(board.faceUpAlienCardId).toBeNull();
  });

  it('breaches Arkhos security through matching overflow and unlocks deeper board spaces', () => {
    const game = createGame('sa-arkhos-breach');
    const [player] = game.players;
    game.alienState = AlienState.createFromHiddenAliens([EAlienType.ARKHOS]);
    const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
    if (!isArkhosAlienBoard(board)) {
      throw new Error('expected Arkhos board');
    }
    game.alienState.discoverAlien(board, game);

    const levelOneRed = board.speciesTraceSlots.find((slot) =>
      slot.slotId.includes('arkhos-level-1-0-red-trace'),
    );
    if (!levelOneRed) {
      throw new Error('expected level-one red slot');
    }
    expect(
      game.alienState.applyTraceToSlot(
        player,
        game,
        levelOneRed.slotId,
        levelOneRed.traceColor,
      ),
    ).toBe(false);

    const frontRedCard = board.securityCardsByPlayer[player.id]?.find(
      (card) => card.traceColor === 'red-trace',
    );
    expect(frontRedCard?.zone).toBe('front');
    expect(
      game.alienState.applyTraceToSlot(
        player,
        game,
        'alien-0-overflow-red-trace',
        ETrace.PINK,
      ),
    ).toBe(true);

    expect(frontRedCard?.zone).toBe('hand');
    expect(player.hand).toContain(frontRedCard?.cardId);
    expect(board.accessByPlayer[player.id]).toEqual({
      breachedCount: 1,
      accessLevel: 1,
    });
    expect(
      game.alienState.applyTraceToSlot(
        player,
        game,
        levelOneRed.slotId,
        levelOneRed.traceColor,
      ),
    ).toBe(true);
  });

  it('discarding a breached Arkhos security card resolves a minor exploration reward and marks it used', () => {
    const { game, board, player, securityCard } = breachArkhosSecurityCard(
      'sa-arkhos-discard-security',
    );
    const rewardCountBefore = board.resolvedExplorationRewards.length;

    FreeActionCornerFreeAction.execute(player, game, securityCard.cardId);

    expect(securityCard.zone).toBe('used');
    expect(player.hand).not.toContain(securityCard.cardId);
    expect(game.mainDeck.getDiscardPile()).not.toContain(securityCard.cardId);
    expect(board.resolvedExplorationRewards).toHaveLength(
      rewardCountBefore + 1,
    );
    expect(board.resolvedExplorationRewards.at(-1)).toMatchObject({
      playerId: player.id,
      size: 'minor',
    });
  });

  it('playing a breached Arkhos security card costs 2 credits, resolves a major exploration reward, and marks it used', () => {
    const { game, board, player, securityCard } = breachArkhosSecurityCard(
      'sa-arkhos-play-security',
    );
    const rewardCountBefore = board.resolvedExplorationRewards.length;
    player.resources.gain({ credits: 2 });
    const cardIndex = player.findCardInHand(securityCard.cardId);

    const result = PlayCardAction.execute(player, game, cardIndex);

    expect(result).toMatchObject({
      cardId: securityCard.cardId,
      destination: 'alien',
      price: 2,
    });
    expect(securityCard.zone).toBe('used');
    expect(player.hand).not.toContain(securityCard.cardId);
    expect(game.mainDeck.getDiscardPile()).not.toContain(securityCard.cardId);
    expect(board.resolvedExplorationRewards).toHaveLength(
      rewardCountBefore + 1,
    );
    expect(board.resolvedExplorationRewards.at(-1)).toMatchObject({
      playerId: player.id,
      size: 'major',
    });
  });
});

function breachArkhosSecurityCard(seed: string): {
  game: Game;
  board: NonNullable<ReturnType<typeof getArkhosBoard>>;
  player: Game['players'][number];
  securityCard: NonNullable<
    NonNullable<
      ReturnType<typeof getArkhosBoard>
    >['securityCardsByPlayer'][string]
  >[number];
} {
  const game = createGame(seed);
  const [player] = game.players;
  game.alienState = AlienState.createFromHiddenAliens([EAlienType.ARKHOS]);
  const board = getArkhosBoard(game);
  game.alienState.discoverAlien(board, game);

  const securityCard = board.securityCardsByPlayer[player.id]?.find(
    (card) => card.traceColor === ETrace.PINK,
  );
  if (!securityCard) {
    throw new Error('expected red Arkhos security card');
  }
  game.alienState.applyTraceToSlot(
    player,
    game,
    'alien-0-overflow-red-trace',
    ETrace.PINK,
  );
  return { game, board, player, securityCard };
}

function getArkhosBoard(game: Game) {
  const board = game.alienState.getBoardByType(EAlienType.ARKHOS);
  if (!isArkhosAlienBoard(board)) {
    throw new Error('expected Arkhos board');
  }
  return board;
}
