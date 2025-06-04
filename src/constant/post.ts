import { EPostCategory, IPostItem } from '@/types/post';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:55:07
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-06-04 16:45:40
 * @Description:
 */
export const Posts: IPostItem[] = [
  {
    title: 'posts.model',
    path: 'model',
    category: EPostCategory.STRATEGY,
    author: 'Ender',
    description: '',
    tag: 'hot',
    giscusProps: {
      id: 'comments',
      categoryId: 'DIC_kwDON-z0tc4CpF4W',
      term: 'Welcome to share your idea about SETI',
      mapping: 'specific',
    },
    date: '2025-04-15',
  },
  {
    title: 'posts.tech',
    path: 'tech',
    category: EPostCategory.STRATEGY,
    author: 'Ender',
    description: '',
    tag: 'hot',
    date: '2025-05-16',
    // giscusProps: {
    //   id:'comments',
    //   categoryId: 'DIC_kwDON-z0tc4CpF4W',
    //   term:'Welcome to share your idea about SETI',
    // },
  },
  {
    title: 'posts.trace',
    path: 'trace',
    category: EPostCategory.STRATEGY,
    author: 'Ender',
    description: '',
    date: '2025-06-03',
    cnOnly: true,
  },
  {
    title: 'posts.diy',
    path: 'diy',
    category: EPostCategory.TUTORIAL,
    author: 'Ender',
    description: '',
    date: '2025-05-18',
  },
  {
    title: 'posts.about',
    path: 'about',
    category: EPostCategory.GENERAL,
    author: 'Ender',
    description: '',
    date: '2025-05-27',
  },
];
