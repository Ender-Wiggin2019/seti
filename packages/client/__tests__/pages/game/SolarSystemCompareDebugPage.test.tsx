import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SolarSystemCompareDebugPage } from '@/pages/game/SolarSystemCompareDebugPage';
import type { IPublicGameState } from '@/types/re-exports';

const solarViewCalls = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const sessionMock = vi.hoisted(() => ({
  current: {
    gameId: 'debug-game',
    viewerId: 'player-1',
    gameState: null as IPublicGameState | null,
    pendingInput: null,
    isCreating: false,
    errorMessage: null as string | null,
    createSession: vi.fn(),
    refresh: vi.fn(),
    solarRotate: vi.fn(),
    solarRotateNext: vi.fn(),
    placeProbeOn: vi.fn(),
    moveProbeTo: vi.fn(),
    placeTraceOf: vi.fn(),
    sendMainAction: vi.fn(),
    sendFreeAction: vi.fn(),
    sendEndTurn: vi.fn(),
    sendInput: vi.fn(),
  },
}));

vi.mock('@/hooks/useServerDebugSession', () => ({
  useServerDebugSession: () => sessionMock.current,
}));

vi.mock('@/features/board/SolarSystemView', () => ({
  SolarSystemView: (props: Record<string, unknown>) => {
    solarViewCalls.push(props);
    return (
      <div
        data-testid={
          props.textModeOverride ? 'solar-text-view' : 'solar-image-view'
        }
      />
    );
  },
}));

function createGameState(): IPublicGameState {
  const solarSystem = {
    spaces: ['space-0'],
    adjacency: { 'space-0': [] },
    probes: [],
    discs: [
      { discIndex: 0, angle: 0 },
      { discIndex: 1, angle: 0 },
      { discIndex: 2, angle: 0 },
    ],
    nextRotateRing: 1,
    spaceStates: {
      'space-0': {
        spaceId: 'space-0',
        ringIndex: 1,
        indexInRing: 0,
        sectorIndex: 0,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['EARTH'],
        elements: [{ type: 'EARTH' }],
      },
    },
    alienTokens: [],
  } as IPublicGameState['solarSystem'];

  return {
    gameId: 'debug-game',
    solarSystem,
    sectors: [],
    solarSystemSetup: createDefaultSetupConfig(),
    players: [
      {
        playerId: 'player-1',
        color: 'red',
      },
    ],
  } as unknown as IPublicGameState;
}

describe('SolarSystemCompareDebugPage', () => {
  beforeEach(() => {
    solarViewCalls.length = 0;
    sessionMock.current.gameState = createGameState();
    sessionMock.current.isCreating = false;
    sessionMock.current.errorMessage = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    solarViewCalls.length = 0;
  });

  it('renders image and text modes from the same server-projected state', () => {
    render(<SolarSystemCompareDebugPage />);

    expect(screen.getByTestId('solar-image-view')).toBeInTheDocument();
    expect(screen.getByTestId('solar-text-view')).toBeInTheDocument();

    const [imageProps, textProps] = solarViewCalls.slice(-2);
    expect(imageProps.textModeOverride).toBe(false);
    expect(textProps.textModeOverride).toBe(true);
    expect(imageProps.solarSystem).toBe(
      sessionMock.current.gameState?.solarSystem,
    );
    expect(textProps.solarSystem).toBe(
      sessionMock.current.gameState?.solarSystem,
    );
    expect(imageProps.solarSystem).toBe(textProps.solarSystem);
    expect(imageProps.sectors).toBe(sessionMock.current.gameState?.sectors);
    expect(textProps.sectors).toBe(sessionMock.current.gameState?.sectors);
    expect(imageProps.setupConfig).toBe(
      sessionMock.current.gameState?.solarSystemSetup,
    );
    expect(textProps.setupConfig).toBe(
      sessionMock.current.gameState?.solarSystemSetup,
    );
  });

  it('uses server init and next-rotate actions', () => {
    render(<SolarSystemCompareDebugPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Init' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));

    expect(sessionMock.current.createSession).toHaveBeenCalledTimes(1);
    expect(sessionMock.current.solarRotateNext).toHaveBeenCalledTimes(1);
  });
});
