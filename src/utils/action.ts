/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-07-02 17:54:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-03 16:17:56
 * @Description:
 */

import {
  EAction,
  EActionGainMap,
  EActionSpendMap,
  IReplayItem,
  IResourceItem,
} from '@/constant/replay';
import { getCardById } from '@/utils/card';

import { IFreeAction } from '@/types/BaseCard';

export const getResourceFromActions = (
  actions: EAction[],
  replay: IReplayItem,
  type: 'spend' | 'gain'
): Partial<IResourceItem> => {
  const map = type === 'spend' ? EActionSpendMap : EActionGainMap;
  return actions.reduce((acc: Partial<IResourceItem>, action) => {
    if (action === EAction.PLAY_CARD && type === 'spend') {
      const currCard = getCardById(replay.card || '');
      const price = currCard?.price || 0;
      const { credit, ...rest } = map[action];
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

    return Object.keys(map[action] || {}).reduce(
      (sum, k) => {
        const key = k as keyof IResourceItem;
        if (key === 'card') {
          // 不处理 card
        } else {
          sum[key] =
            ((acc[key] as number) || 0) + ((map[action][key] as number) || 0);
        }
        return sum;
      },
      { ...acc }
    );
  }, {});
};

function freeActionsToResourceItem(
  freeActions: IFreeAction[]
): Partial<IResourceItem> {
  return freeActions.reduce((acc, action) => {
    const key = action.type as keyof IResourceItem;
    acc[key] = ((acc[key] as number) || 0) + action.value;
    return acc;
  }, {} as Partial<IResourceItem>);
}

export const getComputedReplayItem = (replay: IReplayItem) => {
  const spendFromActions: Partial<IResourceItem> = getResourceFromActions(
    replay.actions || [],
    replay,
    'spend'
  );
  const gainFromActions: Partial<IResourceItem> = getResourceFromActions(
    replay.actions || [],
    replay,
    'gain'
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

  // freeAction: spend 处理
  if (replay.freeActionCards && replay.freeActionCards.length > 0) {
    mergedSpend.card = Array.from(
      new Set([...mergedSpend.card, ...replay.freeActionCards])
    );
  }

  // card 字段保持 string[]
  let finalCard = mergedSpend.card;
  const incomeCardId = replay.gain?.income?.cardId;
  if (incomeCardId) {
    finalCard = Array.from(
      new Set([...(mergedSpend.card || []), incomeCardId])
    );
  }

  // 处理 gain 字段
  let computedGain: Partial<IResourceItem> | undefined = undefined;
  if (replay.gain) {
    // 1. income 累加处理
    const { income, ...restGain } = replay.gain;
    computedGain = { ...restGain };
    if (income) {
      const { type } = income;
      computedGain[type] = ((computedGain[type] as number) || 0) + 1;
    }
    // 2. mark 处理
    if (replay.mark) {
      const markSum = Object.values(replay.mark).reduce(
        (sum, v) => sum + (typeof v === 'number' ? v : 0),
        0
      );
      if (computedGain) {
        computedGain.data = (computedGain.data || 0) + markSum;
      } else {
        computedGain = { data: markSum };
      }
    }
    // 3. 只保留资源字段（去掉income和mark）
    if (computedGain) {
      const { income, mark, ...resourceGain } = computedGain as any;
      computedGain = resourceGain;
    }
  }

  // freeAction: gain 处理
  const freeActionGain: Partial<IResourceItem> = {};
  if (replay.freeActionCards && replay.freeActionCards.length > 0) {
    for (const cardId of replay.freeActionCards) {
      const card = getCardById(cardId);
      if (card && Array.isArray(card.freeAction)) {
        const gain = freeActionsToResourceItem(card.freeAction);
        console.log('🎸 [test] - getComputedReplayItem - gain:', gain);
        for (const key in gain) {
          const k = key as keyof IResourceItem;
          if (k === 'card') continue; // freeAction 不会有 card
          freeActionGain[k] =
            ((freeActionGain[k] as number) || 0) + ((gain[k] as number) || 0);
        }
      }
    }
  }

  // 合并 gainFromActions、computedGain、freeActionGain
  let finalGain: Partial<IResourceItem> | undefined = undefined;
  if (
    computedGain ||
    Object.keys(gainFromActions).length > 0 ||
    Object.keys(freeActionGain).length > 0
  ) {
    finalGain = { ...gainFromActions };
    if (computedGain) {
      for (const key in computedGain) {
        if (key === 'card') {
          // 合并所有来源的 card 字段并去重
          finalGain.card = Array.from(
            new Set([
              ...((finalGain.card as string[] | undefined) || []),
              ...((computedGain.card as string[] | undefined) || []),
              ...((freeActionGain.card as string[] | undefined) || []),
              ...((replay.gain?.card as string[] | undefined) || []),
            ])
          );
        } else {
          const keyTyped = key as keyof IResourceItem;
          // 只对 number 字段做累加
          if (typeof computedGain[keyTyped] === 'number') {
            const finalGainTyped = finalGain as any;
            const computedGainTyped = computedGain as any;
            finalGainTyped[keyTyped] =
              ((finalGainTyped[keyTyped] as number) || 0) +
              ((computedGainTyped[keyTyped] as number) || 0);
          }
        }
      }
    }
    // 合并 freeActionGain 的数值字段
    for (const key in freeActionGain) {
      if (key === 'card') {
        finalGain.card = Array.from(
          new Set([
            ...((finalGain.card as string[] | undefined) || []),
            ...((freeActionGain.card as string[] | undefined) || []),
          ])
        );
        continue;
      }
      const keyTyped = key as keyof IResourceItem;
      if (typeof freeActionGain[keyTyped] === 'number') {
        const finalGainTyped = finalGain as any;
        finalGainTyped[keyTyped] =
          ((finalGainTyped[keyTyped] as number) || 0) +
          ((freeActionGain[keyTyped] as number) || 0);
      }
    }
  }

  return {
    ...replay,
    spend: {
      ...mergedSpend,
      card: finalCard,
    },
    gain: finalGain,
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
    launch: (base.launch || 0) + (add.launch || 0) - (sub.launch || 0),
    redTrace: (base.redTrace || 0) + (add.redTrace || 0) - (sub.redTrace || 0),
    yellowTrace:
      (base.yellowTrace || 0) + (add.yellowTrace || 0) - (sub.yellowTrace || 0),
    blueTrace:
      (base.blueTrace || 0) + (add.blueTrace || 0) - (sub.blueTrace || 0),
    tech: (base.tech || 0) + (add.tech || 0) - (sub.tech || 0),
    move: (base.move || 0) + (add.move || 0) - (sub.move || 0),
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
      mark: replayList[i].mark,
      freeActionCards: replayList[i].freeActionCards,
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
