import type { IComputerColumnConfig } from '@seti/common/types/computer';
import { EResource } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';

describe('Player', () => {
  it('creates a player with default setup state', () => {
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });

    expect(player.id).toBe('p1');
    expect(player.name).toBe('Alice');
    expect(player.color).toBe('red');
    expect(player.seatIndex).toBe(0);
    expect(player.score).toBe(1);
    expect(player.publicity).toBe(4);
    expect(player.getResourceSnapshot()).toEqual({
      credits: 4,
      energy: 3,
      publicity: 4,
      data: 0,
    });
    expect(player.income.computeRoundPayout()[EResource.CREDIT]).toBe(0);
    expect(player.income.computeRoundPayout()[EResource.ENERGY]).toBe(0);
    expect(player.passed).toBe(false);
    expect(player.probesInSpace).toBe(0);
    expect(player.probeSpaceLimit).toBe(1);
    expect(player.game).toBeNull();
  });

  it('supports custom initialization and subsystem options', () => {
    const customCols: IComputerColumnConfig[] = [
      { topReward: null, techSlotAvailable: true },
      { topReward: null, techSlotAvailable: true },
      { topReward: null, techSlotAvailable: true },
      { topReward: null, techSlotAvailable: true },
    ];
    const player = new Player({
      id: 'p2',
      name: 'Bob',
      color: 'blue',
      seatIndex: 1,
      score: 10,
      publicity: 6,
      resources: { credits: 7, energy: 5, data: 2 },
      baseIncome: { [EResource.CREDIT]: 2, [EResource.ENERGY]: 1 },
      tuckedCardIncome: {
        [EResource.CREDIT]: 1,
        [EResource.ENERGY]: 2,
        [EResource.MOVE]: 1,
      },
      computerColumnConfigs: customCols,
      dataPoolCount: 3,
      hand: ['card-1'],
      techs: [ETechId.PROBE_DOUBLE_PROBE],
      probesInSpace: 1,
      probeSpaceLimit: 2,
    });

    expect(player.score).toBe(10);
    expect(player.publicity).toBe(6);
    expect(player.getResourceSnapshot()).toEqual({
      credits: 7,
      energy: 5,
      publicity: 6,
      data: 5,
    });
    expect(player.income.computeRoundPayout()[EResource.CREDIT]).toBe(3);
    expect(player.income.computeRoundPayout()[EResource.ENERGY]).toBe(3);
    expect(player.income.computeRoundPayout()[EResource.MOVE]).toBe(1);
    expect(player.computer.getTopSlots()).toHaveLength(4);
    expect(player.computer.columnCount).toBe(4);
    expect(player.dataPool.count).toBe(3);
    expect(player.hand).toEqual(['card-1']);
    expect(player.techs).toEqual([ETechId.PROBE_DOUBLE_PROBE]);
    expect(player.probesInSpace).toBe(1);
    expect(player.probeSpaceLimit).toBe(2);
  });

  it('flushes stash data into data pool at turn end', () => {
    const player = new Player({
      id: 'p4',
      name: 'David',
      color: 'yellow',
      seatIndex: 3,
      dataPoolCount: 5,
      resources: { data: 3 },
    });

    const result = player.flushDataStashAtTurnEnd();
    expect(result).toEqual({ movedToPool: 1, discarded: 2 });
    expect(player.data.getState().stash).toBe(0);
    expect(player.data.getState().pool).toBe(6);
    expect(player.getResourceSnapshot().data).toBe(6);
  });

  it('applies round income to resources and move stash', () => {
    const player = new Player({
      id: 'p5',
      name: 'Evan',
      color: 'purple',
      seatIndex: 0,
      resources: { credits: 1, energy: 1, publicity: 1, data: 0 },
      baseIncome: {
        [EResource.CREDIT]: 1,
        [EResource.ENERGY]: 2,
        [EResource.PUBLICITY]: 3,
        [EResource.DATA]: 1,
        [EResource.SCORE]: 2,
        [EResource.CARD]: 1,
        [EResource.MOVE]: 2,
      },
    });

    const payout = player.applyRoundIncome();
    expect(payout[EResource.CREDIT]).toBe(1);
    expect(payout[EResource.MOVE]).toBe(2);
    expect(player.getResourceSnapshot()).toEqual({
      credits: 2,
      energy: 3,
      publicity: 4,
      data: 1,
    });
    expect(player.score).toBe(3);
    expect(player.getMoveStash()).toBe(2);
    expect(player.getPendingCardDrawCount()).toBe(1);
  });

  it('discards move stash automatically at turn end', () => {
    const player = new Player({
      id: 'p6',
      name: 'Frank',
      color: 'black',
      seatIndex: 0,
    });

    player.gainMove(3);
    player.spendMove(1);
    expect(player.getMoveStash()).toBe(2);
    const flushResult = player.flushTurnStashAtTurnEnd();
    expect(flushResult.moveDiscarded).toBe(2);
    expect(player.getMoveStash()).toBe(0);
  });

  it('binds game reference via bindGame', () => {
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    const game = { id: 'game-1' } as IGame;

    player.bindGame(game);

    expect(player.game).toBe(game);
  });

  it('copies input arrays to avoid external mutation', () => {
    const hand = ['card-1'];
    const player = new Player({
      id: 'p3',
      name: 'Cathy',
      color: 'green',
      seatIndex: 2,
      hand,
    });

    hand.push('card-2');
    expect(player.hand).toEqual(['card-1']);
  });

  it('validates numeric initialization constraints', () => {
    expect(
      () =>
        new Player({
          id: 'p1',
          name: 'Alice',
          color: 'red',
          seatIndex: -1,
        }),
    ).toThrow();
    expect(
      () =>
        new Player({
          id: 'p1',
          name: 'Alice',
          color: 'red',
          seatIndex: 0,
          publicity: 11,
        }),
    ).toThrow();
    expect(
      () =>
        new Player({
          id: 'p1',
          name: 'Alice',
          color: 'red',
          seatIndex: 0,
          score: -1,
        }),
    ).toThrow();
    expect(
      () =>
        new Player({
          id: 'p1',
          name: 'Alice',
          color: 'red',
          seatIndex: 0,
          publicity: -1,
        }),
    ).toThrow();
    expect(
      () =>
        new Player({
          id: 'p1',
          name: 'Alice',
          color: 'red',
          seatIndex: 0,
          probeSpaceLimit: 0,
        }),
    ).toThrow();
    expect(
      () =>
        new Player({
          id: 'p1',
          name: 'Alice',
          color: 'red',
          seatIndex: 0,
          probesInSpace: 2,
          probeSpaceLimit: 1,
        }),
    ).toThrow();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
    });
    expect(() => player.spendMove(1)).toThrow();
  });
});
