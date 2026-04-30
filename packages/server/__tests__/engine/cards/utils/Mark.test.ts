import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { EMarkSource, Mark } from '@/engine/cards/utils/Mark.js';
import { Deck } from '@/engine/deck/Deck.js';
import { Player } from '@/engine/player/Player.js';

function createSector(color: ESector, index: number) {
  const state = { marks: 0 };
  return {
    id: `sector-${index}`,
    color,
    completed: false,
    markSignal: () => {
      state.marks += 1;
      return { dataGained: false, vpAwarded: 0 };
    },
    state,
  };
}

describe('Mark', () => {
  const player = { id: 'p1' } as never;

  it('returns undefined when count <= 0', () => {
    const input = Mark.execute(
      player,
      { cardRow: [] } as never,
      EMarkSource.ANY,
      0,
    );

    expect(input).toBeUndefined();
  });

  it('builds color options for ANY source', () => {
    const input = Mark.execute(
      player,
      { cardRow: [] } as never,
      EMarkSource.ANY,
      1,
    );

    expect(input).toBeDefined();
    const model = input?.toModel();
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    if (!model || model.type !== EPlayerInputType.OPTION) return;
    expect(model.options).toHaveLength(4);
  });

  it('returns undefined for CARD_ROW source when row is empty', () => {
    const input = Mark.execute(
      player,
      { cardRow: [] } as never,
      EMarkSource.CARD_ROW,
      1,
    );

    expect(input).toBeUndefined();
  });

  it('discards each selected card-row card and refills once after a DISPLAY_CARD batch', () => {
    const realPlayer = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const sectors = [
      createSector(ESector.RED, 0),
      createSector(ESector.YELLOW, 1),
      createSector(ESector.BLUE, 2),
    ];
    const game = {
      sectors,
      cardRow: ['45', '46', '47'],
      mainDeck: new Deck<string>(['refill-a', 'refill-b']),
      missionTracker: { recordEvent: () => undefined },
      lockCurrentTurn: () => undefined,
    } as never;

    const first = Mark.execute(
      realPlayer,
      game,
      EMarkSource.CARD_ROW,
      2,
    );

    expect(first?.toModel().type).toBe(EPlayerInputType.CARD);
    const second = first?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['45@0'],
    });
    expect(second?.toModel().type).toBe(EPlayerInputType.CARD);
    expect((game as { cardRow: string[] }).cardRow).toEqual(['46', '47']);

    const done = second?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['46@0'],
    });

    expect(done).toBeUndefined();
    expect(sectors[0].state.marks).toBe(1);
    expect(sectors[1].state.marks).toBe(1);
    expect((game as { cardRow: string[] }).cardRow).toEqual([
      '47',
      'refill-a',
      'refill-b',
    ]);
    expect(
      (game as { mainDeck: Deck<string> }).mainDeck.getDiscardPile(),
    ).toEqual(['45', '46']);
  });
});
