/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-03 05:04:25
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 01:21:07
 * @Description:
 */
import { createContext } from 'react';

import { alienCards } from '@/data/alienCards';
import { baseCards } from '@/data/baseCards';

export const BaseCardDataContext = createContext([...baseCards, ...alienCards]);
