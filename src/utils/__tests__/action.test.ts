/*
 * @Author: Ender-Wiggin
 * @Date: 2025-07-02 18:11:37
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-02 19:55:35
 * @Description:
 */
import { EAction, IReplayItem } from '@/constant/replay';

import { getComputedReplayItem, getFinalReplayList } from '../action';

describe('getComputedReplayItem', () => {
  it('should merge spend and actions correctly', () => {
    const replay: IReplayItem = {
      round: 1,
      turn: 1,
      card: '70',
      desc: 'test',
      actions: [EAction.PLAY_CARD, EAction.STANDARD_SCAN],
      resources: {
        credit: 0,
        energy: 0,
        publicity: 0,
        data: 0,
        card: ['1', '2', '3', '4', '70'],
      },
      spend: { energy: 2, card: ['1', '2'] },
      gain: { income: { type: 'credit', cardId: '3' } },
    };
    const computed = getComputedReplayItem(replay);
    // spend: { energy: 2, card: 1 } + PLAY_CARD(credit+3) + STANDARD_SCAN(credit+1, energy+2)
    expect(computed.spend).toEqual({
      credit: 4, // 3 (card price) + 1 (scan)
      energy: 4, // 2 (original) + 2 (scan)
      publicity: 0,
      data: 0,
      card: ['1', '2', '70', '3'], // original
      score: 0,
      exofossil: 0,
    });
  });
});

describe('getFinalReplayList', () => {
  it('should map and compute all items', () => {
    const replayList: IReplayItem[] = [
      {
        round: 1,
        turn: 1,
        card: '70',
        desc: 'test',
        actions: [EAction.PLAY_CARD],
        resources: {
          credit: 0,
          energy: 0,
          publicity: 0,
          data: 0,
          card: ['1', '2', '3', '4', '5', '70'],
        },
        spend: { publicity: 2 },
        gain: { income: { type: 'credit', cardId: '1' } },
      },
    ];
    const result = getFinalReplayList(replayList);
    expect(result[0].spend).toEqual({
      credit: 3,
      energy: 0,
      publicity: 2,
      data: 0,
      card: ['70', '1'],
      score: 0,
      exofossil: 0,
    });
  });

  it('should fill resources based on previous spend/gain and handle income rule', () => {
    const replayList: Partial<IReplayItem>[] = [
      {
        round: 1,
        turn: 1,
        card: '70',
        desc: 'test',
        actions: [EAction.PLAY_CARD],
        resources: {
          credit: 5,
          energy: 2,
          publicity: 1,
          data: 4,
          card: ['1', '2', '3', '4', '70'],
        },
        spend: { credit: 1 },
        gain: { income: { type: 'energy', cardId: '1' }, data: 1 },
      },
      {
        round: 1,
        turn: 2,
        desc: 'auto resource',
        actions: [EAction.STANDARD_SCAN],
        // 没有resources字段
        spend: { energy: 1 },
      },
      {
        round: 1,
        turn: 2,
        desc: 'auto resource',
        actions: [],
        // 没有resources字段
        spend: { energy: 1 },
      },
    ];
    const result = getFinalReplayList(replayList);
    expect(result[1].resources).toEqual({
      credit: 1,
      energy: 3,
      publicity: 1,
      data: 5,
      card: ['2', '3', '4'],
      score: 0,
      exofossil: 0,
    });
    expect(result[2].resources).toEqual({
      credit: 0,
      energy: 0,
      publicity: 1,
      data: 5,
      card: ['2', '3', '4'],
      score: 0,
      exofossil: 0,
    });
  });
});
