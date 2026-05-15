import type { IInputResponse } from '@seti/common/types/protocol/actions';
import {
  EPlayerInputType,
  ESetupChoiceStepKind,
} from '@seti/common/types/protocol/playerInput';
import { describe, expect, it, vi } from 'vitest';
import { Player } from '@/engine/player/Player.js';
import type { ISetupChoiceConfig } from '@/engine/setup/SetupChoiceConfig.js';
import { SetupChoiceCoordinator } from '@/engine/setup/SetupChoiceCoordinator.js';

function createPlayers(): Player[] {
  return [
    new Player({ id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 }),
    new Player({ id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 }),
  ];
}

function createConfig(
  overrides: Partial<ISetupChoiceConfig['steps'][number]> = {},
): ISetupChoiceConfig {
  return {
    steps: [
      {
        kind: ESetupChoiceStepKind.ORGANIZATION,
        title: 'Choose organization',
        enabled: true,
        minSelections: 1,
        maxSelections: 1,
        candidates: [
          { id: 'org-a', label: 'Org A', permission: { canChoose: true } },
          { id: 'org-b', label: 'Org B', permission: { canChoose: true } },
        ],
        permission: { canChoose: true },
        autoSelect: 'none',
        ...overrides,
      },
    ],
  };
}

function choose(player: Player, optionId: string): void {
  if (!player.waitingFor) {
    throw new Error('expected pending setup choice input');
  }
  const response: IInputResponse = {
    inputId: player.waitingFor.inputId,
    type: EPlayerInputType.OPTION,
    optionId,
  };
  player.waitingFor = player.waitingFor.process(response);
}

describe('SetupChoiceCoordinator', () => {
  it('creates setup-choice option inputs for selectable candidates', () => {
    const [player] = createPlayers();

    SetupChoiceCoordinator.begin([player], createConfig());

    expect(player.setupChoiceContext?.completed).toBe(false);
    expect(player.waitingFor?.toModel()).toMatchObject({
      type: EPlayerInputType.OPTION,
      title: 'Choose organization',
      setupChoice: {
        kind: ESetupChoiceStepKind.ORGANIZATION,
        stepIndex: 0,
        totalSteps: 1,
      },
      options: [
        { id: 'org-a', label: 'Org A' },
        { id: 'org-b', label: 'Org B' },
      ],
    });
  });

  it('supports player-specific setup-choice candidates', () => {
    const players = createPlayers();

    SetupChoiceCoordinator.beginPerPlayer(players, (player) =>
      createConfig({
        candidates:
          player.id === 'p1'
            ? [
                {
                  id: 'org-a',
                  label: 'Org A',
                  permission: { canChoose: true },
                },
              ]
            : [
                {
                  id: 'org-b',
                  label: 'Org B',
                  permission: { canChoose: true },
                },
              ],
      }),
    );

    expect(players[0].waitingFor?.toModel()).toMatchObject({
      options: [{ id: 'org-a', label: 'Org A' }],
    });
    expect(players[1].waitingFor?.toModel()).toMatchObject({
      options: [{ id: 'org-b', label: 'Org B' }],
    });
  });

  it('skips steps that the player cannot choose', () => {
    const [player] = createPlayers();

    SetupChoiceCoordinator.begin(
      [player],
      createConfig({ permission: { canChoose: false } }),
    );

    expect(player.setupChoiceContext?.completed).toBe(true);
    expect(player.waitingFor).toBeUndefined();
  });

  it('auto-chooses a single candidate when configured', () => {
    const [player] = createPlayers();

    SetupChoiceCoordinator.begin(
      [player],
      createConfig({
        candidates: [
          {
            id: 'org-only',
            label: 'Only Org',
            permission: { canChoose: true },
          },
        ],
        autoSelect: 'single-candidate',
      }),
    );

    expect(player.setupChoiceContext?.completed).toBe(true);
    expect(player.setupChoiceContext?.steps[0].selectedIds).toEqual([
      'org-only',
    ]);
    expect(player.waitingFor).toBeUndefined();
  });

  it('lets players skip an optional step without selecting a candidate', () => {
    const [player] = createPlayers();

    SetupChoiceCoordinator.begin(
      [player],
      createConfig({ minSelections: 0, maxSelections: 1 }),
    );

    expect(player.waitingFor?.toModel()).toMatchObject({
      options: expect.arrayContaining([
        { id: '__setup-choice-done', label: 'Skip' },
      ]),
    });

    choose(player, '__setup-choice-done');

    expect(player.setupChoiceContext?.completed).toBe(true);
    expect(player.setupChoiceContext?.steps[0].selectedIds).toEqual([]);
    expect(player.waitingFor).toBeUndefined();
  });

  it('rejects candidates that collide with the internal done option id', () => {
    const [player] = createPlayers();

    expect(() =>
      SetupChoiceCoordinator.begin(
        [player],
        createConfig({
          minSelections: 0,
          candidates: [
            {
              id: '__setup-choice-done',
              label: 'Colliding Org',
              permission: { canChoose: true },
            },
          ],
        }),
      ),
    ).toThrow('Setup choice candidate id is reserved');
  });

  it('lets players finish a variable-size step after the minimum is met', () => {
    const [player] = createPlayers();

    SetupChoiceCoordinator.begin(
      [player],
      createConfig({ minSelections: 1, maxSelections: 2 }),
    );

    choose(player, 'org-a');

    expect(player.waitingFor?.toModel()).toMatchObject({
      options: expect.arrayContaining([
        { id: '__setup-choice-done', label: 'Done' },
      ]),
    });

    choose(player, '__setup-choice-done');

    expect(player.setupChoiceContext?.completed).toBe(true);
    expect(player.setupChoiceContext?.steps[0].selectedIds).toEqual(['org-a']);
  });

  it('rejects invalid picks through the pending input contract', () => {
    const [player] = createPlayers();

    SetupChoiceCoordinator.begin([player], createConfig());

    expect(() => choose(player, 'missing-org')).toThrow('Unknown option id');
  });

  it('waits for all players before invoking the completion callback', () => {
    const players = createPlayers();
    const onComplete = vi.fn();

    SetupChoiceCoordinator.begin(players, createConfig(), onComplete);
    choose(players[0], 'org-a');

    expect(players[0].setupChoiceContext?.completed).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();

    choose(players[1], 'org-b');

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
