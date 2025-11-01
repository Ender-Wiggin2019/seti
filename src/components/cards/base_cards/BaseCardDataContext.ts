/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-03 05:04:25
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-01 15:28:57
 * @Description:
 */
import { createContext } from 'react';

import { ALL_CARDS } from '@/data';

export const BaseCardDataContext = createContext(ALL_CARDS);
