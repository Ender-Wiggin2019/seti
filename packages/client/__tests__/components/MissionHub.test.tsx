import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ERoomStatus, type IRoom } from '@/api/types';
import { MissionHubView } from '@/components/MissionHub';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

describe('MissionHubView', () => {
  it('renders the lunar mission hub structure from the lobby reference', () => {
    const onCreateMission = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <MissionHubView
        title='任务中心'
        subtitle='探索未知，连接未来。'
        kicker='可加入任务'
        createLabel='创建任务'
        onCreateMission={onCreateMission}
        filter='all'
        onFilterChange={onFilterChange}
        filterLabels={{
          all: '全部',
          waiting: '等待玩家',
          playing: '进行中',
        }}
        stats={{
          waiting: 1,
          playing: 1,
          players: 3,
        }}
        statLabels={{
          waiting: '等待玩家',
          waitingSub: '可加入任务',
          playing: '进行中',
          playingSub: '已开始任务',
          players: '参与玩家',
          playersSub: '当前任务中',
        }}
        rooms={[createRoom('room-1', 'Mercury Relay', ERoomStatus.WAITING)]}
        emptyLabel='暂无任务'
      />,
    );

    expect(screen.getByTestId('mission-hub')).toBeInTheDocument();
    expect(screen.getByTestId('mission-hero-scene')).toHaveAttribute(
      'data-scene',
      'lunar-lobby',
    );
    expect(screen.getByTestId('mission-hero-scene')).toHaveAttribute(
      'data-scene-treatment',
      'single-image',
    );
    expect(screen.getByTestId('mission-hero-image')).toHaveAttribute(
      'src',
      '/assets/seti/sprites/terrain_00_02.webp',
    );
    expect(screen.getByText('任务中心')).toBeInTheDocument();
    expect(screen.getByText('探索未知，连接未来。')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '创建任务' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('mission-stat-waiting')).toHaveTextContent('01');
    expect(screen.getByTestId('mission-stat-playing')).toHaveTextContent('01');
    expect(screen.getByTestId('mission-stat-players')).toHaveTextContent('03');
    expect(screen.getByTestId('mission-room-list')).toHaveAttribute(
      'data-panel-scene',
      'list',
    );
    expect(screen.getByRole('tab', { name: '全部' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Mercury Relay')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '创建任务' }));
    expect(onCreateMission).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('tab', { name: '等待玩家' }));
    expect(onFilterChange).toHaveBeenCalledWith(ERoomStatus.WAITING);
  });
});

function createRoom(id: string, name: string, status: ERoomStatus): IRoom {
  return {
    id,
    name,
    hostId: 'p1',
    status,
    players: [
      {
        id: 'p1',
        name: 'Commander',
        seatIndex: 0,
        ready: true,
        isHost: true,
      },
    ],
    options: {
      playerCount: 2,
      isSoloMode: false,
      soloDifficulty: 1,
      alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
      undoAllowed: true,
      timerPerTurn: 0,
      expansions: [],
    },
    gameId: null,
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  };
}
