import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionMenu } from '@/features/actions/ActionMenu';
import {
  EMainAction,
  EPhase,
  EPlayerInputType,
  type IPlayerInputModel,
} from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';

describe('ActionMenu', () => {
  it('shows 8 main action buttons on my turn', () => {
    render(
      <ActionMenu
        gameState={createMockGameState({ phase: EPhase.AWAIT_MAIN_ACTION })}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={null}
        canUndo={false}
        onSendAction={vi.fn()}
        onRequestUndo={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Launch Probe' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Orbit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Land' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analyze Data' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Play Card' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Research Tech' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pass' })).toBeInTheDocument();
  });

  it('shows waiting message when not my turn', () => {
    render(
      <ActionMenu
        gameState={createMockGameState({ currentPlayerId: 'player-2' })}
        myPlayerId='player-1'
        isMyTurn={false}
        pendingInput={null}
        canUndo={false}
        onSendAction={vi.fn()}
        onRequestUndo={vi.fn()}
      />,
    );

    expect(screen.getByText('Waiting for Pilot...')).toBeInTheDocument();
  });

  it('disables unavailable actions from pending or-options', () => {
    const pendingInput: IPlayerInputModel = {
      inputId: 'input-or',
      type: EPlayerInputType.OR,
      options: [
        {
          inputId: 'option-1',
          type: EPlayerInputType.OPTION,
          title: 'Launch Probe',
          options: [{ id: 'launch', label: 'Launch Probe' }],
        },
        {
          inputId: 'option-2',
          type: EPlayerInputType.OPTION,
          title: 'Pass',
          options: [{ id: 'pass', label: 'Pass' }],
        },
      ],
    };

    render(
      <ActionMenu
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={pendingInput}
        canUndo={false}
        onSendAction={vi.fn()}
        onRequestUndo={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Launch Probe' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Pass' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Orbit' })).toBeDisabled();
  });

  it('triggers sendAction when clicking a button', () => {
    const onSendAction = vi.fn();
    const gameState = createMockGameState({
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          resources: { credit: 10, energy: 8, data: 0, publicity: 10 },
        }),
      ],
    });

    render(
      <ActionMenu
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={null}
        canUndo={false}
        onSendAction={onSendAction}
        onRequestUndo={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pass' }));

    expect(onSendAction).toHaveBeenCalledWith({ type: EMainAction.PASS });
  });
});
