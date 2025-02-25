/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 02:16:57
 * @Description:
 */
// FreeActionFilter.tsx
import React, { useState } from 'react';

import TagButton from '@/components/buttons/TagButton';

import { BASE_FREE_ACTIONS, EResource } from '@/types/BaseCard';

type FreeActionFilterProps = {
  onFilterChange: (freeActions: EResource[]) => void;
  reset: boolean;
};
export const FreeActionFilter: React.FC<FreeActionFilterProps> = ({
  onFilterChange,
  reset,
}) => {
  const [selectedFreeActions, setSelectedFreeActions] = useState<EResource[]>(
    []
  );

  const toggleFreeAction = (freeAction: EResource) => {
    setSelectedFreeActions((prev) =>
      prev.includes(freeAction)
        ? prev.filter((t) => t !== freeAction)
        : [...prev, freeAction]
    );
  };

  React.useEffect(() => {
    if (reset) {
      setSelectedFreeActions([]);
    }
  }, [reset]);

  // logic: and, or

  React.useEffect(() => {
    onFilterChange(selectedFreeActions);
  }, [onFilterChange, selectedFreeActions]);

  return (
    <>
      <div className='xl:grid-cols-auto grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8'>
        {BASE_FREE_ACTIONS.map((resource) => (
          <TagButton
            key={resource}
            tagType='resource'
            tag={resource}
            onClick={() => toggleFreeAction(resource)}
            selected={selectedFreeActions.includes(resource)}
          />
        ))}
      </div>
    </>
  );
};
