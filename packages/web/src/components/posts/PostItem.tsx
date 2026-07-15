/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-14 16:48:53
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-17 17:13:38
 * @Description:
 */

import { Flame } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Badge } from '@/components/ui/badge';
import { IPostItem, IPostTag } from '@/types/post';

export const PostItem = ({
  title,
  path,
  category,
  author,
  description,
  tag,
  date,
  externalPath,
}: IPostItem) => {
  const { t } = useTranslation('common');

  const renderTag = (tag: IPostTag) => {
    if (tag === 'hot') {
      return (
        <Badge className='bg-red-400 text-white'>
          <Flame size={12} />
          {t('posts.hot')}
        </Badge>
      );
    }
  };

  const href = externalPath || 'posts/' + path;

  return (
    <Link
      href={href}
      className='relative w-full block max-w-md mx-auto bg-gradient-to-b rounded-lg px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20'
    >
      {tag && <div className='absolute top-2 right-2'>{renderTag(tag)}</div>}
      <div className='mb-2 text-sm font-semibold text-gray-300'>
        {t(category)}
      </div>
      <div className='flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between'>
        <div className='text-2xl font-bold text-white truncate w-full lg:w-auto'>
          {t(title)}
        </div>
        <div className='flex w-full justify-between text-sm lg:w-auto lg:justify-end lg:space-x-4'>
          {author && (
            <div className='text-sm text-gray-100'>By {t(author)}</div>
          )}
          {date && <div className='text-sm text-gray-400'>{t(date)}</div>}
        </div>
      </div>
      {description && (
        <div className='text-base text-gray-400'>{t(description)}</div>
      )}
    </Link>
  );
};
