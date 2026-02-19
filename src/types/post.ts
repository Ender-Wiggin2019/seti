import { GiscusProps } from '@giscus/react';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:49:07
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-18 21:11:09
 * @Description:
 */
export interface IPostItem {
  title: string;
  path: string;
  category: EPostCategory;
  author?: string;
  description?: string;
  giscusProps?: Partial<GiscusProps>;
  cnOnly?: boolean;
  tag?: IPostTag;
  date?: string;
  externalPath?: string;
}

export type IPostTag = 'hot' | 'new' | 'update';

export enum EPostCategory {
  STRATEGY = 'Strategy',
  TUTORIAL = 'Tutorial',
  GENERAL = 'General',
}
