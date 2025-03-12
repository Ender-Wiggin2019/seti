import React, { useMemo, useState } from 'react';

import { EffectContainer } from '@/components/effect/EffectContainer';
import { DescInput } from '@/components/form/DescInput';
import { EffectSelector } from '@/components/form/EffectSelector';

import { m } from '@/constant/effect';
import { updateEffectArray } from '@/utils/effect';

import { EEffectType, Effect, IMissionEffect } from '@/types/effect';
import { QuickMissionSelector } from '@/components/form/QuickMissionSelector';
import { FullMissionSelector } from '@/components/form/FullMissionSelector';

type Props = {
  selectedEffects: Effect[];
  onChange?: (effects: Effect[]) => void;
  type?: EEffectType;
};
export const EffectsGenerator = ({
  selectedEffects,
  onChange,
  type,
}: Props) => {
  const [currentEffects, setCurrentEffects] =
    useState<Effect[]>(selectedEffects);
  const [quickMissionEffect, setQuickMissionEffect] =
    useState<IMissionEffect | null>(null);
  const [fullMissionEffect, setFullMissionEffect] =
    useState<IMissionEffect | null>(null);
  // console.log('🎸 [test] - currentEffects:', currentEffects);
  const handleEffectChange = (effect: Effect, action?: 'del') => {
    // console.log('🎸 [test] - handleEffectChange - effect:', effect);
    setCurrentEffects((prevEffects) =>
      updateEffectArray(prevEffects, effect, action)
    );
    onChange?.(updateEffectArray(currentEffects, effect, action));
  };

  const handleAddQuickMission = () => {
    // init
    setQuickMissionEffect(m.QUICK_MISSION([], []));
  };

  const handleAddFullMission = () => {
    // init
    setFullMissionEffect(m.FULL_MISSION([{ req: [], reward: [] }], ''));
  };
  const handleUpdateQuickMission = (effect: IMissionEffect) => {
    console.log('🎸 [test] - handleUpdateQuickMission - effect:', effect);
    setQuickMissionEffect(effect);
  };

  const handleUpdateFullMission = (effect: IMissionEffect) => {
    console.log('🎸 [test] - handleUpdateQuickMission - effect:', effect);
    setFullMissionEffect(effect);
  };
  const hasQuickMission = (quickMissionEffect?.missions?.length || 0) > 0;
  const hasFullMission = (fullMissionEffect?.missions.length || 0) > 0;

  const effects = useMemo(() => {
    const res = [...currentEffects];
    if (quickMissionEffect) {
      res.push(quickMissionEffect);
    }
    if (fullMissionEffect) {
      console.log(
        '🎸 [test] - effects - fullMissionEffect:',
        fullMissionEffect
      );
      res.push(fullMissionEffect);
    }

    return res;
  }, [currentEffects, quickMissionEffect, fullMissionEffect]);
  return (
    <div className='relative p-4 flex flex-col w-60'>
      {(!type ||
        ![
          EEffectType.MISSION_FULL,
          EEffectType.MISSION_QUICK,
          EEffectType.END_GAME,
        ].includes(type)) && (
        <div className='relative z-50 h-64'>
          <EffectContainer effects={effects} />
        </div>
      )}
      <DescInput
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      />
      <EffectSelector
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      />
      {!hasQuickMission ? (
        <div className='' onClick={handleAddQuickMission}>
          Add Quick Mission
        </div>
      ) : (
        <div onClick={() => setQuickMissionEffect(null)}>Delete</div>
      )}
      {hasQuickMission && (
        <div>
          <QuickMissionSelector
            missionEffect={quickMissionEffect}
            onChange={handleUpdateQuickMission}
          />
          {/* <EffectsGenerator selectedEffects={}/> */}
        </div>
      )}

      {!hasFullMission ? (
        <div className='' onClick={handleAddFullMission}>
          Add Full Mission
        </div>
      ) : (
        <div onClick={() => setFullMissionEffect(null)}>Delete</div>
      )}
      {hasFullMission && (
        <div>
          <FullMissionSelector
            missionEffect={fullMissionEffect}
            onChange={handleUpdateFullMission}
          />
          {/* <EffectsGenerator selectedEffects={}/> */}
        </div>
      )}
    </div>
  );
};
