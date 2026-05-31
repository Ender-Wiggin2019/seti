import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SolarSystemCompareDebugPage } from '@/pages/game/SolarSystemCompareDebugPage';
import {
  EAlienType,
  EFreeAction,
  EMainAction,
  EPlanet,
  EPlayerInputType,
  type IPublicGameState,
} from '@/types/re-exports';

const solarViewCalls = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const sessionMock = vi.hoisted(() => ({
  current: {
    gameId: 'debug-game',
    viewerId: 'player-1',
    gameState: null as IPublicGameState | null,
    pendingInput: null as unknown,
    isCreating: false,
    errorMessage: null as string | null,
    createSession: vi.fn(),
    refresh: vi.fn(),
    solarRotate: vi.fn(),
    solarRotateNext: vi.fn(),
    placeProbeOn: vi.fn(),
    moveProbeTo: vi.fn(),
    placeTraceOf: vi.fn(),
    revealAlien: vi.fn(),
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
      <div>
        <div
          data-testid={
            props.textModeOverride ? 'solar-text-view' : 'solar-image-view'
          }
        />
        <button
          type='button'
          data-testid={
            props.textModeOverride ? 'mock-text-move' : 'mock-image-move'
          }
          onClick={() =>
            (
              props.onMoveProbe as (
                path: string[],
                target?: { type: 'probe'; id: string },
              ) => void
            )(['space-0', 'space-1'], { type: 'probe', id: 'probe-1' })
          }
        >
          mock move
        </button>
      </div>
    );
  },
}));

vi.mock('@/features/input/InputRenderer', () => ({
  InputRenderer: ({
    model,
    onSubmit,
  }: {
    model: { inputId?: string; title?: string };
    onSubmit: (response: unknown) => void;
  }) => (
    <button
      type='button'
      data-testid='debug-input-renderer'
      onClick={() =>
        onSubmit({
          inputId: model.inputId,
          type: EPlayerInputType.OPTION,
          optionId: 'done',
        })
      }
    >
      {model.title}
    </button>
  ),
}));

function createGameState(): IPublicGameState {
  const solarSystem = {
    spaces: ['space-0', 'space-1'],
    adjacency: { 'space-0': ['space-1'], 'space-1': ['space-0'] },
    probes: [
      {
        playerId: 'player-1',
        spaceId: 'space-0',
        probeId: 'probe-1',
      },
    ],
    planetSpaceIds: { [EPlanet.EARTH]: 'space-0' },
    sectorSpaceIds: { 0: ['space-0'], 1: ['space-1'] },
    probeSpaceById: { 'probe-1': 'space-0' },
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
        elements: [{ type: 'EARTH', planet: EPlanet.EARTH }],
      },
      'space-1': {
        spaceId: 'space-1',
        ringIndex: 1,
        indexInRing: 1,
        sectorIndex: 1,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
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
        movementPoints: 2,
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

  it('shows the current Oumuamua solar-system location after reveal', () => {
    const gameState = createGameState();
    sessionMock.current.gameState = {
      ...gameState,
      aliens: [
        {
          alienType: EAlienType.OUMUAMUA,
          discovered: true,
          board: {
            type: 'oumuamua',
            tile: {
              spaceId: 'space-1',
              sectorId: 'sector-2',
              dataRemaining: 3,
              markerPlayerIds: [],
            },
            traceSlots: [],
          },
        },
      ],
    } as unknown as IPublicGameState;

    render(<SolarSystemCompareDebugPage />);

    expect(screen.getByTestId('debug-oumuamua-location')).toHaveTextContent(
      'Oumuamua: space-1 / sector-2',
    );
    const [imageProps, textProps] = solarViewCalls.slice(-2);
    expect(imageProps.oumuamuaTile).toEqual({
      spaceId: 'space-1',
      sectorId: 'sector-2',
      dataRemaining: 3,
      markerPlayerIds: [],
    });
    expect(textProps.oumuamuaTile).toBe(imageProps.oumuamuaTile);
  });

  it('uses server init and next-rotate actions', () => {
    render(<SolarSystemCompareDebugPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Init' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));

    expect(sessionMock.current.createSession).toHaveBeenCalledTimes(1);
    expect(sessionMock.current.solarRotateNext).toHaveBeenCalledTimes(1);
  });

  it('exposes launch and scan controls backed by the server session', () => {
    render(<SolarSystemCompareDebugPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Launch' }));
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }));

    expect(sessionMock.current.placeProbeOn).toHaveBeenCalledWith('space-0');
    expect(sessionMock.current.sendMainAction).toHaveBeenCalledWith({
      type: EMainAction.SCAN,
    });
  });

  it('enables move mode on both views and routes board moves through the server sandbox', () => {
    render(<SolarSystemCompareDebugPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Move Mode Off' }));

    const [imageProps, textProps] = solarViewCalls.slice(-2);
    expect(imageProps.moveModeActive).toBe(true);
    expect(textProps.moveModeActive).toBe(true);
    expect(imageProps.movementPoints).toBe(2);
    expect(textProps.movementPoints).toBe(2);
    expect(imageProps.allowMoveAnyProbe).toBe(true);
    expect(textProps.allowMoveAnyProbe).toBe(true);

    fireEvent.click(screen.getByTestId('mock-image-move'));

    expect(sessionMock.current.moveProbeTo).toHaveBeenCalledWith(
      'probe-1',
      'space-1',
    );
    expect(sessionMock.current.sendFreeAction).not.toHaveBeenCalledWith({
      type: EFreeAction.MOVEMENT,
      path: ['space-0', 'space-1'],
      target: { type: 'probe', id: 'probe-1' },
    });
  });

  it('reveals the selected alien through the server discovery path', () => {
    render(<SolarSystemCompareDebugPage />);

    fireEvent.change(screen.getByLabelText('Reveal alien type'), {
      target: { value: String(EAlienType.GLYPHIDS) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reveal Alien' }));

    expect(sessionMock.current.revealAlien).toHaveBeenCalledWith(
      EAlienType.GLYPHIDS,
    );
  });

  it('renders pending input controls and submits responses to the debug session', () => {
    sessionMock.current.pendingInput = {
      inputId: 'scan-pool',
      type: EPlayerInputType.OPTION,
      title: 'Scan: choose sub-action',
      options: [{ id: 'done', label: 'Done' }],
    };

    render(<SolarSystemCompareDebugPage />);

    fireEvent.click(screen.getByTestId('debug-input-renderer'));

    expect(sessionMock.current.sendInput).toHaveBeenCalledWith({
      inputId: 'scan-pool',
      type: EPlayerInputType.OPTION,
      optionId: 'done',
    });
  });
});
