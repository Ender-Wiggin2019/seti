/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:48:16
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-03 12:58:23
 * @Description:
 */

import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { IPostItem } from '@/types/post';

export const PostItem = ({
  title,
  path,
  category,
  author,
  description,
}: IPostItem) => {
  const { t } = useTranslation('common');

  return (
    <Link className='flex justify-start items-center' href={'posts/' + path}>
      <div className='text-xs text-gray-400'>{t(category)}</div>

      <div className='text-xl'>{t(title)}</div>
    </Link>
  );
};
