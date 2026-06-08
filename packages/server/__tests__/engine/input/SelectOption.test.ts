import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

describe('SelectOption', () => {
  it('executes callback for selected option', () => {
    const calls: string[] = [];
    const input = new SelectOption(
      { id: 'p1' } as IPlayer,
      [
        {
          id: 'a',
          label: 'Option A',
          onSelect: () => {
            calls.push('A');
            return undefined;
          },
        },
      ],
      'Pick one',
    );

    const result = input.process({
      type: EPlayerInputType.OPTION,
      optionId: 'a',
    });

    expect(result).toBeUndefined();
    expect(calls).toEqual(['A']);
  });

  it('selects correct callback among multiple options', () => {
    const calls: string[] = [];
    const input = new SelectOption({ id: 'p1' } as IPlayer, [
      {
        id: 'a',
        label: 'A',
        onSelect: () => {
          calls.push('A');
          return undefined;
        },
      },
      {
        id: 'b',
        label: 'B',
        onSelect: () => {
          calls.push('B');
          return undefined;
        },
      },
    ]);

    input.process({ type: EPlayerInputType.OPTION, optionId: 'b' });

    expect(calls).toEqual(['B']);
  });

  it('throws for unknown option id', () => {
    const input = new SelectOption({ id: 'p1' } as IPlayer, [
      { id: 'a', label: 'A', onSelect: () => undefined },
    ]);

    expect(() =>
      input.process({ type: EPlayerInputType.OPTION, optionId: 'missing' }),
    ).toThrow();
  });

  it('serializes to protocol-compatible model', () => {
    const input = new SelectOption(
      { id: 'p1' } as IPlayer,
      [{ id: 'confirm', label: 'Confirm', onSelect: () => undefined }],
      'Confirm action',
    );

    expect(input.toModel()).toEqual({
      inputId: expect.any(String),
      type: EPlayerInputType.OPTION,
      title: 'Confirm action',
      options: [{ id: 'confirm', label: 'Confirm' }],
    });
  });

  it('serializes optional card metadata when an option references a card', () => {
    const input = new SelectOption(
      { id: 'p1' } as IPlayer,
      [
        {
          id: 'draw-face-up',
          label: 'Draw face-up alien card',
          cardId: 'ET.11',
          onSelect: () => undefined,
        },
        {
          id: 'draw-random',
          label: 'Draw random alien card',
          onSelect: () => undefined,
        },
      ],
      'Choose source',
    );

    expect(input.toModel()).toEqual({
      inputId: expect.any(String),
      type: EPlayerInputType.OPTION,
      title: 'Choose source',
      options: [
        {
          id: 'draw-face-up',
          label: 'Draw face-up alien card',
          cardId: 'ET.11',
        },
        { id: 'draw-random', label: 'Draw random alien card' },
      ],
    });
  });
});
