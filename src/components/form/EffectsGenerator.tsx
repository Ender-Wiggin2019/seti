import React, { useMemo, useState } from 'react';

import { EffectContainer } from '@/components/effect/EffectContainer';
import { DescInput } from '@/components/form/DescInput';
import { EffectSelector } from '@/components/form/EffectSelector';
import { FullMissionSelector } from '@/components/form/FullMissionSelector';
import { QuickMissionSelector } from '@/components/form/QuickMissionSelector';
import { AccordionV2 } from '@/components/ui/accordion-v2';

import { m } from '@/constant/effect';
import { updateEffectArray } from '@/utils/effect';

import { EEffectType, Effect, IMissionEffect } from '@/types/effect';
import { Button } from '@/components/ui/button';

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

  const showExtra =
    !type ||
    ![
      EEffectType.MISSION_FULL,
      EEffectType.MISSION_QUICK,
      EEffectType.END_GAME,
    ].includes(type);

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
    onChange?.(res);
    return res;
  }, [currentEffects, quickMissionEffect, fullMissionEffect]);

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
        {hasFullMission && (
          <FullMissionSelector
            missionEffect={fullMissionEffect}
            onChange={handleUpdateFullMission}
          />
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
