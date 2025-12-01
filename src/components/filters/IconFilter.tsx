/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-08 11:36:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-20 00:12:31
 * @Description:
 */
import React, { useState } from 'react';

import TagButton from '@/components/buttons/TagButton';

import { TIcon } from '@/types/element';

type Props<T> = {
  options: T[];
  onFilterChange: (options: T[]) => void;
  reset: boolean;
};

export const IconFilter = <T extends TIcon>({
  options,
  onFilterChange,
  reset,
}: Props<T>) => {
  const [selectedOptions, setSelectedOptions] = useState<T[]>([]);

  const toggleSelect = (option: T) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((t) => t !== option)
        : [...prev, option],
    );
  };

  React.useEffect(() => {
    if (reset) {
      setSelectedOptions([]);
    }
  }, [reset]);

  React.useEffect(() => {
    onFilterChange(selectedOptions);
  }, [onFilterChange, selectedOptions]);

  return (
    <div className='xl:grid-cols-auto grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8'>
      {options.map((option) => (
        <TagButton
          key={String(option)}
          tag={option}
          onClick={() => toggleSelect(option)}
          selected={selectedOptions.includes(option)}
        />
      ))}
    </div>
  );
};
