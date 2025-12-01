import { isEqual } from 'lodash';
import { useState } from 'react';

import { DescInput } from '@/components/form/DescInput';
import { EffectSelector } from '@/components/form/EffectSelector';
import { EndgameSelector } from '@/components/form/EndgameSelector';
import { FullMissionSelector } from '@/components/form/FullMissionSelector';
import { QuickMissionSelector } from '@/components/form/QuickMissionSelector';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Button } from '@/components/ui/button';

import { m } from '@/constant/effect';
import { EEffectType, Effect, IMissionEffect } from '@/types/effect';
import { updateEffectArray, updateSpecialEffectArray } from '@/utils/effect';

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
  const [endgameEffectDesc, setEndgameEffectDesc] = useState<string | null>(
    null,
  );

  const handleEffectChange = (effect: Effect, action?: 'del') => {
    const newEffects = updateEffectArray(currentEffects, effect, action);

    // only callback when it's actually change
    if (!isEqual(newEffects, currentEffects)) {
      onChange?.(updateEffectArray(currentEffects, effect, action));
    }
  };

  const handleAddQuickMission = () => {
    const initEffect = m.QUICK_MISSION([], []);
    setQuickMissionEffect(initEffect);
    onChange?.(
      updateSpecialEffectArray(
        currentEffects,
        initEffect,
        EEffectType.MISSION_QUICK,
      ),
    );
  };

  const handleAddEndGame = () => {
    const initEffect = m.END_GAME('');
    setEndgameEffectDesc('');
    onChange?.(
      updateSpecialEffectArray(
        currentEffects,
        initEffect,
        EEffectType.END_GAME,
      ),
    );
  };

  const handleAddFullMission = () => {
    const initEffect = m.FULL_MISSION([{ req: [], reward: [] }], '');

    setFullMissionEffect(initEffect);
    onChange?.(
      updateSpecialEffectArray(
        currentEffects,
        initEffect,
        EEffectType.MISSION_FULL,
      ),
    );
  };

  const handleUpdateQuickMission = (effect: IMissionEffect | null) => {
    setQuickMissionEffect(effect);
    if (!effect) {
      return onChange?.(
        currentEffects.filter(
          (e) => e.effectType !== EEffectType.MISSION_QUICK,
        ),
      );
    }
    onChange?.(
      updateSpecialEffectArray(
        currentEffects,
        effect,
        EEffectType.MISSION_QUICK,
      ),
    );
  };

  const handleUpdateEndgame = (desc: string | null) => {
    setEndgameEffectDesc(desc);
    if (!desc) {
      return onChange?.(
        currentEffects.filter((e) => e.effectType !== EEffectType.END_GAME),
      );
    }
    onChange?.(
      updateSpecialEffectArray(
        currentEffects,
        m.END_GAME(desc),
        EEffectType.END_GAME,
      ),
    );
  };

  const handleUpdateFullMission = (effect: IMissionEffect | null) => {
    setFullMissionEffect(effect);
    if (!effect) {
      return onChange?.(
        currentEffects.filter((e) => e.effectType !== EEffectType.MISSION_FULL),
      );
    }
    onChange?.(
      updateSpecialEffectArray(
        currentEffects,
        effect,
        EEffectType.MISSION_FULL,
      ),
    );
  };
  const hasQuickMission = (quickMissionEffect?.missions?.length || 0) > 0;
  const hasFullMission = (fullMissionEffect?.missions.length || 0) > 0;
  const hasEndgame = endgameEffectDesc !== null;

  const showExtra =
    !type ||
    ![
      EEffectType.MISSION_FULL,
      EEffectType.MISSION_QUICK,
      EEffectType.END_GAME,
    ].includes(type);

  const quickMissionComp = () => {
    return (
      <AccordionV2 title='Conditional Mission' className='w-52'>
        {!hasQuickMission ? (
          <Button variant='highlight' onClick={handleAddQuickMission}>
            Add Conditional Mission
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
      </AccordionV2>
    );
  };

  const fullMissionComp = () => {
    return (
      <AccordionV2 title='Triggerable Missions' className='w-52'>
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

  const endGameComp = () => {
    return (
      <AccordionV2 title='Endgame' className='w-52'>
        {!hasEndgame ? (
          <Button variant='highlight' onClick={handleAddEndGame}>
            Add Endgame
          </Button>
        ) : (
          <Button
            variant='destructive'
            onClick={() => handleUpdateEndgame(null)}
          >
            Delete
          </Button>
        )}

        {hasEndgame && (
          <EndgameSelector
            desc={endgameEffectDesc}
            onChange={handleUpdateEndgame}
          />
        )}
      </AccordionV2>
    );
  };

  return (
    <div className='relative p-2 flex flex-col'>
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
      {showExtra && endGameComp()}
    </div>
  );
};
