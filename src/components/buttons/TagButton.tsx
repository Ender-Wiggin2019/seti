/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 02:16:52
 * @Description:
 */
// TagButton.tsx
import * as React from 'react';

import { cn } from '@/lib/utils';

import TagComponent from '@/components/icons/Tag';

import { EResource, ESector } from '@/types/BaseCard';

type TagButtonProps = {
  isLoading?: boolean;
  tag: EResource | ESector;
  tagType: 'resource' | 'sector';
  selected: boolean;
  onTagClick?: (tag: EResource | ESector) => void;
} & React.ComponentPropsWithRef<'button'>;

const TagButton = React.forwardRef<HTMLButtonElement, TagButtonProps>(
  (
    { className, isLoading, tag, tagType, selected, onTagClick, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type='button'
        onClick={() => onTagClick && onTagClick(tag)}
        className={cn(
          'filter-button h-min w-min rounded-full bg-gradient-to-b from-zinc-50/50 to-white/90 p-2 text-sm shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition',
          selected &&
            'bg-gradient-radial scale-90 from-primary-700/90 to-primary-600/70',
          !selected && 'scale-90 hover:scale-110'
        )}
        {...rest}
      >
        <TagComponent tagType={tagType} type={tag} />
      </button>
    );
  }
);

export default TagButton;
