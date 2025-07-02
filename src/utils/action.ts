/*
 * @Author: Ender-Wiggin
 * @Date: 2025-07-02 17:54:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-03 02:03:17
 * @Description:
 */

import {
  EAction,
  EActionMap,
  IReplayItem,
  IResourceItem,
} from '@/constant/replay';
import { getCardById } from '@/utils/card';

export const getSpendResourceFromActions = (
  actions: EAction[],
  replay: IReplayItem
): Partial<IResourceItem> => {
  return actions.reduce((acc: Partial<IResourceItem>, action) => {
    if (action === EAction.PLAY_CARD) {
      const currCard = getCardById(replay.card || '');
      const price = currCard?.price || 0;
      const { credit, ...rest } = EActionMap[action];
      // 先处理非card字段
      const nonCardResult = Object.keys(rest).reduce((sum, k) => {
        const key = k as keyof IResourceItem;
        if (key === 'card') return sum;
        const accTyped = acc as Partial<IResourceItem>;
        const restTyped = rest as Partial<IResourceItem>;
        sum[key] = (Number(accTyped[key]) || 0) + (Number(restTyped[key]) || 0);
        return sum;
      }, {} as Partial<IResourceItem>);
      // 合并card字段
      const cardArr = [
        ...((acc.card as string[] | undefined) || []),
        ...((rest.card as string[] | undefined) || []),
        currCard?.id || '',
      ].filter(Boolean);
      return {
        ...acc,
        ...nonCardResult,
        card: cardArr,
        credit: (acc.credit || 0) + (credit || 0) + price,
      } satisfies Partial<IResourceItem>;
    }

    return Object.keys(EActionMap[action] || {}).reduce(
      (sum, k) => {
        const key = k as keyof IResourceItem;
        if (key === 'card') {
          // 不处理 card
        } else {
          sum[key] =
            ((acc[key] as number) || 0) +
            ((EActionMap[action][key] as number) || 0);
        }
        return sum;
      },
      { ...acc }
    );
  }, {});
};

export const getComputedReplayItem = (replay: IReplayItem) => {
  const spendFromActions: Partial<IResourceItem> = getSpendResourceFromActions(
    replay.actions || [],
    replay
  );
  const originalSpend: Partial<IResourceItem> = replay.spend || {};
  // 先构造完整的结构
  const mergedSpend: IResourceItem = {
    credit: 0,
    energy: 0,
    publicity: 0,
    data: 0,
    card: [],
    score: 0,
    exofossil: 0,
  };
  // 累加originalSpend
  for (const key in originalSpend) {
    if (Object.prototype.hasOwnProperty.call(originalSpend, key)) {
      const k = key as keyof IResourceItem;
      if (k === 'card') {
        mergedSpend.card = (originalSpend.card as string[] | undefined) || [];
      } else {
        mergedSpend[k] = (originalSpend[k] as number) || 0;
      }
    }
  }
  // 累加spendFromActions
  for (const key in spendFromActions) {
    if (Object.prototype.hasOwnProperty.call(spendFromActions, key)) {
      const k = key as keyof IResourceItem;
      if (k === 'card') {
        mergedSpend.card = [
          ...mergedSpend.card,
          ...((spendFromActions.card as string[] | undefined) || []),
        ];
      } else {
        mergedSpend[k] =
          ((mergedSpend[k] as number) || 0) +
          ((spendFromActions[k] as number) || 0);
      }
    }
  }
  // card 字段保持 string[]
  let finalCard = mergedSpend.card;
  const incomeCardId = replay.gain?.income?.cardId;
  if (incomeCardId) {
    finalCard = Array.from(
      new Set([...(mergedSpend.card || []), incomeCardId])
    );
  }
  return {
    ...replay,
    spend: {
      ...mergedSpend,
      card: finalCard,
    },
  };
};

function mergeResource(
  base: Partial<IResourceItem>,
  add: Partial<IResourceItem> = {},
  sub: Partial<IResourceItem> = {}
): IResourceItem {
  return {
    credit: (base.credit || 0) + (add.credit || 0) - (sub.credit || 0),
    energy: (base.energy || 0) + (add.energy || 0) - (sub.energy || 0),
    publicity:
      (base.publicity || 0) + (add.publicity || 0) - (sub.publicity || 0),
    data: (base.data || 0) + (add.data || 0) - (sub.data || 0),
    card: [...(base.card || []), ...(add.card || [])].filter((c) => {
      if (Array.isArray(sub.card)) {
        return !sub.card.includes(c);
      }
      return c !== sub.card;
    }),
    score: (base.score || 0) + (add.score || 0) - (sub.score || 0),
    exofossil:
      (base.exofossil || 0) + (add.exofossil || 0) - (sub.exofossil || 0),
  };
}

export const getFinalReplayList = (
  replayList: Partial<IReplayItem>[]
): IReplayItem[] => {
  const result: IReplayItem[] = [];
  for (let i = 0; i < replayList.length; i++) {
    const prev = result[i - 1];
    let resources: IResourceItem | undefined = undefined;
    // 只要当前项 resources 存在且 card 字段是数组，就直接用当前项的
    if (
      replayList[i].resources &&
      Array.isArray(replayList[i].resources?.card)
    ) {
      resources = {
        credit: 0,
        energy: 0,
        publicity: 0,
        data: 0,
        card: [],
        score: 0,
        exofossil: 0,
        ...replayList[i].resources,
      };
    } else if (prev) {
      // 自动推算
      let gain: Partial<IResourceItem> = { ...prev.gain };
      if (prev.gain && prev.gain.income) {
        const income = prev.gain.income;
        const type = income.type;
        gain = {
          ...gain,
          [type]: ((gain[type] as number) || 0) + 1,
          card:
            (gain.card as string[] | undefined)?.filter(
              (c) => c !== income.cardId
            ) ?? [],
        };
      }
      // 保证 prev.resources 一定有值
      resources = mergeResource(
        prev.resources || {
          credit: 0,
          energy: 0,
          publicity: 0,
          data: 0,
          card: [],
          score: 0,
          exofossil: 0,
        },
        gain,
        prev.spend || {}
      );
    } else {
      // 第一项或都没有，兜底
      resources = {
        credit: 0,
        energy: 0,
        publicity: 0,
        data: 0,
        card: [],
        score: 0,
        exofossil: 0,
      };
    }

    const item: IReplayItem = {
      round: replayList[i].round ?? 0,
      turn: replayList[i].turn ?? 0,
      card: replayList[i].card,
      desc: replayList[i].desc ?? '',
      actions: replayList[i].actions ?? [],
      resources,
      spend: replayList[i].spend,
      gain: replayList[i].gain,
      income: replayList[i].income,
    };

    result.push(getComputedReplayItem(item));
  }
  return result;
};

export const getResourceCount = (resource: keyof IResourceItem) => {
  if (!resource) return 0;
  let value;
  if (Array.isArray(resource)) {
    value = resource.length;
  } else {
    value = Number(resource);
  }

  return isNaN(value) ? 0 : value;
};
