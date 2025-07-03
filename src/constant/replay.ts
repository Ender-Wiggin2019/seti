/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-22 00:26:20
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-03 17:11:56
 * @Description:
 */

export interface IResourceItem {
  credit: number;
  energy: number;
  publicity: number;
  data: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  card: any;
  score?: number;
  exofossil?: number;
  launch?: number;
  redTrace?: number;
  yellowTrace?: number;
  blueTrace?: number;
  tech?: number;
  move?: number;
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
  INCOME,
  WIN_RED_TRACE,
  WIN_3_VP,
  SECTOR_OTHER_WIN,
}

export const EActionSpendMap: Record<EAction, Partial<IResourceItem>> = {
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
    launch: 1,
  },
  [EAction.STANDARD_ORBIT]: {
    credit: 1,
    energy: 1,
    launch: 1,
  },
  [EAction.INCOME]: {},
  [EAction.WIN_RED_TRACE]: {},
  [EAction.WIN_3_VP]: {},
  [EAction.SECTOR_OTHER_WIN]: {},
};

export const EActionGainMap: Record<EAction, Partial<IResourceItem>> = {
  [EAction.STANDARD_SCAN]: {},
  [EAction.STANDARD_LAUNCH]: {
    launch: 1,
  },
  [EAction.STANDARD_TECH]: {
    tech: 1,
  },
  [EAction.TECH_LAUNCH]: {
    launch: 1,
  },
  [EAction.ANALYZE]: {
    blueTrace: 1,
  },
  [EAction.PLAY_CARD]: {},
  [EAction.STANDARD_MOVE]: {},
  [EAction.STANDARD_LAND]: {},
  [EAction.STANDARD_ORBIT]: {},
  [EAction.INCOME]: {},
  [EAction.WIN_RED_TRACE]: {
    publicity: 1,
    redTrace: 1,
  },
  [EAction.WIN_3_VP]: {
    publicity: 1,
    score: 3,
  },
  [EAction.SECTOR_OTHER_WIN]: {
    publicity: 1,
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
  freeActionCards?: string[];
  gain?: Partial<IResourceItem> & {
    income?: { type: keyof IResourceItem; cardId: string };
  };
  income?: { credit: number; energy: number; card?: number };
  mark?: {
    barnardsStar?: number;
    procyon?: number;
    betaPictoris?: number;
    kepler22?: number;
    siriusA?: number;
    vega?: number;
    at61Virginis?: number;
    proximaCentauri?: number;
  };
}

export const REPLAY_LIST: Partial<IReplayItem>[] = [
  {
    round: 1,
    turn: 0,
    desc: 'Tuck Income',
    actions: [EAction.INCOME],
    resources: {
      credit: 4,
      energy: 3,
      card: ['65', '53', '32', '30', '83'],
      publicity: 4,
      data: 0,
      score: 2,
    },
    gain: { income: { type: 'credit', cardId: '32' } },
    spend: {},
  },
  {
    round: 1,
    turn: 1,
    desc: 'FAST',
    actions: [EAction.PLAY_CARD],
    card: '65',
    gain: { card: ['5'], score: 2 },
    spend: {},
    mark: {
      procyon: 2,
    },
  },
  {
    round: 1,
    turn: 2,
    desc: 'Scan',
    actions: [
      EAction.STANDARD_SCAN,
      EAction.WIN_RED_TRACE,
      EAction.TECH_LAUNCH,
    ],
    gain: { score: 3, publicity: 1, income: { type: 'credit', cardId: '5' } },
    spend: {},
    mark: {
      proximaCentauri: 1,
      procyon: 1,
    },
  },
  {
    round: 1,
    turn: 3,
    desc: '',
    actions: [EAction.STANDARD_TECH],
    gain: { score: 2, energy: 1 },
    spend: {},
  },
  {
    round: 1,
    turn: 4,
    desc: 'Scan',
    actions: [EAction.STANDARD_ORBIT],
    gain: {
      score: 5,
      publicity: 2,
      card: ['70'],
      income: { type: 'energy', cardId: '83' },
    },
    spend: {},
    freeActionCards: ['30'],
    mark: {
      at61Virginis: 1,
    },
  },
  {
    round: 1,
    turn: 5,
    desc: 'Pass',
    gain: { card: ['98'] },
  },
  {
    round: 2,
    turn: 0,
    desc: 'Income',
    gain: { credit: 5, energy: 3, card: ['116'] },
  },
  {
    round: 2,
    turn: 1,
    actions: [EAction.PLAY_CARD],
    card: '70',
    desc: '',
    gain: { score: 2, tech: 1, energy: 1 },
  },
  {
    round: 2,
    turn: 2,
    actions: [EAction.PLAY_CARD, EAction.TECH_LAUNCH],
    card: '53',
    desc: 'Scan, Place data',
    gain: { score: 4, credit: 1 },
    mark: {
      kepler22: 1,
      procyon: 1,
      vega: 1,
    },
  },
  {
    round: 2,
    turn: 3,
    actions: [EAction.ANALYZE],
    desc: '',
    spend: { data: 7 },
    gain: { score: 3, publicity: 1 },
  },
  {
    round: 2,
    turn: 4,
    actions: [EAction.STANDARD_SCAN],
    desc: '',
    spend: { publicity: 1, move: 1 },
    gain: { score: 2, publicity: 1, move: 1 },
    mark: {
      kepler22: 1,
      proximaCentauri: 1,
      procyon: 1,
    },
  },
  {
    round: 2,
    turn: 5,
    actions: [EAction.STANDARD_LAND],
    desc: 'Put data',
    spend: {},
    gain: {
      credit: 1,
      data: 1,
      yellowTrace: 1,
      score: 9,
      publicity: 2,
      income: { type: 'energy', cardId: '98' },
      card: ['ET.5', 'ET.8', 'ET.10'],
    },
  },
  {
    round: 2,
    turn: 6,
    desc: 'Pass',
    gain: { card: ['96'] },
  },
  {
    round: 3,
    turn: 0,
    desc: 'Income',
    gain: { credit: 5, energy: 4, card: ['115'] },
  },
];
