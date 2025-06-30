/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-22 00:26:20
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-22 22:02:46
 * @Description:
 */

export interface IResourceItem {
  credit: number;
  energy: number;
  publicity: number;
  data: number;
  card: number;
  score?: number;
  exofossil?: number;
}
export interface IReplayItem {
  round: number;
  turn: number;
  card?: string;
  cards?: string[];
  desc: string;
  resources: IResourceItem;
  spend?: Partial<IResourceItem>;
  gain?: Partial<IResourceItem> & { income?: keyof IResourceItem };
  income?: { credit: number; energy: number; card?: number };
}

export const REPLAY_LIST: IReplayItem[] = [
  {
    round: 1,
    turn: 0,
    desc: '开局插收入',
    // card: '100',
    cards: ['100', '69', '7', '53', '33'],
    resources: {
      credit: 4,
      energy: 3,
      card: 5,
      publicity: 4,
      data: 0,
      score: 2,
    },
    gain: { income: 'credit' },
    spend: { card: 1 },
  },
  {
    round: 1,
    turn: 1,
    desc: '发射信使号, 直奔水星',
    card: '7',
    resources: {
      credit: 5,
      energy: 3,
      card: 4,
      publicity: 4,
      data: 0,
      score: 2,
    },
    spend: { credit: 3, energy: 1, card: 1 },
  },
  {
    round: 1,
    turn: 2,
    desc: '用电走路, 环绕水星, 完成任务',
    card: '109',
    resources: {
      credit: 2,
      energy: 2,
      card: 3,
      publicity: 4,
      data: 0,
      score: 14,
    },
    spend: { credit: 1, energy: 2, card: 1 },
    gain: { income: 'energy', data: 2, card: 1, score: 12, publicity: 2 },
  },
  {
    round: 1,
    turn: 3,
    desc: '买紫4 (扫描后发射或移动)',
    resources: {
      credit: 1,
      energy: 1,
      card: 3,
      publicity: 6,
      data: 2,
      score: 16,
    },
    spend: { publicity: 6 },
    gain: { score: 2, energy: 1 },
  },
  {
    round: 1,
    turn: 4,
    desc: '标动扫, 插收入后发射',
    resources: {
      credit: 1,
      energy: 2,
      card: 3,
      publicity: 0,
      data: 2,
      score: 16,
    },
    spend: { credit: 1, energy: 3, card: 1 },
    gain: { income: 'energy', data: 2, publicity: 1 },
  },
  {
    round: 1,
    turn: 5,
    desc: '大跳, 选牌',
    card: '54',
    resources: {
      credit: 0,
      energy: 0,
      card: 2,
      publicity: 1,
      data: 4,
      score: 16,
    },
    gain: { card: 1 },
  },
  {
    round: 2,
    turn: 0,
    desc: '收入',
    card: '70',
    resources: {
      credit: 0,
      energy: 0,
      card: 3,
      publicity: 1,
      data: 4,
      score: 16,
    },
    gain: { credit: 4, energy: 4, card: 1 },
  },
  {
    round: 2,
    turn: 1,
    desc: '打牌拿蓝科(钱), 花电一步上火星',
    card: '109',
    resources: {
      credit: 4,
      energy: 4,
      card: 3,
      publicity: 1,
      data: 4,
      score: 21,
    },
    gain: { score: 5, energy: 1, publicity: 1 },
    spend: { card: 1, credit: 3, energy: 1 },
  },
  {
    round: 2,
    turn: 2,
    desc: '登陆火星, 标第二个外星人黄色踪迹',
    resources: {
      credit: 1,
      energy: 4,
      card: 3,
      publicity: 2,
      data: 4,
      score: 30,
    },
    gain: { score: 9, publicity: 1, data: 2 },
    spend: { energy: 2 },
  },
  {
    round: 2,
    turn: 3,
    desc: '蓝科拿钱, 打牌扫描+发射',
    card: '54',
    resources: {
      credit: 1,
      energy: 2,
      card: 3,
      publicity: 3,
      data: 6,
      score: 34,
    },
    gain: { score: 4, data: 2, credit: 1 },
    spend: { card: 1, credit: 2, energy: 1 },
  },

  {
    round: 2,
    turn: 4,
    desc: '电脑行动 (另外扇区被扫完+1宣传)',
    card: 'ET.23',
    resources: {
      credit: 0,
      energy: 1,
      card: 2,
      publicity: 3,
      data: 8,
      score: 37,
      exofossil: 0,
    },
    gain: { score: 3, exofossil: 1, card: 1, publicity: 1 },
    spend: { energy: 1, data: 7 },
  },

  {
    round: 2,
    turn: 5,
    desc: '弃牌拿科技+精选',
    card: '19',
    resources: {
      credit: 0,
      energy: 0,
      card: 3,
      publicity: 4,
      data: 1,
      exofossil: 1,
      score: 37,
    },
    gain: { card: 1, publicity: 2 },
    spend: { publicity: 6, card: 1 },
  },

  {
    round: 2,
    turn: 6,
    desc: '大过, 选牌',
    card: '102',
    resources: {
      credit: 0,
      energy: 0,
      card: 3,
      publicity: 0,
      data: 1,
      exofossil: 1,
      score: 37,
    },
    gain: { card: 1 },
    spend: {},
  },
  {
    round: 2,
    turn: 6,
    desc: '开出了我最爱的九折😭😭😭',
    card: '102',
    resources: {
      credit: 0,
      energy: 0,
      card: 3,
      publicity: 0,
      data: 1,
      exofossil: 1,
      score: 37,
    },
  },

  {
    round: 3,
    turn: 0,
    desc: '收入',
    card: '74',
    resources: {
      credit: 0,
      energy: 0,
      card: 4,
      publicity: 0,
      data: 1,
      exofossil: 1,
      score: 37,
    },
    gain: { credit: 4, energy: 4, card: 1 },
  },

  {
    round: 3,
    turn: 1,
    desc: '打牌',
    card: '102',
    resources: {
      credit: 4,
      energy: 4,
      card: 5,
      publicity: 0,
      data: 1,
      exofossil: 1,
      score: 37,
    },
    gain: { publicity: 3 },
    spend: { card: 1, credit: 2 },
  },
  {
    round: 3,
    turn: 2,
    desc: '打牌扫描, 移动探测器',
    card: '53',
    resources: {
      credit: 2,
      energy: 4,
      card: 4,
      publicity: 3,
      data: 1,
      exofossil: 1,
      score: 43,
    },
    gain: { data: 3, score: 6, publicity: 1 },
    spend: { card: 1, credit: 2, publicity: 1 },
  },
  {
    round: 3,
    turn: 3,
    desc: '贴蓝科, 标动扫描, 3宣传选牌',
    card: '16',
    resources: {
      credit: 0,
      energy: 4,
      card: 3,
      publicity: 3,
      data: 4,
      exofossil: 1,
      score: 47,
    },
    gain: { credit: 1, data: 3, score: 4, publicity: 1, card: 1 },
    spend: { credit: 1, energy: 2, publicity: 4 },
  },
  {
    round: 3,
    turn: 4,
    desc: '插收入, 电脑行动',
    card: 'ET.30',
    resources: {
      credit: 0,
      energy: 2,
      card: 4,
      publicity: 0,
      data: 7,
      exofossil: 1,
      score: 50,
    },
    gain: { income: 'credit', publicity: 1, score: 3, card: 1 },
    spend: { energy: 1, data: 7, card: 1 },
  },
  {
    round: 3,
    turn: 5,
    desc: '打牌着陆木星, 点九折黄灯',
    card: '16',
    resources: {
      credit: 1,
      energy: 1,
      card: 4,
      publicity: 1,
      data: 0,
      exofossil: 1,
      score: 61,
    },
    gain: { data: 2, score: 11, energy: 1, card: 1 },
    spend: { credit: 1, card: 1 },
  },
  {
    round: 3,
    turn: 6,
    desc: '贴蓝科拿钱+宣传, 标动扫, 插电收入发射',
    // card: '16',
    resources: {
      credit: 0,
      energy: 2,
      card: 4,
      publicity: 2,
      data: 2,
      exofossil: 1,
      score: 63,
    },
    gain: { credit: 1, data: 3, score: 2, income: 'energy', publicity: 1 },
    spend: { credit: 1, card: 1, energy: 3, publicity: 1 },
  },
];
