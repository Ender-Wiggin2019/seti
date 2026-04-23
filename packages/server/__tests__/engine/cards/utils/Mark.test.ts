import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { EMarkSource, Mark } from '@/engine/cards/utils/Mark.js';

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
});
