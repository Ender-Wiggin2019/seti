import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DebugReplayPage,
  parseDebugSnapshotVersionInput,
} from '@/pages/game/DebugReplayPage';

const debugApiMock = vi.hoisted(() => ({
  getReplayPresets: vi.fn(),
  createReplaySession: vi.fn(),
  createSnapshotSession: vi.fn(),
}));

vi.mock('@/api/debugApi', () => ({
  debugApi: debugApiMock,
}));

vi.mock('@/pages/game/GameContext', () => ({
  GameContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useGameContext: () => ({
    isConnected: false,
    gameState: null,
  }),
}));

describe('DebugReplayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    debugApiMock.getReplayPresets.mockResolvedValue([
      {
        id: 'anomaly-discovery',
        label: 'Alien Discovery Replay',
        description: 'Replay into discovery',
        fields: [
          {
            id: 'alienType',
            label: 'Alien',
            kind: 'select',
            required: true,
            options: [{ value: '1', label: 'Anomalies' }],
          },
        ],
        checkpoints: [
          {
            id: 'before-end-turn',
            label: 'Before End Turn',
            description: 'Before end turn',
          },
        ],
      },
    ]);
  });

  it('parses only positive whole-number snapshot versions', () => {
    expect(parseDebugSnapshotVersionInput('')).toEqual({ version: undefined });
    expect(parseDebugSnapshotVersionInput('12')).toEqual({ version: 12 });
    expect(parseDebugSnapshotVersionInput('0').errorMessage).toMatch(
      /positive whole number/i,
    );
    expect(parseDebugSnapshotVersionInput('-1').errorMessage).toMatch(
      /positive whole number/i,
    );
    expect(parseDebugSnapshotVersionInput('1.5').errorMessage).toMatch(
      /positive whole number/i,
    );
    expect(parseDebugSnapshotVersionInput('NaN').errorMessage).toMatch(
      /positive whole number/i,
    );
  });

  it('blocks invalid snapshot versions before calling the API', async () => {
    render(<DebugReplayPage />);

    await screen.findByTestId('debug-replay-preset');
    fireEvent.change(screen.getByTestId('debug-snapshot-game-id'), {
      target: { value: 'source-game' },
    });
    fireEvent.change(screen.getByTestId('debug-snapshot-version'), {
      target: { value: '0' },
    });

    fireEvent.click(screen.getByTestId('debug-snapshot-start'));

    expect(debugApiMock.createSnapshotSession).not.toHaveBeenCalled();
    expect(
      screen.getByText(/positive whole number greater than 0/i),
    ).toBeInTheDocument();
  });
});
