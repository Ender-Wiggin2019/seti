import { EPostCategory, IPostItem } from '@/types/post';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:55:07
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-12 20:46:06
 * @Description:
 */
export const Posts: IPostItem[] = [
  {
    title: 'posts.model',
    path: 'model',
    category: EPostCategory.STRATEGY,
    author: 'Ender',
    description: '',
    giscusProps: {
      id: 'comments',
      categoryId: 'DIC_kwDON-z0tc4CpF4W',
      term: 'Welcome to share your idea about SETI',
      mapping: 'specific',
    },
  },
  {
    title: 'posts.tech',
    path: 'tech',
    category: EPostCategory.STRATEGY,
    author: 'Ender',
    description: '',
    // giscusProps: {
    //   id:'comments',
    //   categoryId: 'DIC_kwDON-z0tc4CpF4W',
    //   term:'Welcome to share your idea about SETI',
    // },
  },
  // {
  //   title: 'posts.diy_tutorial',
  //   path: 'diy_tutorial',
  //   category: EPostCategory.TUTORIAL,
  //   author: 'Ender',
  //   description: '',
  // },
];
