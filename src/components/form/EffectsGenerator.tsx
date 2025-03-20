import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';

import { DescInput } from '@/components/form/DescInput';
import { EffectSelector } from '@/components/form/EffectSelector';
import { FullMissionSelector } from '@/components/form/FullMissionSelector';
import { QuickMissionSelector } from '@/components/form/QuickMissionSelector';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Button } from '@/components/ui/button';

import { m } from '@/constant/effect';
import { updateEffectArray } from '@/utils/effect';

import { EEffectType, Effect, IMissionEffect } from '@/types/effect';

type Props = {
  selectedEffects: Effect[];
  onChange?: (effects: Effect[]) => void;
  type?: EEffectType;
};
export const EffectsGenerator = ({
  selectedEffects: currentEffects,
  onChange,
  type,
}: Props) => {
  console.log('🎸 [test] - currentEffects222:', currentEffects);
  const [currEffects, setCurrEffects] = useState<Effect[]>(currentEffects);
  const [quickMissionEffect, setQuickMissionEffect] =
    useState<IMissionEffect | null>(null);
  const [fullMissionEffect, setFullMissionEffect] =
    useState<IMissionEffect | null>(null);
  if (type === EEffectType.MISSION_FULL)
    console.log('🎸 [test] - selectedEffects:', currentEffects);
  // console.log('🎸 [test] - currentEffects:', currentEffects);
  const handleEffectChange = (effect: Effect, action?: 'del') => {
    console.log('🎸 [test] - handleEffectChange - effect:', effect);
    setCurrEffects((prevEffects) =>
      updateEffectArray(prevEffects, effect, action)
    );
    // const newEffects = updateEffectArray(currentEffects, effect, action);
    // console.log('🎸 [test] - handleEffectChange - newEffects:', newEffects, currentEffects, isEqual(newEffects, currentEffects));

    // only callback when it's actually change
    // if (!isEqual(newEffects, currentEffects)) {
    //   onChange?.(updateEffectArray(currentEffects, effect, action));
    // }
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

  const showExtra =
    !type ||
    ![
      EEffectType.MISSION_FULL,
      EEffectType.MISSION_QUICK,
      EEffectType.END_GAME,
    ].includes(type);

  useEffect(() => {
    let res = [...currEffects];
    const quick = res.findIndex(
      (e) => e.effectType === EEffectType.MISSION_QUICK
    );
    console.log('🎸 [test] - useEffect - quick:', quick);
    const full = res.findIndex(
      (e) => e.effectType === EEffectType.MISSION_FULL
    );

    if (quick >= 0 && quickMissionEffect) {
      res = [...res.slice(0, quick), ...res.slice(quick + 1)];
      console.log('🎸 [test] - useEffect - res:', res);
    } else if (quickMissionEffect) {
      res.push(quickMissionEffect);
    }

    if (full >= 0 && fullMissionEffect) {
      res = [...res.slice(0, full), ...res.slice(full + 1)];
    } else if (fullMissionEffect) {
      res.push(fullMissionEffect);
    }

    if (!isEqual(currentEffects, res)) {
      onChange?.(res);
    }
  }, [
    currentEffects,
    quickMissionEffect,
    fullMissionEffect,
    onChange,
    currEffects,
  ]);

  const quickMissionComp = () => {
    return (
      <AccordionV2 title='Quick Mission'>
        {!hasQuickMission ? (
          <Button variant='highlight' onClick={handleAddQuickMission}>
            Add Quick Mission
          </Button>
        ) : (
          <Button
            variant='destructive'
            onClick={() => setQuickMissionEffect(null)}
          >
            Delete
          </Button>
        )}

        {hasQuickMission && (
          <QuickMissionSelector
            missionEffect={quickMissionEffect}
            onChange={handleUpdateQuickMission}
          />
        )}
        {/* <EffectsGenerator selectedEffects={}/> */}
      </AccordionV2>
    );
  };

  const fullMissionComp = () => {
    return (
      <AccordionV2 title='Mission'>
        {hasFullMission && (
          <FullMissionSelector
            missionEffect={fullMissionEffect}
            onChange={handleUpdateFullMission}
          />
        )}
        {!hasFullMission ? (
          <Button variant='highlight' onClick={handleAddFullMission}>
            Add Missions
          </Button>
        ) : (
          <Button
            variant='destructive'
            onClick={() => setFullMissionEffect(null)}
          >
            Delete
          </Button>
        )}
      </AccordionV2>
    );
  };
  return (
    <div className='relative p-2 flex flex-col'>
      {/* {showExtra && (
        <div className='relative z-50 h-24'>
          <EffectContainer effects={effects} />
        </div>
      )} */}
      <AccordionV2 title='Description'>
        <DescInput
          currentEffects={currentEffects}
          onChange={handleEffectChange}
        />
      </AccordionV2>
      <EffectSelector
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      />
      {showExtra && quickMissionComp()}
      {showExtra && fullMissionComp()}
    </div>
  );
};
