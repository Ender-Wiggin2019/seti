import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { OrOptions } from '@/engine/input/OrOptions.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

describe('OrOptions', () => {
  it('routes response to selected child input', () => {
    const calls: string[] = [];
    const player = { id: 'p1' } as IPlayer;
    const left = new SelectOption(player, [
      {
        id: 'left',
        label: 'Left',
        onSelect: () => {
          calls.push('left');
          return undefined;
        },
      },
    ]);
    const right = new SelectOption(player, [
      {
        id: 'right',
        label: 'Right',
        onSelect: () => {
          calls.push('right');
          return undefined;
        },
      },
    ]);
    const input = new OrOptions(player, [left, right]);

    const result = input.process({
      type: EPlayerInputType.OR,
      index: 1,
      response: { type: EPlayerInputType.OPTION, optionId: 'right' },
    });

    expect(result).toBeUndefined();
    expect(calls).toEqual(['right']);
  });

  it('supports nested OrOptions', () => {
    const calls: string[] = [];
    const player = { id: 'p1' } as IPlayer;
    const nested = new OrOptions(player, [
      new SelectOption(player, [
        {
          id: 'nested',
          label: 'Nested',
          onSelect: () => {
            calls.push('nested');
            return undefined;
          },
        },
      ]),
    ]);
    const root = new OrOptions(player, [nested]);

    root.process({
      type: EPlayerInputType.OR,
      index: 0,
      response: {
        type: EPlayerInputType.OR,
        index: 0,
        response: { type: EPlayerInputType.OPTION, optionId: 'nested' },
      },
    });

    expect(calls).toEqual(['nested']);
  });

  it('serializes child inputs recursively', () => {
    const player = { id: 'p1' } as IPlayer;
    const input = new OrOptions(player, [
      new SelectOption(player, [
        { id: 'a', label: 'A', onSelect: () => undefined },
      ]),
    ]);

    expect(input.toModel()).toEqual({
      inputId: expect.any(String),
      type: EPlayerInputType.OR,
      title: undefined,
      options: [
        {
          inputId: expect.any(String),
          type: EPlayerInputType.OPTION,
          title: undefined,
          options: [{ id: 'a', label: 'A' }],
        },
      ],
    });
  });
});
