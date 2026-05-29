import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
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

function createCard(
  id: string,
  name = `Card ${id}`,
  overrides?: Partial<IBaseCard>,
): IBaseCard {
  return {
    id,
    name,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
    ...overrides,
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

    const roundLabel = screen.getByText('Round');
    const topBar = roundLabel.closest('header');
    expect(topBar).not.toBeNull();
    expect(roundLabel.nextElementSibling).toHaveTextContent('1');
    expect(within(topBar!).getByText('Awaiting Action')).toBeInTheDocument();
  });

  it('renders end-turn phase label instead of the raw translation key', async () => {
    mockContextValue = createMockContext({
      gameState: createMockGameState({ phase: EPhase.AWAIT_END_TURN }),
    });

    await renderLayout();

    expect(screen.getByText('Awaiting Turn End')).toBeInTheDocument();
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

    it('places the mobile player board below the solar board instead of behind an info overlay', async () => {
      await renderLayout();

      const solarColumn = screen.getByTestId('board-tab-solar-column');
      const mobileDashboard = screen.getByTestId('mobile-bottom-dashboard');

      expect(solarColumn).toContainElement(mobileDashboard);
      expect(mobileDashboard.closest('aside')).toHaveClass('lg:hidden');
      expect(
        screen.queryByRole('button', { name: /toggle sidebar/i }),
      ).not.toBeInTheDocument();
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

    it('does not offer the detail play action for an unaffordable selected card', async () => {
      const sendAction = vi.fn();
      mockContextValue = createMockContext({
        sendAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              handSize: 2,
              hand: [
                createCard('expensive', 'Expensive', { price: 5 }),
                createCard('free', 'Free', { price: 0 }),
              ],
              resources: {
                [EResource.CREDIT]: 1,
                [EResource.ENERGY]: 5,
                [EResource.DATA]: 0,
                [EResource.PUBLICITY]: 3,
                [EResource.SIGNAL_TOKEN]: 0,
              },
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

      fireEvent.click(screen.getByTestId('hand-card-expensive'));
      const dialog = screen.getByRole('dialog');

      expect(
        within(dialog).queryByTestId('card-detail-play-card'),
      ).not.toBeInTheDocument();
      expect(sendAction).not.toHaveBeenCalled();
    });

    it('disables play-card action when the only revealed hand card is unaffordable', async () => {
      const sendAction = vi.fn();
      mockContextValue = createMockContext({
        sendAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              handSize: 1,
              hand: [createCard('expensive', 'Expensive', { price: 5 })],
              resources: {
                [EResource.CREDIT]: 1,
                [EResource.ENERGY]: 5,
                [EResource.DATA]: 0,
                [EResource.PUBLICITY]: 3,
                [EResource.SIGNAL_TOKEN]: 0,
              },
            }),
          ],
        }),
      });

      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      const playCard = within(actions).getByTestId(
        `action-menu-${EMainAction.PLAY_CARD}`,
      );

      expect(playCard).toBeDisabled();
      fireEvent.click(playCard);
      expect(sendAction).not.toHaveBeenCalled();
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

      const rivalArea = screen.getByTestId('rival-area');
      expect(rivalArea).toBeInTheDocument();
      expect(
        within(rivalArea).getByTestId('rival-current-card'),
      ).toHaveTextContent('S.1');
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

      const rivalArea = screen.getByTestId('rival-area');
      expect(rivalArea).toBeInTheDocument();
      expect(
        within(rivalArea).getByTestId('rival-tech-count-computer'),
      ).toHaveTextContent('1');
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

    it('does not render Orbital Dynamics move options in the action dock', async () => {
      mockContextValue = createMockContext({
        pendingInput: {
          inputId: 'orbital-dynamics-move',
          type: EPlayerInputType.OPTION,
          title: 'Choose an Orbital Dynamics move',
          options: [
            { id: 'probe-1:ring-1-cell-1', label: 'probe-1 to ring-1-cell-1' },
          ],
        } as unknown as IGameContext['pendingInput'],
      });
      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      expect(
        within(actions).queryByText('Choose an Orbital Dynamics move'),
      ).not.toBeInTheDocument();
      expect(
        within(actions).queryByRole('button', {
          name: /probe-1 to ring-1-cell-1/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(actions).getByText('Select a highlighted space on the board.'),
      ).toBeInTheDocument();
    });

    it('keeps Orbital Dynamics done response available in the action dock', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        pendingInput: {
          inputId: 'orbital-dynamics-move',
          type: EPlayerInputType.OPTION,
          title: 'Choose an Orbital Dynamics move',
          options: [
            { id: 'done', label: 'Done' },
            { id: 'probe-2:ring-1-cell-2', label: 'probe-2 to ring-1-cell-2' },
          ],
        } as unknown as IGameContext['pendingInput'],
      });
      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      fireEvent.click(within(actions).getByRole('button', { name: 'Done' }));

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'orbital-dynamics-move',
        type: EPlayerInputType.OPTION,
        optionId: 'done',
      });
    });

    it('submits Orbital Dynamics map target clicks through the game context', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        gameState: createMockGameState({
          solarSystem: {
            ...createMockGameState().solarSystem,
            adjacency: {
              'space-0': ['space-1'],
              'space-1': ['space-0'],
            },
            probes: [
              {
                playerId: 'player-1',
                spaceId: 'space-0',
                probeId: 'probe-1',
              },
            ],
            movablePieces: [
              {
                pieceId: 'probe-1',
                pieceType: 'probe',
                playerId: 'player-1',
                spaceId: 'space-0',
                movementTarget: { type: 'probe', id: 'probe-1' },
              },
            ],
          },
        }),
        pendingInput: {
          inputId: 'orbital-dynamics-move',
          type: EPlayerInputType.OPTION,
          title: 'Choose an Orbital Dynamics move',
          options: [{ id: 'probe-1:space-1', label: 'probe-1 to space-1' }],
        } as unknown as IGameContext['pendingInput'],
      });
      await renderLayout();

      fireEvent.click(screen.getByTestId('solar-space-space-1'));

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'orbital-dynamics-move',
        type: EPlayerInputType.OPTION,
        optionId: 'probe-1:space-1',
      });
    });

    it('wraps setup-choice pending input in the setup-choice shell', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        gameState: createMockGameState({
          phase: 'SETUP_CHOICE' as EPhase,
        }),
        pendingInput: {
          inputId: 'setup-choice-1',
          type: EPlayerInputType.OPTION,
          title: 'Choose organization',
          setupChoice: {
            kind: 'organization',
            stepIndex: 0,
            totalSteps: 1,
            minSelections: 1,
            maxSelections: 1,
          },
          options: [{ id: 'org-a', label: 'Org A' }],
        } as unknown as IGameContext['pendingInput'],
      });

      await renderLayout();

      expect(screen.getByTestId('setup-choice-shell')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Org A' }));

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'setup-choice-1',
        type: EPlayerInputType.OPTION,
        optionId: 'org-a',
      });
    });

    it('renders compact tech-id option input in the action dock and submits the selected tech id', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        gameState: createMockGameState({
          techBoard: {
            stacks: [
              {
                tech: ETech.SCAN,
                level: 0,
                remainingTiles: 2,
                firstTakeBonusAvailable: true,
                topTileBonuses: [{ type: ETechBonusType.DATA_2 }],
              },
            ],
          },
        }),
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
      });

      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      expect(within(actions).queryByText('Tech Board')).not.toBeInTheDocument();
      expect(
        within(actions).getByTestId(
          `input-tech-tile-${ETechId.SCAN_EARTH_LOOK}`,
        ),
      ).toBeInTheDocument();
      expect(
        within(actions).getByTestId(
          `input-tech-first-bonus-${ETechId.SCAN_EARTH_LOOK}`,
        ),
      ).toHaveTextContent('2VP available');
      expect(
        within(actions).getByLabelText('2 data bonus'),
      ).toBeInTheDocument();

      fireEvent.click(
        within(actions).getByTestId(`input-option-${ETechId.SCAN_EARTH_LOOK}`),
      );

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'input-tech',
        type: EPlayerInputType.OPTION,
        optionId: ETechId.SCAN_EARTH_LOOK,
      });
    });

    it('renders compact tech-category input in the action dock', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        pendingInput: {
          inputId: 'input-tech-category',
          type: EPlayerInputType.TECH,
          options: [ETech.SCAN],
        } as unknown as IGameContext['pendingInput'],
      });

      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      expect(within(actions).queryByText('Tech Board')).not.toBeInTheDocument();

      fireEvent.click(
        within(actions).getByRole('button', { name: /Earth \(or adj\.\)/i }),
      );

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'input-tech-category',
        type: EPlayerInputType.TECH,
        tech: ETech.SCAN,
      });
    });

    it('shows free action bar when it is my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      expect(screen.getByTestId('free-action-bar')).toBeInTheDocument();
    });

    it('sends spend signal token from the scan free-action rail', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          phase: EPhase.IN_RESOLUTION,
          scanActionInProgress: true,
          spaceAgencyOptions: {
            enabled: true,
            agencies: false,
            startResourceCards: false,
            newDeck: true,
            newAlienSpecies: false,
          },
          cardRow: [createCard('row-1')],
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: {
                [EResource.CREDIT]: 10,
                [EResource.ENERGY]: 5,
                [EResource.DATA]: 0,
                [EResource.PUBLICITY]: 3,
                [EResource.SIGNAL_TOKEN]: 1,
              },
            }),
          ],
        }),
        pendingInput: {
          inputId: 'input-scan-pool',
          type: EPlayerInputType.OPTION,
          title: 'Scan: choose sub-action',
          options: [{ id: 'mark-earth', label: 'Mark Earth' }],
        } as unknown as IGameContext['pendingInput'],
      });

      await renderLayout();

      fireEvent.click(screen.getByTestId('free-action-SPEND_SIGNAL_TOKEN'));

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.SPEND_SIGNAL_TOKEN,
      });
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

    it('sends organization id when using organization power', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              organizationIds: [EOrganizationId.STRATUS_CORE],
              usableOrganizationPowerIds: [EOrganizationId.STRATUS_CORE],
              oncePerRoundUsed: { [EOrganizationId.STRATUS_CORE]: false },
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(
        screen.getByTestId(
          `organization-power-${EOrganizationId.STRATUS_CORE}`,
        ),
      );

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.USE_ORGANIZATION_POWER,
        organizationId: EOrganizationId.STRATUS_CORE,
      });
    });

    it('opens the board tab when using Orbital Dynamics power', async () => {
      const sendFreeAction = vi.fn();
      useGameViewStore.setState({ activeTab: 'cards' });
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              organizationIds: [EOrganizationId.ORBITAL_DYNAMICS],
              usableOrganizationPowerIds: [EOrganizationId.ORBITAL_DYNAMICS],
              oncePerRoundUsed: { [EOrganizationId.ORBITAL_DYNAMICS]: false },
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(
        screen.getByTestId(
          `organization-power-${EOrganizationId.ORBITAL_DYNAMICS}`,
        ),
      );

      expect(useGameViewStore.getState().activeTab).toBe('board');
      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.USE_ORGANIZATION_POWER,
        organizationId: EOrganizationId.ORBITAL_DYNAMICS,
      });
    });

    it('sends orbit main action with no payload — server returns the planet picker', async () => {
      // The picker-driven flow: clicking Orbit dispatches the action
      // immediately. The server responds with a SelectOption listing
      // every eligible planet (with cost-aware labels), and the
      // existing pendingInput pipeline drives the rest of the UX.
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
                moonOccupants: [],
              },
            },
          },
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Orbit' }));

      expect(sendAction).toHaveBeenCalledWith({
        type: EMainAction.ORBIT,
      });
    });

    it('sends land main action with no payload — server returns the planet picker', async () => {
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
                firstLandDataBonusTaken: [false, false],
                moonOccupants: [],
              },
            },
          },
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Land' }));

      expect(sendAction).toHaveBeenCalledWith({
        type: EMainAction.LAND,
      });
    });

    it('resolves orbit slot picker clicks through input instead of direct planet actions', async () => {
      useGameViewStore.setState({ activeTab: 'planets' });
      const sendAction = vi.fn();
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendAction,
        sendInput,
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
                moonOccupants: [],
              },
            },
          },
        }),
        pendingInput: {
          inputId: 'orbit-slot',
          type: EPlayerInputType.OPTION,
          title: 'Choose orbit slot',
          options: [
            {
              id: `main-action-orbit-slot-${EPlanet.MARS}-first`,
              label: 'Take first-orbit slot',
            },
          ],
        } as unknown as IGameContext['pendingInput'],
      });
      await renderLayout();

      fireEvent.click(screen.getByTestId(`planet-target-${EPlanet.MARS}`));

      expect(sendInput).toHaveBeenCalledWith({
        inputId: 'orbit-slot',
        type: EPlayerInputType.OPTION,
        optionId: `main-action-orbit-slot-${EPlanet.MARS}-first`,
      });
      expect(sendAction).not.toHaveBeenCalled();
    });

    it('hides free action bar when not my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: false });
      await renderLayout();

      expect(screen.queryByTestId('free-action-bar')).not.toBeInTheDocument();
    });

    it('clicks Buy Card free action → jumps to Cards tab → row pick → confirm dialog', async () => {
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
      // Buy Card free action just jumps to the Cards tab; the buy
      // chooser strip is permanently mounted there.
      fireEvent.click(screen.getByRole('button', { name: 'Buy Card (3 PR)' }));

      expect(screen.getByRole('tab', { name: 'Cards' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      const chooser = screen.getByTestId('cards-tab-buy-chooser');
      fireEvent.click(within(chooser).getByTestId('cards-tab-buy-from-row'));

      fireEvent.click(screen.getByTestId('card-row-row-1'));
      // After picking a row card, a confirm dialog shows the card
      // (rendered at CardDetail-equivalent size) and the 3-publicity
      // cost; the buy action fires on Confirm.
      const confirmDialog = await screen.findByRole('dialog');
      fireEvent.click(
        within(confirmDialog).getByRole('button', { name: 'Confirm' }),
      );
      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.BUY_CARD,
        cardId: 'row-1',
      });
    });

    it('Cards tab Buy From Deck → confirm dialog → BUY_CARD fromDeck', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({ sendFreeAction });
      await renderLayout();

      // Cards tab is reachable directly via the tab; the Buy chooser
      // strip is always visible there.
      fireEvent.click(screen.getByRole('tab', { name: 'Cards' }));
      const chooser = screen.getByTestId('cards-tab-buy-chooser');
      fireEvent.click(within(chooser).getByTestId('cards-tab-buy-from-deck'));

      const confirmDialog = await screen.findByRole('dialog');
      fireEvent.click(
        within(confirmDialog).getByRole('button', { name: 'Confirm' }),
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

    it('sends selected hand card ids when exchanging cards', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              handSize: 3,
              hand: [
                { id: 'card-a', name: 'Card A' },
                { id: 'card-b', name: 'Card B' },
                { id: 'card-c', name: 'Card C' },
              ] as never,
              resources: { credit: 0, energy: 0, data: 0, publicity: 3 },
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByTestId('free-action-EXCHANGE_RESOURCES'));
      const dialog = screen.getByRole('dialog');

      fireEvent.click(within(dialog).getByTestId('exchange-spend-card-card-a'));
      fireEvent.click(within(dialog).getByTestId('exchange-spend-card-card-c'));
      fireEvent.click(
        within(dialog).getByRole('button', {
          name: /2 Cards -> 1 Credits/i,
        }),
      );

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CARD,
        to: EResource.CREDIT,
        spentCardIds: ['card-a', 'card-c'],
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
        'Commander scanned',
      );

      fireEvent.click(screen.getByRole('tab', { name: 'Tech' }));

      expect(screen.getByTestId('event-log-compact')).toHaveTextContent(
        'Commander scanned',
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
      // Player names are wrapped in tinted spans, so use textContent
      // for the cross-element match.
      expect(
        screen.getByRole('dialog').textContent?.includes('Commander scanned'),
      ).toBe(true);
    });
  });

  describe('GameOverDialog', () => {
    it('does not render when game is not over', async () => {
      await renderLayout();

      expect(screen.queryByText('Mission Complete')).not.toBeInTheDocument();
    });

    it('renders when phase is GAME_OVER', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({ phase: EPhase.GAME_OVER }),
      });
      await renderLayout();

      expect(
        screen.getAllByText('Mission Complete').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Detailed scoring breakdown/),
      ).toBeInTheDocument();
    });
  });
});
