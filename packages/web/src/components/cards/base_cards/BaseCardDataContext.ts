/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-03 05:04:25
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-01 15:28:57
 * @Description:
 */

import { ALL_CARDS } from '@seti/common/data';
import { createContext } from 'react';

export const BaseCardDataContext = createContext(ALL_CARDS);
