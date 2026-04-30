/*
 * @Author: Ender Wiggin
 * @Date: 2025-12-15 01:23:47
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-12-15 02:18:46
 * @Description:
 */

import { ALIEN_BUTTON_GROUP } from '@seti/common/constant/alien';
import { EAlienType } from '@seti/common/types/BaseCard';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type AlienFilterProps = {
  alienTypes: EAlienType[];
  onFilterChange: (tags: EAlienType[]) => void;
  reset: boolean;
};

const ALIEN_IMAGE_CLASS_BY_LABEL_KEY: Record<string, string> = {
  centaurians: 'alien-filter__image--centaurians',
  glyphids: 'alien-filter__image--glyphids',
  anomalies: 'alien-filter__image--anomalies',
  oumuamua: 'alien-filter__image--oumuamua',
  mascamites: 'alien-filter__image--mascamites',
  exertians: 'alien-filter__image--exertians',
  ark: 'alien-filter__image--ark',
  amoeba: 'alien-filter__image--amoeba',
};

export const AlienFilter: React.FC<AlienFilterProps> = ({
  alienTypes,
  onFilterChange,
  reset,
}) => {
  const { t } = useTranslation('seti');
  const [selectedCategories, setSelectedCategories] = useState<EAlienType[]>(
    [],
  );

  const handleCategoryChange = (cardType: EAlienType) => {
    setSelectedCategories((prev: EAlienType[]) =>
      prev.includes(cardType)
        ? prev.filter((t) => t !== cardType)
        : [...prev, cardType],
    );
  };

  useEffect(() => {
    onFilterChange(selectedCategories);
  }, [selectedCategories, onFilterChange]);

  useEffect(() => {
    if (reset) {
      setSelectedCategories([]);
    }
  }, [reset]);

  return (
    <div className='alien-filter__group' aria-label='alien filter'>
      {ALIEN_BUTTON_GROUP.map((alien) => {
        const label = t(alien.labelKey);
        const selected =
          alien.type !== undefined && selectedCategories.includes(alien.type);

        if (alien.type !== undefined && !alienTypes.includes(alien.type)) {
          return null;
        }

        return (
          <div key={alien.labelKey} className='alien-filter__item'>
            <button
              type='button'
              aria-label={label}
              aria-pressed={alien.type === undefined ? undefined : selected}
              title={label}
              disabled={alien.placeholder || alien.type === undefined}
              className={cn(
                'alien-filter__button',
                ALIEN_IMAGE_CLASS_BY_LABEL_KEY[alien.labelKey] ??
                  alien.imageClassName,
                selected && 'alien-filter__button--selected',
                alien.placeholder && 'alien-filter__button--placeholder',
              )}
              onClick={() => {
                if (alien.type !== undefined) {
                  handleCategoryChange(alien.type);
                }
              }}
            >
              <span className='sr-only'>{label}</span>
            </button>
            {alien.placeholder && (
              <div className='alien-filter__badge'>SOON</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
