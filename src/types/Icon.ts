/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 11:38:29
 * @Description:
 */
import { IconName } from '@/types/IconName';

export type Icon = {
  iconName: IconName | string; // user customized icon can be string
  params?: { value: string; type?: string };
  notBadge?: boolean;
  slotCubeHolder?: boolean;
};

export type TShape = 'diamond' | 'round' | 'normal';
