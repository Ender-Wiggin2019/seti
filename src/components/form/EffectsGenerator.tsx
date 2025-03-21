import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';

import { DescInput } from '@/components/form/DescInput';
import { EffectSelector } from '@/components/form/EffectSelector';
import { FullMissionSelector } from '@/components/form/FullMissionSelector';
import { QuickMissionSelector } from '@/components/form/QuickMissionSelector';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Button } from '@/components/ui/button';

import { m } from '@/constant/effect';
import { updateEffectArray, updateMissionEffectArray } from '@/utils/effect';

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
  const [quickMissionEffect, setQuickMissionEffect] =
    useState<IMissionEffect | null>(null);
  const [fullMissionEffect, setFullMissionEffect] =
    useState<IMissionEffect | null>(null);

  const handleEffectChange = (effect: Effect, action?: 'del') => {
    const newEffects = updateEffectArray(currentEffects, effect, action);

    // only callback when it's actually change
    if (!isEqual(newEffects, currentEffects)) {
      onChange?.(updateEffectArray(currentEffects, effect, action));
    }
  };

  const handleAddQuickMission = () => {
    // init
    const initEffect = m.QUICK_MISSION([], []);
    setQuickMissionEffect(initEffect);
    onChange?.(
      updateMissionEffectArray(
        currentEffects,
        initEffect,
        EEffectType.MISSION_QUICK
      )
    );
  };

  const handleAddFullMission = () => {
    // init
    const initEffect = m.FULL_MISSION([{ req: [], reward: [] }], '');

    setFullMissionEffect(initEffect);
    onChange?.(
      updateMissionEffectArray(
        currentEffects,
        initEffect,
        EEffectType.MISSION_FULL
      )
    );
  };
  const handleUpdateQuickMission = (effect: IMissionEffect | null) => {
    setQuickMissionEffect(effect);
    if (!effect) {
      return onChange?.(
        currentEffects.filter((e) => e.effectType !== EEffectType.MISSION_QUICK)
      );
    }
    onChange?.(
      updateMissionEffectArray(
        currentEffects,
        effect,
        EEffectType.MISSION_QUICK
      )
    );
  };

  const handleUpdateFullMission = (effect: IMissionEffect | null) => {
    setFullMissionEffect(effect);
    if (!effect) {
      return onChange?.(
        currentEffects.filter((e) => e.effectType !== EEffectType.MISSION_FULL)
      );
    }
    onChange?.(
      updateMissionEffectArray(currentEffects, effect, EEffectType.MISSION_FULL)
    );
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
            onClick={() => handleUpdateQuickMission(null)}
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
            onClick={() => handleUpdateFullMission(null)}
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
