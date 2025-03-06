/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 15:51:13
 * @Description:
 */
// ResourceFilter.tsx
import React, { useState } from 'react';

import TagButton from '@/components/buttons/TagButton';

import { EResource } from '@/types/element';

type ResourceFilterProps = {
  onFilterChange: (Resources: EResource[]) => void;
  src: EResource[];
  reset: boolean;
};
export const ResourceFilter: React.FC<ResourceFilterProps> = ({
  onFilterChange,
  src,
  reset,
}) => {
  const [selectedResources, setSelectedResources] = useState<EResource[]>([]);

  const toggleResource = (Resource: EResource) => {
    setSelectedResources((prev) =>
      prev.includes(Resource)
        ? prev.filter((t) => t !== Resource)
        : [...prev, Resource]
    );
  };

  React.useEffect(() => {
    if (reset) {
      setSelectedResources([]);
    }
  }, [reset]);

  // logic: and, or

  React.useEffect(() => {
    onFilterChange(selectedResources);
  }, [onFilterChange, selectedResources]);

  return (
    <>
      <div className='xl:grid-cols-auto grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8'>
        {src.map((resource) => (
          <TagButton
            key={resource}
            tag={resource}
            onClick={() => toggleResource(resource)}
            selected={selectedResources.includes(resource)}
          />
        ))}
      </div>
    </>
  );
};
