/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-03 05:04:25
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-10-29 01:59:12
 * @Description:
 */
import { createContext } from 'react';

import { alienCards } from '@/data/alienCards';
import { baseCards } from '@/data/baseCards';
import { spaceAgencyCards } from '@/data/spaceAgencyCards';

export const BaseCardDataContext = createContext([
  ...baseCards,
  ...spaceAgencyCards,
  ...alienCards,
]);
