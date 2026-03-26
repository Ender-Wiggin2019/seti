import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { AndOptions } from '@/engine/input/AndOptions.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

describe('AndOptions', () => {
  it('completes child inputs in sequence', () => {
    const calls: string[] = [];
    const player = { id: 'p1' } as IPlayer;
    const input = new AndOptions(player, [
      new SelectOption(player, [
        {
          id: 'one',
          label: 'One',
          onSelect: () => {
            calls.push('one');
            return undefined;
          },
        },
      ]),
      new SelectOption(player, [
        {
          id: 'two',
          label: 'Two',
          onSelect: () => {
            calls.push('two');
            return undefined;
          },
        },
      ]),
    ]);

    const firstResult = input.process({
      type: EPlayerInputType.OPTION,
      optionId: 'one',
    });
    expect(firstResult).toBe(input);
    expect(input.getCurrentIndex()).toBe(1);

    const secondResult = input.process({
      type: EPlayerInputType.OPTION,
      optionId: 'two',
    });
    expect(secondResult).toBeUndefined();
    expect(input.getCurrentIndex()).toBe(2);
    expect(calls).toEqual(['one', 'two']);
  });

  it('supports pause and resume with batched AND response', () => {
    const calls: string[] = [];
    const player = { id: 'p1' } as IPlayer;
    const input = new AndOptions(player, [
      new SelectOption(player, [
        {
          id: 'a',
          label: 'A',
          onSelect: () => {
            calls.push('a');
            return undefined;
          },
        },
      ]),
      new SelectOption(player, [
        {
          id: 'b',
          label: 'B',
          onSelect: () => {
            calls.push('b');
            return undefined;
          },
        },
      ]),
    ]);

    const result = input.process({
      type: EPlayerInputType.AND,
      responses: [
        { type: EPlayerInputType.OPTION, optionId: 'a' },
        { type: EPlayerInputType.OPTION, optionId: 'b' },
      ],
    });

    expect(result).toBeUndefined();
    expect(calls).toEqual(['a', 'b']);
    expect(input.getCurrentIndex()).toBe(2);
  });

  it('keeps progress when partially completed', () => {
    const player = { id: 'p1' } as IPlayer;
    const input = new AndOptions(player, [
      new SelectOption(player, [
        { id: 'a', label: 'A', onSelect: () => undefined },
      ]),
      new SelectOption(player, [
        { id: 'b', label: 'B', onSelect: () => undefined },
      ]),
      new SelectOption(player, [
        { id: 'c', label: 'C', onSelect: () => undefined },
      ]),
    ]);

    input.process({ type: EPlayerInputType.OPTION, optionId: 'a' });

    expect(input.getCurrentIndex()).toBe(1);
    expect(input.toModel().options).toHaveLength(3);
  });
});
