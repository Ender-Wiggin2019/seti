/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 09:48:41
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 16:49:05
 * @Description:
 */
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import React from 'react';

import TextButton from '@/components/buttons/TextButton';

import { SortOrder } from '@/types/Order';

interface SortButtonProps {
  sortOrder: SortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
}

export const SortButton: React.FC<SortButtonProps> = ({
  sortOrder,
  setSortOrder,
}) => {
  const { t } = useTranslation('common');

  const sortMap: Record<SortOrder, { text: string; icon: JSX.Element }> = {
    [SortOrder.ID_ASC]: {
      text: t('sort.ID_ASC'),
      icon: <ArrowUpNarrowWide />,
    },
    [SortOrder.ID_DESC]: {
      text: t('sort.ID_DESC'),
      icon: <ArrowDownWideNarrow />,
    },
  };

  const handleSortOrderChange = () => {
    setSortOrder((oldSortOrder) => {
      let newSortOrder = oldSortOrder + 1;
      if (newSortOrder > Object.keys(SortOrder).length / 2 - 1) {
        // enum will be compiled to an object with both keys and values
        newSortOrder = SortOrder.ID_ASC;
      }
      return newSortOrder;
    });
  };

  return (
    <TextButton
      selected={false}
      className='w-32'
      selectClassName='text-zinc-900 ring-zinc-900/90 ring-2'
      onClick={handleSortOrderChange}
    >
      {sortMap[sortOrder].icon}
      {sortMap[sortOrder].text}
    </TextButton>
  );
};
