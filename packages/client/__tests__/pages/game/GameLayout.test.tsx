import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IGameContext } from '@/pages/game/GameContext';
import { useGameViewStore } from '@/stores/gameViewStore';
import {
  EFreeAction,
  EGameEventType,
  EMainAction,
  EPhase,
  EPlanet,
  EPlayerInputType,
  ETech,
  type IPublicRivalState,
} from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={rest.to}>{children}</a>
  ),
}));

let mockContextValue: IGameContext;

vi.mock('@/pages/game/GameContext', () => ({
  useGameContext: () => mockContextValue,
}));

function createMockContext(overrides?: Partial<IGameContext>): IGameContext {
  return {
    gameState: createMockGameState(),
    pendingInput: null,
    isConnected: true,
    isMyTurn: true,
    isSpectator: false,
    myPlayerId: 'player-1',
    events: [],
    sendAction: vi.fn(),
    sendFreeAction: vi.fn(),
    sendInput: vi.fn(),
    requestUndo: vi.fn(),
    sendEndTurn: vi.fn(),
    ...overrides,
  };
}

function createCard(id: string, name = `Card ${id}`): IBaseCard {
  return {
    id,
    name,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

function createMockRivalState(): IPublicRivalState {
  return {
    rivalPlayerId: 'rival:game-test-1',
    difficulty: 3,
    progress: 12,
    progressSlot: 0,
    boardConfigId: 'rival-board-2',
    computer: {
      filledSlots: [false, true, false, false, false, false],
      dataPool: 1,
      slotRewards: [
        null,
        { type: 'PUBLICITY', amount: 1 },
        null,
        { type: 'CUSTOM', effectId: 'RIVAL_PROGRESS_4' },
        null,
        null,
      ],
    },
    actionDeck: {
      drawPileSize: 4,
      discardPileSize: 1,
      advancedReserveSize: 5,
      removedCardIds: [],
      currentCardId: 'S.1',
    },
    revealedObjectiveIds: ['SOLO.1', 'SOLO.2'],
    completedObjectiveIds: [],
    objectiveTaskMarkers: {},
    techIds: [],
  };
}

describe('GameLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameViewStore.setState({
      activeTab: 'board',
      hoveredPieceId: null,
      zoom: 0.9,
    });
    mockContextValue = createMockContext();
  });

  async function renderLayout() {
    const { GameLayout } = await import('@/pages/game/GameLayout');
    return render(<GameLayout />);
  }

  it('renders the three main layout areas', async () => {
    await renderLayout();

    expect(screen.getByTestId('bottom-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-hand')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-actions')).toBeInTheDocument();
  });

  it('renders TopBar with round and phase info', async () => {
    await renderLayout();

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Action Phase')).toBeInTheDocument();
  });

  it('renders end-turn phase label instead of the raw translation key', async () => {
    mockContextValue = createMockContext({
      gameState: createMockGameState({ phase: EPhase.AWAIT_END_TURN }),
    });

    await renderLayout();

    expect(screen.getByText('End Turn Phase')).toBeInTheDocument();
    expect(
      screen.queryByText('client.top_bar.phases.AWAIT_END_TURN'),
    ).not.toBeInTheDocument();
  });

  it('shows "Your Turn" indicator when it is my turn', async () => {
    mockContextValue = createMockContext({ isMyTurn: true });
    await renderLayout();

    expect(screen.getByText('Your Turn')).toBeInTheDocument();
  });

  it('shows opponent name when it is not my turn', async () => {
    mockContextValue = createMockContext({
      isMyTurn: false,
      gameState: createMockGameState({ currentPlayerId: 'player-2' }),
    });
    await renderLayout();

    expect(screen.getAllByText('Pilot').length).toBeGreaterThanOrEqual(1);
  });

  it('displays spectating badge in spectator mode', async () => {
    mockContextValue = createMockContext({ isSpectator: true });
    await renderLayout();

    expect(screen.getByText('Spectating')).toBeInTheDocument();
  });

  describe('Board Tabs', () => {
    it('renders all 6 board tab triggers', async () => {
      await renderLayout();

      const tabLabels = [
        'Board',
        'Planets',
        'Tech',
        'Cards',
        'Aliens',
        'Scoring',
      ];
      for (const label of tabLabels) {
        expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
      }
    });

    it('defaults to Board tab', async () => {
      await renderLayout();

      const boardTab = screen.getByRole('tab', { name: 'Board' });
      expect(boardTab).toHaveAttribute('aria-selected', 'true');
    });

    it('Board tab shows solar system and sectors together', async () => {
      await renderLayout();

      expect(screen.getByText('Solar System')).toBeInTheDocument();
      expect(screen.getByTestId('solar-space-space-0')).toBeInTheDocument();
    });

    it('keeps the solar board column compact so zoom frees right-side space', async () => {
      await renderLayout();

      const solarColumn = screen.getByTestId('board-tab-solar-column');
      expect(solarColumn).toHaveClass('w-fit');
      expect(solarColumn).toHaveClass('max-w-full');
      expect(solarColumn).not.toHaveClass('mx-auto');
      expect(screen.getByTestId('solar-board-panel')).toHaveStyle({
        width: '708px',
      });
    });

    it('switches tab content on click', async () => {
      await renderLayout();

      fireEvent.click(screen.getByRole('tab', { name: 'Tech' }));
      expect(screen.getByText('Tech Board')).toBeInTheDocument();
    });
  });

  describe('Bottom Bar', () => {
    it('displays player resources', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: { credit: 15, energy: 8, data: 3, publicity: 5 },
            }),
          ],
        }),
      });
      await renderLayout();

      const dashboard = screen.getByTestId('bottom-dashboard');
      const resourceBar = within(dashboard).getByTestId('resource-bar');
      expect(within(resourceBar).getByText('Credits')).toBeInTheDocument();
      expect(within(resourceBar).getByText('Energy')).toBeInTheDocument();
      expect(within(resourceBar).getByText('Publicity')).toBeInTheDocument();
      expect(within(resourceBar).getByText('15')).toBeInTheDocument();
      expect(within(resourceBar).getByText('5')).toBeInTheDocument();
    });

    it('shows hand card count', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          players: [
            createMockPlayerState({ playerId: 'player-1', handSize: 7 }),
          ],
        }),
      });
      await renderLayout();

      expect(screen.getByText('7 cards')).toBeInTheDocument();
    });

    it('lets a playable hand card be played from its detail dialog', async () => {
      const sendAction = vi.fn();
      mockContextValue = createMockContext({
        sendAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              handSize: 2,
              hand: [createCard('play-1'), createCard('play-2')],
            }),
            createMockPlayerState({
              playerId: 'player-2',
              playerName: 'Pilot',
              seatIndex: 1,
              color: 'blue',
            }),
          ],
        }),
      });

      await renderLayout();

      fireEvent.click(screen.getByTestId('hand-card-play-2'));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByTestId('card-detail-play-card'));

      expect(sendAction).toHaveBeenCalledWith({
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 1 },
      });
    });

    it('renders the rival panel for solo games', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          isSoloMode: true,
          rival: {
            rivalPlayerId: 'rival:game-test-1',
            difficulty: 3,
            progress: 12,
            progressSlot: 0,
            boardConfigId: 'rival-board-2',
            computer: {
              filledSlots: [false, true, false, false, false, false],
              dataPool: 1,
              slotRewards: [
                null,
                { type: 'PUBLICITY', amount: 1 },
                null,
                { type: 'CUSTOM', effectId: 'RIVAL_PROGRESS_4' },
                null,
                null,
              ],
            },
            actionDeck: {
              drawPileSize: 4,
              discardPileSize: 1,
              advancedReserveSize: 5,
              removedCardIds: [],
              currentCardId: 'S.1',
            },
            revealedObjectiveIds: ['SOLO.1', 'SOLO.2'],
            completedObjectiveIds: [],
            objectiveTaskMarkers: {},
            techIds: [],
          },
        }),
      });
      await renderLayout();

      expect(screen.getByTestId('rival-area')).toBeInTheDocument();
      expect(screen.getByTestId('rival-current-card')).toHaveTextContent('S.1');
    });

    it('renders rival techs from the public rival state without a rival player row', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          isSoloMode: true,
          players: [createMockPlayerState({ playerId: 'player-1' })],
          rival: {
            ...createMockRivalState(),
            techIds: [ETechId.COMPUTER_VP_CARD],
          } as IPublicRivalState,
        }),
      });
      await renderLayout();

      expect(screen.getByTestId('rival-area')).toBeInTheDocument();
      expect(screen.getByTestId('rival-tech-count-computer')).toHaveTextContent(
        '1',
      );
    });

    it('keeps the mission area visible for the solo human player', async () => {
      mockContextValue = createMockContext({
        myPlayerId: 'player-1',
        gameState: createMockGameState({
          isSoloMode: true,
          rival: createMockRivalState(),
        }),
      });
      await renderLayout();

      expect(screen.getByTestId('mission-area')).toBeInTheDocument();
    });

    it('hides the mission area when viewing as the synthetic rival', async () => {
      mockContextValue = createMockContext({
        myPlayerId: 'rival:game-test-1',
        gameState: createMockGameState({
          isSoloMode: true,
          rival: createMockRivalState(),
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              playerName: 'Commander',
            }),
            createMockPlayerState({
              playerId: 'rival:game-test-1',
              playerName: 'Rival',
              seatIndex: 1,
              color: 'gray',
            }),
          ],
        }),
      });
      await renderLayout();

      expect(screen.queryByTestId('mission-area')).not.toBeInTheDocument();
    });

    it('shows action menu when it is my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      expect(
        screen.getByRole('button', { name: 'Launch Probe' }),
      ).toBeInTheDocument();
    });

    it('shows waiting message when not my turn', async () => {
      mockContextValue = createMockContext({
        isMyTurn: false,
        gameState: createMockGameState({ currentPlayerId: 'player-2' }),
      });
      await renderLayout();

      expect(screen.getByText('Waiting for Pilot...')).toBeInTheDocument();
    });

    it('shows pending input indicator', async () => {
      mockContextValue = createMockContext({
        pendingInput: {
          inputId: 'input-sector',
          type: EPlayerInputType.SECTOR,
          options: ['red-signal'],
        } as unknown as IGameContext['pendingInput'],
      });
      await renderLayout();

      expect(
        screen.getByRole('button', { name: 'red-signal' }),
      ).toBeInTheDocument();
    });

    it('reuses the tech board for tech option input and submits the clicked stack', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        pendingInput: {
          inputId: 'input-tech',
          type: EPlayerInputType.OPTION,
          options: [
            {
              id: ETechId.SCAN_EARTH_LOOK,
              label: ETechId.SCAN_EARTH_LOOK,
            },
          ],
        } as unknown as IGameContext['pendingInput'],
        gameState: createMockGameState({
          techBoard: {
            stacks: [
              {
                tech: ETech.SCAN,
                level: 0,
                remainingTiles: 4,
                firstTakeBonusAvailable: true,
                topTileBonuses: [{ type: ETechBonusType.DATA_2 }],
              },
            ],
          },
        }),
      });

      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      expect(within(actions).getByText('Tech Board')).toBeInTheDocument();

      fireEvent.click(within(actions).getByTestId('tech-stack-scan-tech-0'));

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'input-tech',
        type: EPlayerInputType.OPTION,
        optionId: ETechId.SCAN_EARTH_LOOK,
      });
    });

    it('shows free action bar when it is my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      expect(screen.getByTestId('free-action-bar')).toBeInTheDocument();
    });

    it('offers blue-tech bottom data slots before the top row is full', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              dataPoolCount: 2,
              computer: {
                columns: [
                  {
                    topFilled: true,
                    topReward: { vp: 2 },
                    techId: ETechId.COMPUTER_VP_CREDIT,
                    hasBottomSlot: true,
                    bottomFilled: false,
                    bottomReward: { credits: 1 },
                    techSlotAvailable: true,
                  },
                  {
                    topFilled: true,
                    topReward: null,
                    techId: null,
                    hasBottomSlot: false,
                    bottomFilled: false,
                    bottomReward: null,
                    techSlotAvailable: true,
                  },
                  {
                    topFilled: true,
                    topReward: null,
                    techId: null,
                    hasBottomSlot: false,
                    bottomFilled: false,
                    bottomReward: null,
                    techSlotAvailable: true,
                  },
                  {
                    topFilled: true,
                    topReward: null,
                    techId: null,
                    hasBottomSlot: false,
                    bottomFilled: false,
                    bottomReward: null,
                    techSlotAvailable: true,
                  },
                  {
                    topFilled: false,
                    topReward: null,
                    techId: null,
                    hasBottomSlot: false,
                    bottomFilled: false,
                    bottomReward: null,
                    techSlotAvailable: true,
                  },
                  {
                    topFilled: false,
                    topReward: null,
                    techId: null,
                    hasBottomSlot: false,
                    bottomFilled: false,
                    bottomReward: null,
                    techSlotAvailable: true,
                  },
                ],
              },
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByTestId('free-action-PLACE_DATA'));

      const dialog = screen.getByRole('dialog');
      expect(
        within(dialog).getByRole('button', { name: /Top slot C5/i }),
      ).toBeInTheDocument();

      fireEvent.click(
        within(dialog).getByRole('button', { name: /Bottom slot C1/i }),
      );

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.PLACE_DATA,
        slotIndex: 0,
      });
    });

    it('sends complete mission with projected branch metadata when exactly one branch is completable', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              playedMissions: [createCard('37', 'Planetary Geologic Map')],
              completableMissionBranches: [{ cardId: '37', branchIndex: 0 }],
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Complete Mission' }));

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '37',
        branchIndex: 0,
      });
    });

    it('arms and ends movement mode from the free action bar', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Move Probe (1)' }));

      expect(screen.getByTestId('movement-mode-hint')).toHaveTextContent(
        '1 step',
      );

      fireEvent.click(screen.getByRole('button', { name: 'End Move' }));

      expect(
        screen.queryByTestId('movement-mode-hint'),
      ).not.toBeInTheDocument();
    });

    it('sends a generic movement target for Mascamites capsule movement', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              probesInSpace: 0,
              movementPoints: 1,
            }),
          ],
          solarSystem: {
            ...createMockGameState().solarSystem,
            adjacency: {
              'space-0': ['space-1'],
            },
            probes: [],
            movablePieces: [
              {
                pieceId: 'capsule-1',
                pieceType: 'mascamites-capsule',
                playerId: 'player-1',
                spaceId: 'space-0',
                movementTarget: {
                  type: 'mascamites-capsule',
                  id: 'capsule-1',
                },
              },
            ],
          },
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Move Probe (1)' }));
      fireEvent.click(screen.getByTestId('solar-space-space-1'));

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.MOVEMENT,
        path: ['space-0', 'space-1'],
        target: {
          type: 'mascamites-capsule',
          id: 'capsule-1',
        },
      });
    });

    it('selects a planet before sending orbit main action payload', async () => {
      const sendAction = vi.fn();
      mockContextValue = createMockContext({
        sendAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: { credit: 10, energy: 5, data: 0, publicity: 3 },
            }),
          ],
          solarSystem: {
            ...createMockGameState().solarSystem,
            planetSpaceIds: { [EPlanet.MARS]: 'space-4' },
            probes: [
              {
                playerId: 'player-1',
                spaceId: 'space-4',
                probeId: 'probe-1',
              },
            ],
          },
          planetaryBoard: {
            planets: {
              [EPlanet.MARS]: {
                orbitSlots: [],
                landingSlots: [],
                firstOrbitClaimed: false,
                firstLandDataBonusTaken: [],
                moonOccupant: null,
              },
            },
          },
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Orbit' }));

      expect(screen.getByRole('tab', { name: 'Planets' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(sendAction).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('planet-target-mars'));

      expect(sendAction).toHaveBeenCalledWith({
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.MARS },
      });
    });

    it('hides free action bar when not my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: false });
      await renderLayout();

      expect(screen.queryByTestId('free-action-bar')).not.toBeInTheDocument();
    });

    it('opens buy-card chooser and lets player buy from row', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          cardRow: [createCard('row-1')],
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: { credit: 10, energy: 5, data: 0, publicity: 3 },
            }),
            createMockPlayerState({
              playerId: 'player-2',
              playerName: 'Pilot',
              seatIndex: 1,
              color: 'blue',
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByRole('button', { name: 'Buy Card (3 PR)' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Buy From Row' }),
      );

      expect(screen.getByRole('tab', { name: 'Cards' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      fireEvent.click(screen.getByTestId('card-row-row-1'));
      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.BUY_CARD,
        cardId: 'row-1',
      });
    });

    it('opens buy-card chooser and lets player draw from deck directly', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({ sendFreeAction });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByRole('button', { name: 'Buy Card (3 PR)' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Buy From Deck' }),
      );

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.BUY_CARD,
        fromDeck: true,
      });
    });

    it('disables resource exchange options the player cannot afford', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              handSize: 1,
              resources: { credit: 1, energy: 2, data: 0, publicity: 3 },
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByTestId('free-action-EXCHANGE_RESOURCES'));

      const dialog = screen.getByRole('dialog');
      expect(
        within(dialog).getByRole('button', { name: /2 Credits -> 1 Energy/i }),
      ).toBeDisabled();
      expect(
        within(dialog).getByRole('button', { name: /2 Energy -> 1 Credits/i }),
      ).toBeEnabled();
      expect(
        within(dialog).getByRole('button', { name: /2 Cards -> 1 Credits/i }),
      ).toBeDisabled();
    });

    it('sends the selected resource exchange payload', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: { credit: 2, energy: 0, data: 0, publicity: 3 },
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByTestId('free-action-EXCHANGE_RESOURCES'));

      expect(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: /2 Energy -> 1 Credits/i,
        }),
      ).toBeDisabled();

      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: /2 Credits -> 1 Energy/i,
        }),
      );

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      });
    });
  });

  describe('Sidebar', () => {
    it('opens right drawer and displays opponents in sidebar', async () => {
      await renderLayout();
      fireEvent.click(screen.getByRole('button', { name: 'Event Log' }));

      expect(screen.getByText('Pilot')).toBeInTheDocument();
    });

    it('shows event log section after opening drawer', async () => {
      await renderLayout();
      fireEvent.click(screen.getByRole('button', { name: 'Event Log' }));

      expect(screen.getByText('Event Log')).toBeInTheDocument();
    });

    it('keeps a compact event log in the board area across tab changes', async () => {
      mockContextValue = createMockContext({
        events: [
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'player-1',
            action: EMainAction.SCAN,
          } as never,
        ],
      });

      await renderLayout();

      expect(screen.getByTestId('event-log-compact')).toHaveTextContent(
        'Commander used Scan',
      );

      fireEvent.click(screen.getByRole('tab', { name: 'Tech' }));

      expect(screen.getByTestId('event-log-compact')).toHaveTextContent(
        'Commander used Scan',
      );
    });

    it('opens a scrollable full log dialog from the compact board log', async () => {
      mockContextValue = createMockContext({
        events: [
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'player-1',
            action: EMainAction.SCAN,
          } as never,
        ],
      });

      await renderLayout();

      fireEvent.click(screen.getByTestId('event-log-compact'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        within(screen.getByRole('dialog')).getByText('Event Log'),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole('dialog')).getByText('Commander used Scan'),
      ).toBeInTheDocument();
    });
  });

  describe('GameOverDialog', () => {
    it('does not render when game is not over', async () => {
      await renderLayout();

      expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
    });

    it('renders when phase is GAME_OVER', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({ phase: EPhase.GAME_OVER }),
      });
      await renderLayout();

      expect(screen.getAllByText('Game Over').length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Detailed scoring breakdown/),
      ).toBeInTheDocument();
    });
  });
});
