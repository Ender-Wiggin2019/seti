/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 02:17:25
 * @Description:
 */
// SectorFilter.tsx
import React, { useState } from 'react';

import TagButton from '@/components/buttons/TagButton';

import { ESector, ESectorMap } from '@/types/BaseCard';

type SectorFilterProps = {
  onFilterChange: (sectors: ESector[]) => void;
  reset: boolean;
};
export const SectorFilter: React.FC<SectorFilterProps> = ({
  onFilterChange,
  reset,
}) => {
  const [selectedSectors, setSelectedSectors] = useState<ESector[]>([]);

  const toggleSector = (sector: ESector) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((t) => t !== sector)
        : [...prev, sector]
    );
  };

  React.useEffect(() => {
    if (reset) {
      setSelectedSectors([]);
    }
  }, [reset]);

  // logic: and, or

  React.useEffect(() => {
    onFilterChange(selectedSectors);
  }, [onFilterChange, selectedSectors]);

  return (
    <>
      <div className='xl:grid-cols-auto grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8'>
        {Object.keys(ESectorMap).map((key) => {
          const sector = key as unknown as ESector;
          return (
            <TagButton
              key={sector}
              tagType='sector'
              tag={sector}
              onClick={() => toggleSector(sector)}
              selected={selectedSectors.includes(sector)}
            />
          );
        })}
      </div>
    </>
  );
};
