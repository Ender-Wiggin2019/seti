import { HttpResponse, http } from 'msw';
import type {
  IAlienTypeOption,
  IAuthUser,
  ILoginResponse,
  IRegisterResponse,
  IRoom,
} from '@/api/types';
import { ERoomStatus } from '@/api/types';

const API = 'http://localhost:3000';

const mockUser: IAuthUser = {
  id: 'user-1',
  name: 'Commander',
  email: 'commander@mars.gov',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiQ29tbWFuZGVyIn0.mock';

const mockRooms: IRoom[] = [
  {
    id: 'room-1',
    name: 'Mars Alpha-7',
    hostId: 'user-1',
    status: ERoomStatus.WAITING,
    players: [
      {
        id: 'user-1',
        name: 'Commander',
        seatIndex: 0,
        ready: true,
        isHost: true,
      },
    ],
    options: {
      playerCount: 2,
      alienModulesEnabled: [true, true, true, true, true],
      undoAllowed: true,
      timerPerTurn: 0,
    },
    gameId: null,
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-25T10:00:00Z',
  },
  {
    id: 'room-2',
    name: 'Deep Space Probe',
    hostId: 'user-2',
    status: ERoomStatus.PLAYING,
    players: [
      { id: 'user-2', name: 'Pilot', seatIndex: 0, ready: true, isHost: true },
      {
        id: 'user-3',
        name: 'Engineer',
        seatIndex: 1,
        ready: true,
        isHost: false,
      },
    ],
    options: {
      playerCount: 2,
      alienModulesEnabled: [true, true, true, true, true],
      undoAllowed: true,
      timerPerTurn: 120,
    },
    gameId: 'game-1',
    createdAt: '2026-03-25T09:00:00Z',
    updatedAt: '2026-03-25T09:30:00Z',
  },
];

const mockAlienTypeMap: Record<string, IAlienTypeOption> = {
  '1': { alienType: 1, alienName: 'anomalies', disabled: false },
  '2': { alienType: 2, alienName: 'centaurians', disabled: false },
  '3': { alienType: 3, alienName: 'exertians', disabled: false },
  '4': { alienType: 4, alienName: 'mascamites', disabled: false },
  '5': { alienType: 5, alienName: 'oumuamua', disabled: false },
  '6': { alienType: 6, alienName: 'amoeba', disabled: true },
  '7': { alienType: 7, alienName: 'glyphids', disabled: true },
  '8': { alienType: 8, alienName: 'dummy', disabled: true },
};

export const handlers = [
  http.get(`${API}/health`, () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post(`${API}/auth/login`, () => {
    return HttpResponse.json<ILoginResponse>({
      token: mockToken,
      user: mockUser,
    });
  }),

  http.post(`${API}/auth/register`, () => {
    return HttpResponse.json<IRegisterResponse>({
      token: mockToken,
      user: mockUser,
    });
  }),

  http.get(`${API}/auth/me`, () => {
    return HttpResponse.json<IAuthUser>(mockUser);
  }),

  http.put(`${API}/auth/me`, () => {
    return HttpResponse.json<IAuthUser>({
      ...mockUser,
      name: 'Updated Commander',
    });
  }),

  http.get(`${API}/lobby/rooms`, () => {
    return HttpResponse.json<IRoom[]>(mockRooms);
  }),

  http.get(`${API}/lobby/alien-types`, () => {
    return HttpResponse.json(mockAlienTypeMap);
  }),

  http.post(`${API}/lobby/rooms`, () => {
    const newRoom: IRoom = {
      id: 'room-new',
      name: 'New Mission',
      hostId: 'user-1',
      status: ERoomStatus.WAITING,
      players: [
        {
          id: 'user-1',
          name: 'Commander',
          seatIndex: 0,
          ready: true,
          isHost: true,
        },
      ],
      options: {
        playerCount: 2,
        alienModulesEnabled: [true, true, true, true, true],
        undoAllowed: true,
        timerPerTurn: 0,
      },
      gameId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json<IRoom>(newRoom, { status: 201 });
  }),

  http.get(`${API}/lobby/rooms/:id`, ({ params }) => {
    const room = mockRooms.find((r) => r.id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json<IRoom>(room);
  }),

  http.post(`${API}/lobby/rooms/:id/join`, ({ params }) => {
    const room = mockRooms.find((r) => r.id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json<IRoom>(room);
  }),

  http.post(`${API}/lobby/rooms/:id/leave`, ({ params }) => {
    const room = mockRooms.find((r) => r.id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json<IRoom>(room);
  }),

  http.post(`${API}/lobby/rooms/:id/start`, () => {
    return HttpResponse.json({ gameId: 'game-new' });
  }),
];
