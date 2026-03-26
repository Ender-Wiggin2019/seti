# SETI Client Architecture

> Client-side architecture for the SETI board game. Covers routing, state management, WebSocket integration, game UI components, PlayerInput rendering, and engineering concerns.

---

## 1. Package Overview

New package: `packages/client` (`@seti/client`)

```
packages/client/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── components.json                  # shadcn/ui config
│
├── public/
│   └── assets/                      # Static assets (favicon, sounds, etc.)
│
├── src/
│   ├── main.tsx                     # React root + providers
│   ├── App.tsx                      # Router outlet + global layout
│   ├── routes.tsx                   # Route definitions
│   │
│   ├── config/
│   │   ├── theme.ts                 # Design tokens (colors, spacing, typography)
│   │   ├── env.ts                   # Environment variable access
│   │   └── constants.ts             # Client constants (timeouts, limits, etc.)
│   │
│   ├── api/                         # REST + WebSocket client layer
│   │   ├── httpClient.ts            # Axios/fetch wrapper with JWT interceptor
│   │   ├── wsClient.ts              # Socket.IO client singleton
│   │   ├── authApi.ts               # Login, register, refresh token
│   │   ├── lobbyApi.ts              # Room CRUD
│   │   └── types.ts                 # API request/response types (re-export from @seti/common)
│   │
│   ├── hooks/                       # Shared React hooks
│   │   ├── useAuth.ts               # Auth state + token management
│   │   ├── useSocket.ts             # Socket.IO connection lifecycle
│   │   ├── useGameState.ts          # Subscribe to game:state events
│   │   ├── useGameActions.ts        # Emit game:action / game:freeAction / game:input
│   │   ├── usePlayerInput.ts        # Current pending PlayerInput + response helpers
│   │   ├── useGameEvents.ts         # Subscribe to game:event for log/animation
│   │   ├── useGameError.ts          # game:error toast handling
│   │   ├── useReconnection.ts       # Auto-reconnect + state resync
│   │   └── useSound.ts              # SFX triggers (optional, future)
│   │
│   ├── stores/                      # Client-only transient state (Zustand)
│   │   ├── authStore.ts             # JWT token, user profile
│   │   ├── gameViewStore.ts         # UI-only state: selected tab, zoom, hovered piece
│   │   └── settingsStore.ts         # User preferences (volume, language, animations)
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── auth/
│   │   │   └── AuthPage.tsx         # Login + Register tabs
│   │   ├── profile/
│   │   │   └── ProfilePage.tsx      # User center
│   │   ├── lobby/
│   │   │   ├── LobbyPage.tsx        # Room list + create room
│   │   │   ├── RoomPage.tsx         # Room detail: players, settings, start
│   │   │   └── GameSettingsPanel.tsx # Game options configuration
│   │   └── game/
│   │       ├── GamePage.tsx          # ★ Core game page (layout orchestrator)
│   │       ├── GameLayout.tsx        # Responsive grid: board area + sidebar + bottom bar
│   │       └── GameOverDialog.tsx    # Final scoring breakdown
│   │
│   ├── features/                    # Domain feature modules (game UI)
│   │   ├── board/                   # Board visualizations
│   │   │   ├── SolarSystemView.tsx  # Concentric rings, discs, probes, rotation animation
│   │   │   ├── DiscLayer.tsx        # Single rotatable disc with spaces
│   │   │   ├── ProbeToken.tsx       # Probe figure on solar system
│   │   │   ├── SectorView.tsx       # Sector data slots, signal markers
│   │   │   ├── SectorGrid.tsx       # All 8 sectors layout
│   │   │   ├── PlanetaryBoardView.tsx  # Planets: orbits, landings, moons
│   │   │   ├── PlanetCard.tsx       # Single planet with orbit/lander slots
│   │   │   ├── TechBoardView.tsx    # 12 tech stacks grid
│   │   │   └── TechStack.tsx        # Single tech stack (tiles, 2VP marker)
│   │   │
│   │   ├── player/                  # Player dashboard & status
│   │   │   ├── PlayerDashboard.tsx  # Current player's full dashboard
│   │   │   ├── ResourceBar.tsx      # Credits, energy, publicity, score
│   │   │   ├── IncomeTracker.tsx    # Per-round income display
│   │   │   ├── ComputerView.tsx     # Data computer: top/bottom slots, data tokens
│   │   │   ├── DataPoolView.tsx     # Data pool (cap 6)
│   │   │   ├── PieceInventory.tsx   # Available probes/orbiters/landers/markers
│   │   │   ├── HandView.tsx         # Cards in hand (fan layout or grid)
│   │   │   ├── PlayedMissions.tsx   # Active mission cards with trigger state
│   │   │   ├── TechDisplay.tsx      # Player's acquired techs
│   │   │   └── OpponentSummary.tsx  # Compact view of other players' public state
│   │   │
│   │   ├── cards/                   # Card display & interaction
│   │   │   ├── CardRowView.tsx      # 3 open market cards
│   │   │   ├── EndOfRoundStacks.tsx # 4 end-of-round card stacks
│   │   │   ├── CardDetail.tsx       # Enlarged card view (uses @ender-seti/cards)
│   │   │   ├── CardList.tsx         # Selectable card list for PlayerInput
│   │   │   └── CardPreview.tsx      # Hover/tooltip card preview
│   │   │
│   │   ├── actions/                 # Action UI & menus
│   │   │   ├── ActionMenu.tsx       # Main OrOptions menu (8 main actions)
│   │   │   ├── FreeActionBar.tsx    # Free action buttons (movement, place data, etc.)
│   │   │   ├── ActionConfirm.tsx    # Confirmation dialog for costly actions
│   │   │   └── UndoButton.tsx       # Request undo
│   │   │
│   │   ├── input/                   # ★ PlayerInput renderers (1:1 with server inputs)
│   │   │   ├── InputRenderer.tsx    # Dispatcher: routes PlayerInputModel → component
│   │   │   ├── SelectOptionInput.tsx
│   │   │   ├── SelectCardInput.tsx
│   │   │   ├── SelectSectorInput.tsx
│   │   │   ├── SelectPlanetInput.tsx
│   │   │   ├── SelectTechInput.tsx
│   │   │   ├── SelectGoldTileInput.tsx
│   │   │   ├── SelectResourceInput.tsx
│   │   │   ├── SelectTraceInput.tsx
│   │   │   ├── SelectEndOfRoundCardInput.tsx
│   │   │   ├── OrOptionsInput.tsx   # Tabbed or accordion sub-input picker
│   │   │   └── AndOptionsInput.tsx  # Sequential sub-input stepper
│   │   │
│   │   ├── alien/                   # Alien species UI
│   │   │   ├── AlienBoardView.tsx   # Discovered alien board + trace spaces
│   │   │   ├── DiscoveryTrack.tsx   # 6 discovery spaces (3 per alien)
│   │   │   └── AlienCardView.tsx    # Alien-specific card rendering
│   │   │
│   │   ├── scoring/                 # Scoring UI
│   │   │   ├── MilestoneTrack.tsx   # Gold + neutral milestones on score track
│   │   │   ├── GoldTileSelector.tsx # Gold scoring tile selection (milestone reward)
│   │   │   └── ScoreBreakdown.tsx   # End-game scoring detail table
│   │   │
│   │   └── log/                     # Game event log
│   │       ├── EventLog.tsx         # Scrollable event history
│   │       └── EventEntry.tsx       # Single event with icon + description
│   │
│   ├── components/                  # Shared UI components (non-domain)
│   │   ├── ui/                      # shadcn/ui generated components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── input.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Global app shell (nav, footer)
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ProtectedRoute.tsx       # Auth guard wrapper
│   │
│   ├── lib/
│   │   ├── cn.ts                    # Tailwind class merge utility
│   │   └── formatters.ts            # Resource/score display formatters
│   │
│   └── types/
│       ├── client.ts                # Client-only types (UI state, view models)
│       └── re-exports.ts            # Re-export from @seti/common/types/protocol
│
├── test/
│   ├── setup.ts                     # Vitest setup (jsdom, MSW, etc.)
│   ├── mocks/
│   │   ├── handlers.ts              # MSW request handlers
│   │   ├── gameState.ts             # Mock IPublicGameState fixtures
│   │   └── socket.ts                # Mock Socket.IO client
│   └── ...                          # Co-located tests preferred
│
└── e2e/
    └── ...                          # Playwright E2E tests (future)
```

---

## 2. Technology Stack

### 2.1 Core Framework

| Concern | Choice | Rationale |
|---------|--------|-----------|
| UI Library | **React 18** | Concurrent features (Suspense, useTransition) for smooth game updates |
| Build Tool | **Vite** | Fast HMR, ESM-native, perfect for monorepo + Turbo |
| Styling | **Tailwind CSS 4** | Utility-first, consistent with design tokens, zero runtime |
| Component Library | **shadcn/ui** | Copy-paste components, fully customizable, Radix primitives underneath |
| Router | **TanStack Router** | Type-safe routing, built-in search param validation, loader patterns |
| Server State | **TanStack Query (React Query)** | REST API caching, background refetch, optimistic updates |
| Client State | **Zustand** | Minimal boilerplate for UI-only transient state (no game logic) |
| WebSocket | **Socket.IO Client** | Matches server's Socket.IO; auto-reconnect, room model |
| Card Rendering | **@ender-seti/cards** | Existing card component library with sprites and CSS |
| Shared Types | **@ender-seti/common** | Card data, enums, and (future) protocol types |
| i18n | **react-i18next** | Already used by @ender-seti/cards, consistent across packages |
| Form Validation | **Zod** | Schema validation for auth forms, game settings |

### 2.2 Development Dependencies

| Concern | Choice |
|---------|--------|
| Test Framework | Vitest + @testing-library/react |
| Mock Server | MSW (Mock Service Worker) |
| E2E (future) | Playwright |
| Linting | Biome (aligned with monorepo root) |
| Type Check | TypeScript 5.x (strict) |

### 2.3 Dependency Summary

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@tanstack/react-router": "^1.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^5.x",
    "socket.io-client": "^4.x",
    "zod": "^3.x",
    "react-i18next": "^15.x",
    "i18next": "^24.x",
    "tailwind-merge": "^3.x",
    "clsx": "^2.x",
    "class-variance-authority": "^0.7.x",
    "@ender-seti/common": "workspace:*",
    "@ender-seti/cards": "workspace:*"
  },
  "devDependencies": {
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "postcss": "^8.x",
    "typescript": "^5.x",
    "vitest": "^3.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "jsdom": "^26.x",
    "msw": "^2.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x"
  }
}
```

---

## 3. Routing

### 3.1 Route Map

```
/                          → Redirect to /lobby (if authed) or /auth
/auth                      → AuthPage (login + register tabs)
/profile                   → ProfilePage (user center)
/lobby                     → LobbyPage (room list)
/room/:roomId              → RoomPage (room detail + game settings + start)
/game/:gameId              → GamePage (★ core game page)
/game/:gameId/spectate     → GamePage (spectator mode, read-only)
```

### 3.2 Route Configuration (TanStack Router)

```typescript
const routeTree = rootRoute.addChildren([
  authRoute,        // /auth — public
  protectedRoute.addChildren([
    lobbyRoute,     // /lobby
    profileRoute,   // /profile
    roomRoute,      // /room/$roomId
    gameRoute,      // /game/$gameId
    spectateRoute,  // /game/$gameId/spectate
  ]),
]);
```

**Auth guard:** `protectedRoute` uses `beforeLoad` to check JWT presence. If absent, redirect to `/auth`.

**Game route loader:** `gameRoute.loader` fetches initial game state via REST (fallback) before connecting WebSocket, ensuring the page has data on first paint.

### 3.3 Search Params

`/game/$gameId` supports search params for debug/dev:

```typescript
const gameSearchSchema = z.object({
  debug: z.boolean().optional(),       // Show debug overlay
  playerId: z.string().optional(),     // Override viewer (dev only)
});
```

---

## 4. State Management Architecture

### 4.1 Three-Layer State Model

```
┌────────────────────────────────────────────────────┐
│                   React Tree                        │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ TanStack      │  │ Game State   │  │ Zustand  │ │
│  │ Query         │  │ (WebSocket)  │  │          │ │
│  │               │  │              │  │          │ │
│  │ REST API      │  │ IPublicGame  │  │ UI-only  │ │
│  │ cache:        │  │ State from   │  │ state:   │ │
│  │ - auth        │  │ server push  │  │ - zoom   │ │
│  │ - lobby       │  │              │  │ - hover  │ │
│  │ - profile     │  │ Single source│  │ - tabs   │ │
│  │               │  │ of truth for │  │ - prefs  │ │
│  │               │  │ game data    │  │          │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│        ↕                  ↕                ↕       │
│      httpClient        wsClient        localStorage│
└────────────────────────────────────────────────────┘
```

| Layer | Tool | Data | Lifetime |
|-------|------|------|----------|
| REST API state | TanStack Query | Auth, lobby rooms, profile, initial game load | Cache with auto-refetch |
| Game state | React Context + useRef | `IPublicGameState` from WebSocket | Game session lifetime |
| UI view state | Zustand | Zoom level, selected tab, hover, preferences | Persistent (localStorage) |

### 4.2 Game State Context

The game state is **not** stored in TanStack Query because it arrives via WebSocket push, not REST request-response. Instead, a dedicated React Context holds the latest state:

```typescript
interface IGameContext {
  gameState: IPublicGameState | null;
  pendingInput: IPlayerInputModel | null;
  isConnected: boolean;
  isReconnecting: boolean;
  myPlayerId: string;
  isMyTurn: boolean;
  isSpectator: boolean;

  sendAction: (action: IMainActionRequest) => void;
  sendFreeAction: (action: IFreeActionRequest) => void;
  sendInput: (response: IInputResponse) => void;
  requestUndo: () => void;
}
```

**Update strategy:** On each `game:state` event, the entire `IPublicGameState` is replaced (not patched). This ensures consistency — the server is the single source of truth. React's concurrent rendering + `useDeferredValue` prevents jank on large state updates.

### 4.3 Optimistic UI (Selective)

Optimistic updates are applied only for low-risk, visually immediate interactions:

| Action | Optimistic? | Reason |
|--------|-------------|--------|
| Free action: Place data | Yes | Visual feedback on drag-drop; revert on server rejection |
| Free action: Movement | Yes | Animate probe along path immediately |
| Main action submit | No | Wait for server validation + full state push |
| Card selection | No | Server may reject based on hidden state |
| Resource exchange | No | Requires server validation of balance |

Optimistic state is held in a `useRef` overlay that merges with the last server state. On the next `game:state` push, the overlay is cleared.

---

## 5. Communication Layer

### 5.1 HTTP Client (REST)

```typescript
// api/httpClient.ts
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
});

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  },
);
```

**REST endpoints consumed:**

| Endpoint | Method | Usage |
|----------|--------|-------|
| `POST /auth/register` | POST | Create account |
| `POST /auth/login` | POST | Get JWT |
| `GET /auth/me` | GET | Current user profile |
| `PUT /auth/me` | PUT | Update profile |
| `GET /lobby/rooms` | GET | List rooms |
| `POST /lobby/rooms` | POST | Create room |
| `GET /lobby/rooms/:id` | GET | Room detail |
| `POST /lobby/rooms/:id/join` | POST | Join room |
| `POST /lobby/rooms/:id/leave` | POST | Leave room |
| `POST /lobby/rooms/:id/start` | POST | Start game |
| `GET /game/:id/state` | GET | Fetch full state (reconnection fallback) |

### 5.2 WebSocket Client (Socket.IO)

```typescript
// api/wsClient.ts
import { io, Socket } from 'socket.io-client';

class WsClient {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    return this.socket;
  }

  joinGame(gameId: string): void {
    this.socket?.emit('room:join', { gameId });
  }

  leaveGame(gameId: string): void {
    this.socket?.emit('room:leave', { gameId });
  }

  sendAction(gameId: string, action: IMainActionRequest): void {
    this.socket?.emit('game:action', { gameId, action });
  }

  sendFreeAction(gameId: string, action: IFreeActionRequest): void {
    this.socket?.emit('game:freeAction', { gameId, action });
  }

  sendInput(gameId: string, inputResponse: IInputResponse): void {
    this.socket?.emit('game:input', { gameId, inputResponse });
  }

  onState(cb: (state: IPublicGameState) => void): void {
    this.socket?.on('game:state', cb);
  }

  onWaiting(cb: (data: { playerId: string; input: IPlayerInputModel }) => void): void {
    this.socket?.on('game:waiting', cb);
  }

  onEvent(cb: (event: TGameEvent) => void): void {
    this.socket?.on('game:event', cb);
  }

  onError(cb: (error: { code: string; message: string }) => void): void {
    this.socket?.on('game:error', cb);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const wsClient = new WsClient();
```

### 5.3 WebSocket Event Flow (Client Perspective)

```
                          Client                         Server
                            │                              │
  [Enter /game/:gameId]     │                              │
                            │── room:join ────────────────>│
                            │<── game:state ──────────────│  (full state push)
                            │                              │
  [My turn: show action     │<── game:waiting ────────────│  (PlayerInputModel)
   menu]                    │                              │
                            │── game:action ─────────────>│  (main action)
                            │<── game:state ──────────────│  (updated state)
                            │                              │
  [Server needs more info]  │<── game:waiting ────────────│  (follow-up input)
                            │── game:input ──────────────>│  (input response)
                            │<── game:state ──────────────│
                            │                              │
  [Free action]             │── game:freeAction ─────────>│
                            │<── game:state ──────────────│
                            │                              │
  [Other player acts]       │<── game:state ──────────────│  (pushed to all)
  [Event log]               │<── game:event ──────────────│
                            │                              │
  [Disconnect]              │── ✕ connection lost          │
  [Reconnect]               │── room:join ────────────────>│
                            │<── game:state ──────────────│  (full resync)
```

### 5.4 Reconnection Strategy

```typescript
// hooks/useReconnection.ts
function useReconnection(gameId: string) {
  const { socket } = useSocket();

  useEffect(() => {
    const handleReconnect = () => {
      wsClient.joinGame(gameId);
    };

    socket?.on('reconnect', handleReconnect);

    const handleDisconnect = (reason: string) => {
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    };
    socket?.on('disconnect', handleDisconnect);

    return () => {
      socket?.off('reconnect', handleReconnect);
      socket?.off('disconnect', handleDisconnect);
    };
  }, [socket, gameId]);
}
```

On reconnect, the server automatically pushes the full projected state. If the player has a pending `PlayerInput`, it is re-sent via `game:waiting`.

---

## 6. Page Breakdown

### 6.1 Auth Page (`/auth`)

**Components:** `AuthPage` → shadcn `Tabs` switching between `LoginForm` and `RegisterForm`.

| Field | Validation |
|-------|-----------|
| Email | Zod email format |
| Password | Min 8 chars |
| Username | Min 2 chars, alphanumeric |

**Flow:** On success → store JWT in `authStore` → redirect to `/lobby`.

### 6.2 Profile Page (`/profile`)

**Components:** `ProfilePage` with user info card, game history list, stats summary.

**Data:** TanStack Query fetching `GET /auth/me` and `GET /lobby/rooms?userId=xxx&status=finished`.

### 6.3 Lobby Page (`/lobby`)

**Components:**
- `LobbyPage` — room list with filtering (waiting/playing/finished)
- `CreateRoomDialog` — game settings form
- `RoomCard` — compact room preview (player count, status, host)

**Data:** `useQuery('rooms', lobbyApi.listRooms)` with 5s polling or WebSocket room events.

### 6.4 Room Page (`/room/:roomId`)

**Components:**
- `RoomPage` — room detail
- `PlayerSlot` — avatar + name + ready state for each seat
- `GameSettingsPanel` — configurable game options

**Game Options (from server `IGameOptions`):**

| Option | Type | Default |
|--------|------|---------|
| Player Count | 1-4 | 2 |
| Alien Modules Enabled | boolean[] | All enabled |
| Undo Allowed | boolean | true |
| Timer Per Turn (seconds) | number | 0 (no timer) |
| Expansions | enum[] | Base only |

**Flow:** Host clicks "Start Game" → `POST /lobby/rooms/:id/start` → server creates `Game` → redirects all players to `/game/:gameId`.

### 6.5 Game Page (`/game/:gameId`) — Core

This is the most complex page. See §7 for detailed component breakdown.

---

## 7. Game Page — Component Architecture

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar: Round indicator | Phase | Current player | Timer       │
├───────────────────────────────────────────┬─────────────────────┤
│                                           │                     │
│         Main Board Area                   │    Right Sidebar    │
│                                           │                     │
│  ┌──────────────────────────────────┐     │  ┌───────────────┐  │
│  │     SolarSystemView              │     │  │ EventLog      │  │
│  │     (rings, probes, rotation)    │     │  │ (scrollable)  │  │
│  │                                  │     │  │               │  │
│  └──────────────────────────────────┘     │  └───────────────┘  │
│                                           │  ┌───────────────┐  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │ Opponent      │  │
│  │ Sectors  │ │Planetary │ │ TechBoard│  │  │ Summary       │  │
│  │ Grid     │ │ Board    │ │          │  │  │ (compact)     │  │
│  └──────────┘ └──────────┘ └──────────┘  │  └───────────────┘  │
│                                           │                     │
│  (Board sub-views toggle via tabs)        │  ┌───────────────┐  │
│                                           │  │ Alien Boards  │  │
│                                           │  │ & Discovery   │  │
│                                           │  └───────────────┘  │
├───────────────────────────────────────────┴─────────────────────┤
│                     Bottom Bar                                  │
│  ┌───────────────────┬──────────────────┬─────────────────────┐ │
│  │  PlayerDashboard  │   HandView       │  ActionMenu /       │ │
│  │  (resources,      │   (cards in      │  InputRenderer      │ │
│  │  computer, pool,  │   hand, fan or   │  (main actions /    │ │
│  │  pieces, income)  │   grid layout)   │  pending input)     │ │
│  └───────────────────┴──────────────────┴─────────────────────┘ │
│  FreeActionBar: [Move] [Place Data] [Complete Mission]          │
│                 [Use Card Corner] [Buy Card] [Exchange]         │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Board Sub-View Tabs

The main board area uses tabs to switch between dense board views:

| Tab | Component | Content |
|-----|-----------|---------|
| Solar System | `SolarSystemView` | Concentric rings, 3 rotatable discs, probe positions, planet spaces |
| Sectors | `SectorGrid` | 8 sectors with data slots, signal markers, completion state |
| Planets | `PlanetaryBoardView` | Each planet's orbit/landing slots, moon availability, first-arrive bonuses |
| Tech | `TechBoardView` | 12 tech stacks, 2VP tiles, player acquisition markers |
| Cards | `CardRowView` + `EndOfRoundStacks` | Card market + end-of-round stacks |
| Aliens | `AlienBoardView` | Discovery track, species-specific boards (shown after discovery) |
| Scoring | `MilestoneTrack` + `ScoreBreakdown` | Gold/neutral milestones, current scores |

### 7.3 SolarSystemView — Key Complexity

The solar system is **not** a standard grid. It is concentric rings with 3 independently rotatable discs.

**Rendering approach:** SVG-based with CSS transforms for rotation animation.

```
       ┌─── Outer ring (static frame) ───┐
       │  ┌── Top disc (rotatable) ──┐   │
       │  │  ┌─ Middle disc ──┐      │   │
       │  │  │  ┌─ Bottom ─┐  │      │   │
       │  │  │  │   Sun     │  │      │   │
       │  │  │  └───────────┘  │      │   │
       │  │  └─────────────────┘      │   │
       │  └───────────────────────────┘   │
       └──────────────────────────────────┘
```

**Space interaction:** Click on a valid destination space to move probe (free action). The `SolarSystemView` receives `adjacency` data from game state and highlights reachable spaces.

**Rotation animation:** On `game:event { type: 'ROTATION' }`, animate the relevant disc CSS `transform: rotate()` before updating positions.

### 7.4 Component ↔ Game State Mapping

| Component | Reads from `IPublicGameState` |
|-----------|-------------------------------|
| `SolarSystemView` | `.solarSystem` (spaces, probes, disc angles) |
| `SectorGrid` | `.sectors[]` (data slots, markers, completion) |
| `PlanetaryBoardView` | `.planetaryBoard` (per-planet orbit/land arrays) |
| `TechBoardView` | `.techBoard` (stacks, 2VP availability, taken techs) |
| `ResourceBar` | `.players[me].resources`, `.players[me].publicity`, `.players[me].score` |
| `ComputerView` | `.players[me].computer` (top/bottom slots, data tokens) |
| `DataPoolView` | `.players[me].dataPool` (count, max) |
| `HandView` | `.players[me].hand` (full card data, only for own hand) |
| `OpponentSummary` | `.players[other].handSize`, `.resources`, `.score`, etc. |
| `EventLog` | `.recentEvents` |
| `ActionMenu` | Only shown when `.currentPlayerId === myPlayerId` |
| `MilestoneTrack` | `.milestones` |

---

## 8. PlayerInput Rendering System

### 8.1 Input Model → Component Mapping

The server sends a `IPlayerInputModel` via `game:waiting` when a decision is needed. The client renders the appropriate UI and sends back an `IInputResponse`.

```typescript
// features/input/InputRenderer.tsx
function InputRenderer({ model }: { model: IPlayerInputModel }) {
  switch (model.type) {
    case 'option':      return <SelectOptionInput model={model} />;
    case 'card':        return <SelectCardInput model={model} />;
    case 'sector':      return <SelectSectorInput model={model} />;
    case 'planet':      return <SelectPlanetInput model={model} />;
    case 'tech':        return <SelectTechInput model={model} />;
    case 'goldTile':    return <SelectGoldTileInput model={model} />;
    case 'resource':    return <SelectResourceInput model={model} />;
    case 'trace':       return <SelectTraceInput model={model} />;
    case 'endOfRound':  return <SelectEndOfRoundCardInput model={model} />;
    case 'or':          return <OrOptionsInput model={model} />;
    case 'and':         return <AndOptionsInput model={model} />;
    default:            return <UnknownInput model={model} />;
  }
}
```

### 8.2 Input Component Specifications

| Input Type | UI | User Interaction | Response Shape |
|------------|-----|-----------------|----------------|
| `SelectOption` | Button with label | Click to confirm | `{ type: 'option' }` |
| `SelectCard` | Scrollable card grid with selection | Click to select min..max cards, confirm button | `{ type: 'card', cardIds: string[] }` |
| `SelectSector` | Sector board with highlighted selectable sectors | Click on sector | `{ type: 'sector', sectorId: string }` |
| `SelectPlanet` | Planetary board with highlighted planets | Click on planet | `{ type: 'planet', planet: EPlanet }` |
| `SelectTech` | Tech board with highlighted available stacks | Click on tech stack | `{ type: 'tech', tech: ETech }` |
| `SelectGoldTile` | Gold tile display with available spaces | Click on tile + space | `{ type: 'goldTile', tileId: string }` |
| `SelectResource` | Resource icon buttons | Click one resource type | `{ type: 'resource', resource: EResource }` |
| `SelectTrace` | Alien discovery track with trace options | Click trace color | `{ type: 'trace', trace: ETrace }` |
| `SelectEndOfRoundCard` | Cards from current end-of-round stack | Click to choose 1 card | `{ type: 'endOfRound', cardId: string }` |
| `OrOptions` | Tabbed panel or accordion of sub-inputs | Select one tab, fill sub-input | `{ type: 'or', index: number, response: IInputResponse }` |
| `AndOptions` | Stepper/wizard through all sub-inputs | Fill each in sequence | `{ type: 'and', responses: IInputResponse[] }` |

### 8.3 Input Lifecycle

```
1. Server sends game:waiting { playerId, input: IPlayerInputModel }
2. usePlayerInput hook stores the model
3. If playerId === myPlayerId:
   a. InputRenderer shows appropriate component in bottom-right action area
   b. Relevant board components highlight valid targets (sectors glow, planets pulse, etc.)
4. Player interacts → build IInputResponse
5. sendInput(response) → game:input emitted to server
6. Server validates → either:
   a. game:state (success, input resolved)
   b. game:waiting (follow-up input needed)
   c. game:error (invalid response, re-show input)
```

### 8.4 Board Highlighting Integration

When a `PlayerInputModel` is active, board components read it to apply highlights:

```typescript
// Inside SectorView
const { pendingInput } = useGameContext();
const isSelectable = pendingInput?.type === 'sector'
  && pendingInput.options.includes(sector.id);

return (
  <div className={cn(
    'sector-view',
    isSelectable && 'ring-2 ring-yellow-400 cursor-pointer animate-pulse',
  )}>
    ...
  </div>
);
```

This creates a cohesive feel where the action menu and the board work together — the board becomes interactive when a selection is pending.

---

## 9. Card Rendering Integration

### 9.1 Using @ender-seti/cards

The `@ender-seti/cards` package provides `CardRender` for rendering full card visuals. The client imports it directly:

```typescript
import { CardRender } from '@ender-seti/cards';
import '@ender-seti/cards/styles/card.css';

function CardDetail({ card }: { card: IBaseCard }) {
  return <CardRender card={card} />;
}
```

### 9.2 Card Data Flow

- **Full card data** (from `@ender-seti/common`) is used for the player's own hand.
- **Public card info** (id, name, cost, sector color) is used for opponent's played cards and card row.
- **Card back** is shown for unknown cards (deck top, opponent hand count).

### 9.3 Card Interaction States

| Context | Interaction | Visual |
|---------|-------------|--------|
| Hand (idle) | Hover to preview | Slight lift + enlarged tooltip |
| Hand (SelectCard input) | Click to toggle selection | Blue border, checkmark |
| Card Row (Buy Card free action) | Click to buy | Glow effect |
| Card Row (Scan: discard) | Click to discard for scan | Red border |
| Played Mission | Hover to see progress | Trigger circles highlighted |
| End-of-Round Stack | Click to choose (Pass input) | Selection highlight |

---

## 10. Free Action Bar

Free actions are available during the active player's turn, independent of the main action. They are presented as a persistent toolbar at the bottom of the game page.

### 10.1 Free Action Availability

Each button's enabled state is computed from the current game state:

| Free Action | Button Label | Enabled When |
|-------------|-------------|--------------|
| Movement | "Move Probe" | Player has probe in solar system + movement points > 0 |
| Place Data | "Place Data" | Player has data in pool + computer has empty slot |
| Complete Mission | "Complete Mission" | Any played conditional mission with met conditions |
| Use Card Corner | "Use Card" | Player has cards in hand with free-action corner |
| Buy Card | "Buy Card (3 🎯)" | Player has ≥ 3 publicity |
| Exchange | "Exchange" | Player has ≥ 2 of any resource type |

### 10.2 Free Action Interaction Flow

Free actions do **not** use the `PlayerInput` system. They are direct WebSocket emissions:

```
Player clicks "Move Probe"
  → UI enters "movement mode" (highlight adjacent spaces)
  → Player clicks destination space
  → wsClient.sendFreeAction(gameId, { type: 'MOVEMENT', targetSpaceId })
  → Server validates + applies + pushes game:state
  → UI updates (probe moves, movement points decrease)
```

Some free actions may trigger a server-side `PlayerInput` (e.g., "Use Card Corner" requires selecting which card to discard). In that case, the server responds with `game:waiting`, and the flow transitions to the `InputRenderer` system.

---

## 11. Design System & Theming

### 11.1 Token-Based Theme Configuration

All visual parameters are centralized in `config/theme.ts`, making future theme iteration straightforward:

```typescript
// config/theme.ts
export const theme = {
  colors: {
    sector: {
      red: 'hsl(0, 70%, 50%)',
      yellow: 'hsl(45, 90%, 55%)',
      blue: 'hsl(210, 70%, 50%)',
      black: 'hsl(0, 0%, 20%)',
    },
    resource: {
      credit: 'hsl(45, 80%, 55%)',
      energy: 'hsl(120, 60%, 45%)',
      data: 'hsl(200, 70%, 50%)',
      publicity: 'hsl(280, 60%, 55%)',
    },
    player: [
      'hsl(0, 70%, 55%)',       // Red
      'hsl(210, 70%, 55%)',     // Blue
      'hsl(120, 60%, 45%)',     // Green
      'hsl(45, 90%, 55%)',      // Yellow
    ],
    trace: {
      red: 'hsl(0, 70%, 50%)',
      yellow: 'hsl(45, 90%, 55%)',
      blue: 'hsl(210, 70%, 50%)',
    },
    background: {
      primary: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(0, 0%, 96%)',
      card: 'hsl(0, 0%, 100%)',
    },
    text: {
      primary: 'hsl(0, 0%, 9%)',
      secondary: 'hsl(0, 0%, 45%)',
      muted: 'hsl(0, 0%, 64%)',
    },
  },
  spacing: {
    boardGap: '0.5rem',
    cardWidth: '120px',
    cardHeight: '168px',
    solarSystemSize: '400px',
  },
  animation: {
    rotationDuration: '800ms',
    tokenMoveDuration: '400ms',
    highlightPulse: '1.5s',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    scoreSize: '1.5rem',
    resourceSize: '1rem',
  },
} as const;

export type TTheme = typeof theme;
```

### 11.2 Tailwind Integration

The theme tokens are injected into Tailwind via `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import { theme as gameTheme } from './src/config/theme';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sector: gameTheme.colors.sector,
        resource: gameTheme.colors.resource,
        trace: gameTheme.colors.trace,
      },
      width: {
        card: gameTheme.spacing.cardWidth,
      },
      height: {
        card: gameTheme.spacing.cardHeight,
      },
      transitionDuration: {
        rotation: gameTheme.animation.rotationDuration,
        'token-move': gameTheme.animation.tokenMoveDuration,
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### 11.3 shadcn/ui Defaults

shadcn/ui components are used as-is with the default "New York" style. CSS variables from shadcn's `globals.css` provide the base palette. Game-specific colors (sectors, resources, players) are added as extensions, not overrides.

**Future theming:** To add a dark sci-fi Mars theme later, update `config/theme.ts` tokens + shadcn CSS variables. All components reference tokens, so a single-file change propagates everywhere.

---

## 12. Provider Stack

```typescript
// main.tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>
  );
}

// GamePage.tsx — game-specific providers
function GamePage() {
  const { gameId } = useParams({ from: '/game/$gameId' });

  return (
    <GameContextProvider gameId={gameId}>
      <GameLayout />
    </GameContextProvider>
  );
}
```

**Provider responsibilities:**

| Provider | Scope | Purpose |
|----------|-------|---------|
| `QueryClientProvider` | App-wide | TanStack Query cache |
| `I18nextProvider` | App-wide | i18n (shared with @ender-seti/cards) |
| `RouterProvider` | App-wide | TanStack Router |
| `GameContextProvider` | Per-game page | WebSocket lifecycle, game state, input handling |

Zustand stores are **not** providers — they are imported directly via hooks.

---

## 13. Data Flow Summary

### 13.1 Full Action Lifecycle (Client View)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GamePage mounts                                              │
│    → useSocket() connects WebSocket with JWT                    │
│    → wsClient.joinGame(gameId)                                  │
│    → Server pushes game:state → useGameState stores it          │
│                                                                 │
│ 2. My turn arrives (currentPlayerId === myPlayerId)             │
│    → Server pushes game:waiting with OrOptions (action menu)    │
│    → ActionMenu renders 8 main action buttons                   │
│                                                                 │
│ 3. I click "Scan"                                               │
│    → wsClient.sendAction({ type: 'SCAN' })                     │
│                                                                 │
│ 4. Server needs sector selection                                │
│    → game:waiting { type: 'sector', options: [...] }            │
│    → SectorGrid highlights valid sectors                        │
│    → InputRenderer shows SelectSectorInput                      │
│                                                                 │
│ 5. I click a sector                                             │
│    → wsClient.sendInput({ type: 'sector', sectorId: 'red-1' }) │
│                                                                 │
│ 6. Server needs card discard for second signal                  │
│    → game:waiting { type: 'card', cards: [...] }                │
│    → CardRowView highlights cards, SelectCardInput appears      │
│                                                                 │
│ 7. I select a card                                              │
│    → wsClient.sendInput({ type: 'card', cardIds: ['C-42'] })   │
│                                                                 │
│ 8. Server resolves scan + checks milestones                     │
│    → game:state pushed (markers placed, data gained, etc.)      │
│    → game:event { type: 'ACTION', action: 'SCAN', ... }        │
│    → All components re-render with new state                    │
│    → EventLog appends entry                                     │
│                                                                 │
│ 9. Next player's turn                                           │
│    → ActionMenu hides, "Waiting for [Player]" shown             │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 State Update Performance

Concerns and mitigations for frequent full-state updates:

| Concern | Mitigation |
|---------|-----------|
| Re-render on every state push | `React.memo` on leaf components; selector hooks (`usePlayerResources()`, `useSectors()`) that extract slices |
| Large state object diffing | `useDeferredValue` for non-critical UI (event log, opponent summary) |
| SVG re-render for solar system | Key-stable SVG elements; only animate changed positions |
| Card re-render | `React.memo` with card ID as key; `CardRender` is already pure |

---

## 14. Testing Strategy

### 14.1 Framework: Vitest + React Testing Library

Aligned with the server's choice of Vitest. Uses `jsdom` environment for component testing.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/features/**', 'src/hooks/**', 'src/stores/**'],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ender-seti/common': path.resolve(__dirname, '../common/src'),
    },
  },
});
```

### 14.2 Test Layers

| Layer | Type | What to Test | Tool |
|-------|------|-------------|------|
| **Hooks** | Unit | `useGameState`, `usePlayerInput`, `useAuth`, store hooks | Vitest + renderHook |
| **InputRenderer** | Component | Each input type renders correctly from model + emits correct response | RTL + mock wsClient |
| **Board Components** | Component | Correct rendering of sectors, planets, tech stacks from state slice | RTL + snapshot |
| **Action Menu** | Component | Correct buttons shown for current player; disabled states | RTL |
| **Stores** | Unit | Zustand store actions produce expected state transitions | Vitest |
| **wsClient** | Unit | Event binding, emission, reconnection logic | Vitest + mock Socket |
| **Integration** | Integration | Full GamePage with mock WebSocket; simulate action → state → render cycle | RTL + MSW + mock socket |
| **E2E** | E2E (future) | Multi-player game flow in browser | Playwright |

### 14.3 Mock Fixtures

```typescript
// test/mocks/gameState.ts
export function createMockGameState(
  overrides?: Partial<IPublicGameState>,
): IPublicGameState {
  return {
    round: 1,
    phase: 'AWAIT_MAIN_ACTION',
    currentPlayerId: 'player-1',
    solarSystem: createMockSolarSystem(),
    planetaryBoard: createMockPlanetaryBoard(),
    techBoard: createMockTechBoard(),
    sectors: createMockSectors(),
    cardRow: [],
    players: [
      createMockPlayerView('player-1', { hand: mockCards }),
      createMockPlayerView('player-2', { handSize: 5 }),
    ],
    aliens: [],
    milestones: createMockMilestones(),
    goldTiles: [],
    recentEvents: [],
    ...overrides,
  };
}
```

### 14.4 CI Integration

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "biome check src/",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 15. Engineering Concerns

### 15.1 Spectator Mode

Spectators connect via `/game/:gameId/spectate`. The `GameContextProvider` detects the spectate route and sets `isSpectator = true`:

- All `game:state` pushes show public-only view (all hands hidden)
- ActionMenu / FreeActionBar are hidden
- InputRenderer is hidden
- OpponentSummary shows all players equally

### 15.2 Responsive Design

| Viewport | Layout Adaptation |
|----------|-------------------|
| Desktop (≥1280px) | Full 3-column layout as shown in §7.1 |
| Tablet (768–1279px) | Sidebar collapses to bottom drawer; board area full-width |
| Mobile (< 768px) | Single column; board tabs are swipeable; bottom bar becomes full-screen sheet |

Board components use relative sizing (`%`, `vw`). The solar system SVG scales with its container.

### 15.3 Accessibility Baseline

- All interactive elements have `aria-label`
- Keyboard navigation for card selection (arrow keys + Enter)
- Color-blind–friendly sector colors (patterns + labels, not just color)
- Screen reader announcements for game events via `aria-live`

### 15.4 Performance Budget

| Metric | Target |
|--------|--------|
| Initial bundle (gzipped) | < 200 KB (excluding card assets) |
| LCP (game page) | < 2s |
| State update → re-render | < 16ms (60fps) |
| WebSocket event → visual update | < 100ms perceived |

**Strategies:**
- Code split per route (`React.lazy` + TanStack Router lazy routes)
- Card sprite sheets (already in @ender-seti/cards) avoid individual image loads
- `React.memo` + selector hooks prevent unnecessary re-renders
- WebSocket state is applied in `requestAnimationFrame` batch

### 15.5 Error Handling

| Error Source | Handling |
|-------------|----------|
| REST API 4xx | Toast notification + form error display |
| REST API 5xx | Toast + retry button |
| WebSocket disconnect | Auto-reconnect (Socket.IO built-in) + "Reconnecting..." overlay |
| `game:error` event | Toast with error message; re-show current input |
| Invalid input response | Server re-sends `game:waiting` with same input |
| Render error | `ErrorBoundary` per feature section; game page never fully crashes |

### 15.6 i18n

Use `react-i18next` (already a peer dependency of `@ender-seti/cards`). Game-specific translations are stored in:

```
src/locales/
├── en/
│   ├── common.json        # Shared UI strings
│   ├── auth.json           # Login/register
│   ├── lobby.json          # Room management
│   └── game.json           # Game actions, events, input prompts
└── zh-CN/
    └── ...                 # Same structure
```

Card names/descriptions use `@ender-seti/common` locale files (already in place).

### 15.7 Environment Variables

```env
VITE_API_URL=http://localhost:3000       # REST API base URL
VITE_WS_URL=http://localhost:3000        # WebSocket URL (same server, different transport)
VITE_ENV=development                     # development | staging | production
```

---

## 16. Shared Types from `@seti/common`

The client depends on protocol types that will be added to `@ender-seti/common` under `types/protocol/`:

| Type | Purpose | Used By |
|------|---------|---------|
| `IPublicGameState` | Full projected game state per player | `useGameState`, all game components |
| `IPlayerInputModel` | Serialized pending decision | `usePlayerInput`, `InputRenderer` |
| `IMainActionRequest` | Client → server main action payload | `useGameActions` |
| `IFreeActionRequest` | Client → server free action payload | `useGameActions` |
| `IInputResponse` | Client → server input response payload | `useGameActions` |
| `TGameEvent` | Typed event for log + animation | `useGameEvents`, `EventLog` |
| `IPublicPlayerState` | Per-player visible state | `OpponentSummary`, `PlayerDashboard` |
| `IPublicSolarSystem` | Solar system view model | `SolarSystemView` |
| `IPublicSector` | Sector view model | `SectorView` |
| `IPublicPlanetaryBoard` | Planet board view model | `PlanetaryBoardView` |
| `IPublicTechBoard` | Tech board view model | `TechBoardView` |

These types are already referenced in `arch-server.md` §5.2. The client imports them as:

```typescript
import type { IPublicGameState, IPlayerInputModel } from '@ender-seti/common/types/protocol';
```

---

## 17. Frontend Reference Analysis

> Source: `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/`
> Static assets: `frontend-reference/storage.googleapis.com/cgo-projects/seti/`
>
> **Important:** The reference uses a config-driven component engine (CGO platform). Our project uses standard React function components + Tailwind + shadcn/ui. Reference code provides **game logic, data structures, and UI interaction patterns** — not component code to copy directly.

### 17.1 Reference Module Map

| Reference File | Purpose | Our Mapping (packages/client) |
|---|---|---|
| `components.js` | Declarative UI layout config (positions, slots, conditionals) | `features/board/*`, `features/player/*` — standard React components |
| `states.js` | Game state machine: phases, click handlers, auto-transitions | `hooks/usePlayerInput`, `features/input/InputRenderer`, `features/actions/*` |
| `setup.js` | Initial game state construction (wheels, decks, players, boards) | Server-side (`packages/server`); client receives via `game:state` |
| `doEffect.js` | Effect interpreter (`["money", 2]`, `["tech", "fly"]`) | Server-side; client only renders the resulting state |
| `solarSystem.js` | Ring model, rotation, probe movement, sky-sector links | `features/board/SolarSystemView` + `DiscLayer` + `ProbeToken` |
| `tech.js` | Tech acquisition, upgrade, costs, bonuses | `features/board/TechBoardView` + `TechStack`; logic reusable for validation display |
| `globals.js` | Board accessors, mission resolution, counting DSL | Server-side; some patterns useful for client-side display helpers |
| `look.js` | Look action: signal placement, sector effects | `features/board/SectorView` interaction; server drives state |
| `highlight.js` | Valid target highlighting (probes, data, tech, quests) | `hooks/usePlayerInput` + `pendingInput` highlight integration |
| `computer.js` | Data computer: slot availability, placement, rewards | `features/player/ComputerView` |
| `moveManager.js` | Central UI move dispatch (click → game action) | `features/input/*` + `features/actions/ActionMenu` |
| `turnManager.js` | Round lifecycle, pass, next player, final scoring | Server-side; client reads `phase` + `currentPlayerId` from state |
| `playCard.js` | Card play: costs, quests, production effects | `features/cards/CardRowView` interaction; server handles logic |
| `corporations.js` | Corporation draft, abilities, production | Future scope; `features/player/CorporationView` |
| `life.js` | Alien life tiles: traces, samples, rewards | `features/alien/AlienBoardView` |
| `amoebaLife.js` | Amoeba alien: position track, color-based activation | `features/alien/AlienBoardView` (amoeba variant) |
| `alphabetLife.js` | Alphabet/cipher alien: sign tokens, tables | `features/alien/AlienBoardView` (alphabet variant) |
| `microbeLab.js` | Microbe lab board: sections A/B/C, microbe movement | `features/alien/AlienBoardView` (microbe variant) |
| `customTooltip.js` | Hover text for board positions | `features/board/*` tooltip content |
| `customMoves.js` | Extensibility stub (unused) | N/A |

### 17.2 Component System (Reference vs Ours)

The reference uses a **config-driven component engine** where every game piece is defined as a JSON-like object with:

- **Layout:** `width`, `height`, `x`, `y`, `zIndex`, `image`
- **Positions (slots):** Named attachment points with `accepts`, `coords`, `multi`, `gapSize`, `scaleMult`
- **Conditionals:** `__cond_image`, `__cond_hidden`, `__cond_selectable` etc. — arrays of `{ condition, result }` that switch appearance based on runtime options (`color`, `level`, `rotation`, `type`)
- **Clickable areas:** Named rectangles on boards (`startProbe`, `techPop`, `look`, `clearComputer`)
- **Constants:** Inline helper children (`constantComponents`) for labels, scores

**Our approach:** Standard React components. The reference's slot/position system translates to React props and CSS Grid/Flex layouts. Conditionals become React conditional rendering (`isSelectable && 'ring-2 ring-yellow-400'`). Clickable areas become `onClick` handlers on SVG elements or buttons.

**Key reference helper functions to be aware of:**
- `generateWheelPositions(level)` — generates 8 polar-coordinate positions per ring
- `getWheelSize(level)` — maps ring level to pixel size (4→largest, 1→smallest)

### 17.3 State Machine (Reference Flow)

The reference defines ~40+ named game states. Key flow for a normal turn:

```
corporation draft → start draft → start income
    ↓
do action  ← ← ← ← ← ← ← ← ← ← (free actions loop back here)
    ↓
[player picks one of 8 main actions]
    ├── play card → card effect → effect queue
    ├── look → place signals → targeted signal
    ├── gain tech → test tech → return tech
    ├── complete mission → ...
    ├── launch probe → ...
    └── ... (other actions)
    ↓
after main → [free actions available]
    ↓
activateNextPlayer (or pass → end of round)
    ↓
[all passed] → threshold queue → rotation → income phase → new round
    ↓
[round 5 complete] → final scoring
```

**Client implication:** The server drives state transitions. The client:
1. Reads `game:state` to know current phase/state
2. Reads `game:waiting` to know what input is needed
3. Renders the appropriate `InputRenderer` component
4. Board components read `pendingInput` for highlighting

### 17.4 Solar System Model (Reference)

The reference models the solar system as:

- **32 positions:** `pos = (distance - 1) * 8 + rot` where `distance` ∈ {1,2,3,4} (rings) and `rot` ∈ {0..7} (sector angles)
- **4 nested wheels:** Level 4 (outermost) → Level 1 (innermost), each independently rotatable
- **Physical rotation:** `getPhysicalRotation(wheel)` sums rotations from base down
- **Space data:** Looked up from `dataSheet["wheel" + level]` adjusted by rotation to get object type (planet, asteroid, Earth, etc.)
- **Rotation logic:** `rotateWheel()` decrements rotation, moves tokens on "moving" spaces vs "pushed" tokens. `rotateSystem()` rotates rings 1-3 (not 4)
- **Sky mapping:** `pos % 8` maps any position to one of 8 sector/sky tokens

**Client rendering approach:**
```
SVG structure:
  <svg viewBox="0 0 800 800">
    <!-- Static outer frame ring -->
    <circle cx="400" cy="400" r="380" />

    <!-- Level 4 disc (outermost, rotatable) -->
    <g transform="rotate(angle4, 400, 400)">
      <!-- 8 spaces at radius ~340 -->
    </g>

    <!-- Level 3 disc -->
    <g transform="rotate(angle3, 400, 400)">
      <!-- 8 spaces at radius ~260 -->
    </g>

    <!-- Level 2 disc -->
    <g transform="rotate(angle2, 400, 400)">
      <!-- 8 spaces at radius ~180 -->
    </g>

    <!-- Level 1 disc (innermost) -->
    <g transform="rotate(angle1, 400, 400)">
      <!-- 8 spaces at radius ~100 -->
    </g>

    <!-- Probes (positioned above discs) -->
    <!-- Sun center -->
  </svg>
```

Space coordinates use polar → cartesian conversion:
```typescript
function spacePosition(ring: number, sectorIndex: number): { x: number; y: number } {
  const radius = RING_RADII[ring]; // e.g. [100, 180, 260, 340]
  const angle = (sectorIndex / 8) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}
```

**Reference wheel outlines available as static assets** — can be used as background images for each ring:
- `wheels/wheel1outline.png` through `wheels/wheel4outline.png`
- `wheels/wheel4.png` (filled version)

### 17.5 Effect System (Reference)

Effects are encoded as arrays: `["money", 2]`, `["tech", "fly"]`, `["vp", 3, "techBonus"]`. The `doEffect` function is a large switch:

| Effect Name | Behavior | Client Relevance |
|---|---|---|
| `money`, `pop`, `energy`, `vp` | Increment player counter (with caps) | ResourceBar animation |
| `move` | Grant movement points | Probe movement highlight |
| `data` | Add data token to pool | DataPoolView update |
| `tech` | Enter "gain tech" substate | TechBoardView highlight |
| `signal` | Place signal tokens | SectorView marker update |
| `launch` | Start probe launch substate | SolarSystemView interaction |
| `look` | Start look action | SectorGrid interaction |
| `clearComputer` | Clear computer substate | ComputerView animation |
| `completeMission` | Mission completion substate | PlayedMissions update |
| `progress` | Advance progress track | Progress display |

**Client implication:** The client does NOT execute effects. It renders the **result** from `game:state`. The effect names are useful for:
1. **Event log display** — translating effect names to user-friendly messages
2. **Animation triggers** — `game:event` payloads reference these effect types
3. **Tooltip content** — showing card/tech effects in human-readable form

### 17.6 Static Assets Catalog

All assets are in `frontend-reference/storage.googleapis.com/cgo-projects/seti/assets/`. These can be **directly copied** to `packages/client/public/assets/seti/`.

#### Board & Background Images

| File | Purpose | Reuse Priority |
|---|---|---|
| `_board.png` | Main board background | ★★★ Core |
| `planetBoard-SE0.4.0.jpg` | Planet board artwork | ★★★ Core |
| `playerboardSE0.0.B.png` | Player mat / player board | ★★★ Core |
| `overview.png` | Game overview diagram | ★★ Reference |
| `scoringReminder.jpg` | End-game scoring reference | ★★ UI helper |
| `automaboards/automaBoard1.jpg` | Solo/automa board | ★ Future |

#### Wheel / Solar System

| File | Purpose | Reuse Priority |
|---|---|---|
| `wheels/wheel1outline.png` | Ring 1 (innermost) outline | ★★★ Core |
| `wheels/wheel2outline.png` | Ring 2 outline | ★★★ Core |
| `wheels/wheel3outline.png` | Ring 3 outline | ★★★ Core |
| `wheels/wheel4outline.png` | Ring 4 (outermost) outline | ★★★ Core |
| `wheels/wheel4.png` | Ring 4 filled graphic | ★★ Alternate |

#### Player Tokens

| File | Purpose | Reuse Priority |
|---|---|---|
| `playerTokens/redProbe.png` | Red probe | ★★★ Core |
| `playerTokens/whiteProbe.png` | White probe | ★★★ Core |
| `playerTokens/purpleProbe.png` | Purple probe | ★★★ Core |
| `playerTokens/redSky.png` | Red sky marker | ★★★ Core |
| `playerTokens/whiteSky.png` | White sky marker | ★★★ Core |
| `playerTokens/purpleSky.png` | Purple sky marker | ★★★ Core |
| `playerTokens/data.png` | Data token | ★★★ Core |
| `2vpToken.png` | 2VP token | ★★★ Core |
| `player-passed.png` | Pass indicator | ★★ UI |

#### Tech Tiles (12 tiles: 3 tracks × 4 levels)

| Track | Files | Format |
|---|---|---|
| Computer (Comp) | `techComp1-4.webp` | webp |
| Movement (Fly) | `techFly1-4` (.webp/.jpg mixed) | mixed |
| Survey (Look) | `techLook1-4` (.webp/.jpg mixed) | mixed |

#### Tech Bonuses (9 bonus markers)

| File | Purpose |
|---|---|
| `techBonus/tech1.png`, `tech3.png`, `tech4.png`, `tech6.png` | Numbered tech bonuses |
| `techBonus/techRotation1-3.png` | Rotation bonuses |
| `techBonus/data.png`, `launch.png` | Data/launch bonuses |

#### Card Backs

| File | Purpose |
|---|---|
| `cardBacks/back_base.jpg` | Default card back |
| `cardBacks/back_4.jpg`, `back_6.jpg` | Round-specific backs |
| `cardBacks/goalBack.jpg` | Goal/mission card back |

#### Icons (25 icons)

| Category | Files |
|---|---|
| Resources | `money.png`, `energy.png`, `data.png`, `pop.png`, `vp.png` |
| Actions | `move.png`, `look.png`, `launch.png`, `draw.png`, `income.png`, `tech.png` |
| Signals | `signalYellow.png`, `signalBlue.png`, `signalRed.png`, `signalBlack.png`, `signalToken.png` |
| Status | `danger.png`, `dangerThreshold1.png`, `dangerThreshold2.png`, `clearComputer.png`, `questsComplete.png`, `startPlayer.png`, `progress.png`, `missionSatellite.png` |
| Other | `distantBonus-purple.png` |

#### Distant Bonuses

| File | Purpose |
|---|---|
| `distantBonus/bonus1-4.png` | 4 distant planet bonus tiles |

#### Life / Alien Assets

| File | Purpose |
|---|---|
| `lifes/lifeBasicLeftDistinct.jpg` | Basic life tile (left) |
| `lifes/lifeBasicRightDistinct.jpg` | Basic life tile (right) |
| `lifes/back.jpg` | Life card back |

#### Corporation Assets

| File | Purpose |
|---|---|
| `corporations/cards.jpg` | Corporation reference sheet |
| `corporations/probes.jpg` | Probe reference art |

### 17.7 Asset Integration Plan

```
packages/client/public/assets/seti/
├── boards/
│   ├── _board.png                   # ← from assets/_board.png
│   ├── planetBoard.jpg              # ← from assets/planetBoard-SE0.4.0.jpg
│   ├── playerBoard.png              # ← from assets/playerboardSE0.0.B.png
│   └── scoringReminder.jpg
├── wheels/
│   ├── wheel1outline.png
│   ├── wheel2outline.png
│   ├── wheel3outline.png
│   ├── wheel4outline.png
│   └── wheel4.png
├── tokens/
│   ├── probes/                      # redProbe.png, whiteProbe.png, purpleProbe.png
│   ├── sky/                         # redSky.png, whiteSky.png, purpleSky.png
│   ├── data.png
│   ├── 2vp.png
│   └── passed.png
├── tech/
│   ├── tiles/                       # techComp1-4, techFly1-4, techLook1-4
│   └── bonuses/                     # tech1.png, techRotation1-3.png, data.png, launch.png
├── cards/
│   ├── back_base.jpg
│   ├── back_4.jpg
│   ├── back_6.jpg
│   └── goalBack.jpg
├── icons/                           # All 25 icon PNGs
├── distantBonus/                    # bonus1-4.png
├── lifes/                           # lifeBasicLeftDistinct.jpg, etc.
└── corporations/                    # cards.jpg, probes.jpg
```

Access from React components:
```typescript
const ASSET_BASE = '/assets/seti';

const assetUrl = (path: string) => `${ASSET_BASE}/${path}`;

// Usage
<img src={assetUrl('wheels/wheel3outline.png')} alt="Ring 3" />
<img src={assetUrl('tokens/probes/redProbe.png')} alt="Red probe" />
<img src={assetUrl('icons/money.png')} alt="Credits" />
```

### 17.8 Key Logic That Can Be Reused

These reference modules contain game logic calculations that can be adapted for client-side display helpers:

| Module | Reusable Logic | Our Usage |
|---|---|---|
| `tech.js` | `hasTech()`, `canUseTech()`, `canAcquireTech()` cost checks, upgrade side-effects | Client-side display: grey-out unavailable techs, show costs |
| `solarSystem.js` | `systemPosToCoords()`, `coordsToSystemPos()`, `getPath()`, `moveCost()` | SVG rendering: convert position IDs to pixel coordinates; show reachable spaces |
| `computer.js` | `posAvailable()`, `compPosToDataPos()`, `getComputerReward()` | ComputerView: show which slots are available, preview rewards |
| `highlight.js` | `isClickable()` conditions for probes, data, tech, quests | Client highlighting: determine what glows during PlayerInput |
| `customTooltip.js` | Tooltip text generators for positions, effects, tech | Tooltip content for board positions |
| `alphabetLife.js` | `getAlphabetEffect()`, cipher table lookups | Alien UI: display expected rewards for sign placement |
| `amoebaLife.js` | `amoebaPosColor()`, position-to-color mapping | Alien UI: amoeba track coloring |

**Note:** Server is the single source of truth. These client-side calculations are for **display/preview** only — all actions are validated server-side.

---

## 18. Technical Decisions (Confirmed)

| # | Decision | Choice | Notes |
|---|----------|--------|-------|
| 1 | Router | **TanStack Router** | Type-safe params/search, loader pattern for initial data, natural code splitting |
| 2 | Server State | **TanStack Query** | REST endpoints only; game state via WebSocket is separate |
| 3 | Client State | **Zustand** | Minimal API, no boilerplate; localStorage persistence for settings |
| 4 | WebSocket | **Socket.IO Client** | Matches server; auto-reconnect built in |
| 5 | Component Library | **shadcn/ui (default style)** | Unstyled Radix primitives; no lock-in; easy to re-theme later |
| 6 | CSS | **Tailwind CSS 4** | Utility-first, co-located with components, purged in production |
| 7 | Card Rendering | **@ender-seti/cards** | Existing asset pipeline and components |
| 8 | Test Framework | **Vitest + RTL** | Aligned with server; jsdom for components |
| 9 | Build | **Vite** | Fast dev, optimized prod build, ESM-native |
| 10 | Game State Delivery | **Full state push (not delta)** | Simpler client logic; server is SSoT; acceptable payload size for board game |
| 11 | Static Assets | **Copied from reference** | Wheel outlines, player tokens, tech tiles, icons — see §17.6 |

---

## 19. Implementation Phases (Suggested)

| Phase | Scope | Goal |
|-------|-------|------|
| **P0** | Project scaffold: Vite + TanStack Router + Tailwind + shadcn/ui + providers | App skeleton builds and runs |
| **P0.5** | **Copy static assets** from reference to `public/assets/seti/` (see §17.7) | All game art available |
| **P1** | Auth + profile pages, httpClient, authStore, JWT flow | Login/register works end-to-end |
| **P2** | Lobby: room list, create room, room page, game settings | Can create and join rooms |
| **P3** | WebSocket integration: wsClient, useSocket, useGameState, GameContextProvider | Client connects to game, receives state |
| **P4** | Game layout + board components (static): SolarSystem, Sectors, Planets, Tech | Game page renders state correctly |
| **P5** | PlayerInput system: InputRenderer + all input types + response flow | Can respond to server prompts |
| **P6** | Action menu + free action bar: main action submission, free action emission | Full turn cycle works |
| **P7** | Player dashboard: resources, computer, data pool, hand, missions, techs | Player sees all their state |
| **P8** | Animations: rotation, probe movement, token placement, highlights | Game feels alive |
| **P9** | Opponent summary, spectator mode, event log, game over scoring | Full feature parity |
| **P10** | Polish: responsive design, accessibility, error handling, i18n, performance optimization | Production-ready |
