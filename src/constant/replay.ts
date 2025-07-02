/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-22 00:26:20
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-02 19:08:08
 * @Description:
 */

export interface IResourceItem {
  credit: number;
  energy: number;
  publicity: number;
  data: number;
  card: string[];
  score?: number;
  exofossil?: number;
}

export enum EAction {
  STANDARD_SCAN,
  STANDARD_LAUNCH,
  STANDARD_TECH,
  TECH_LAUNCH,
  ANALYZE,
  PLAY_CARD,
  STANDARD_MOVE,
  STANDARD_LAND,
  STANDARD_ORBIT,
}

export const EActionMap: Record<EAction, Partial<IResourceItem>> = {
  [EAction.STANDARD_SCAN]: {
    credit: 1,
    energy: 2,
  },
  [EAction.STANDARD_LAUNCH]: {
    credit: 2,
  },
  [EAction.STANDARD_TECH]: {
    publicity: 6,
  },
  [EAction.TECH_LAUNCH]: {
    energy: 1,
  },
  [EAction.ANALYZE]: {
    energy: 1,
  },
  [EAction.PLAY_CARD]: {},
  [EAction.STANDARD_MOVE]: {
    energy: 1,
  },
  [EAction.STANDARD_LAND]: {
    energy: 2,
  },
  [EAction.STANDARD_ORBIT]: {
    credit: 1,
    energy: 1,
  },
};

export interface IReplayItem {
  round: number;
  turn: number;
  card?: string;
  desc: string;
  actions?: EAction[];
  resources: IResourceItem;
  spend?: Partial<IResourceItem>;
  gain?: Partial<IResourceItem> & {
    income?: { type: keyof IResourceItem; cardId: string };
  };
  income?: { credit: number; energy: number; card?: number };
}

export const REPLAY_LIST: Partial<IReplayItem>[] = [
  {
    round: 1,
    turn: 0,
    desc: '开局插收入',
    actions: [EAction.PLAY_CARD],
    // card: '100',
    resources: {
      credit: 4,
      energy: 3,
      card: ['100', '69', '7', '53', '33'],
      publicity: 4,
      data: 0,
      score: 2,
    },
    gain: { income: { type: 'credit', cardId: '100' } },
    spend: {},
  },
];
