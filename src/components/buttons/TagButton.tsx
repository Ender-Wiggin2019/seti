/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-05 00:49:36
 * @Description:
 */
// TagButton.tsx
import * as React from 'react';

import { cn } from '@/lib/utils';

import TagComponent from '@/components/icons/Tag';

import { getButtonIconShape } from '@/utils/icon';

import { TIcon } from '@/types/element';

type TagButtonProps = {
  isLoading?: boolean;
  tag: TIcon;
  selected: boolean;
  brightMode?: boolean; // 按钮是以高亮形式还是明暗形式显示
  onTagClick?: (tag: TIcon) => void;
} & React.ComponentPropsWithRef<'button'>;

const TagButton = React.forwardRef<HTMLButtonElement, TagButtonProps>(
  (
    { className, isLoading, tag, brightMode, selected, onTagClick, ...rest },
    ref
  ) => {
    const shape = getButtonIconShape(tag);
    const isOriginal = shape === 'normal' || brightMode;

    return (
      <button
        ref={ref}
        type='button'
        onClick={() => onTagClick && onTagClick(tag)}
        className={cn(
          !isOriginal &&
            'filter-button h-min w-min rounded-full duration-200 bg-gradient-to-b from-zinc-50/50 to-white/90 p-1 text-sm shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition',
          isOriginal &&
            'ring-0 border-none brightness-[0.3] duration-200 scale-125',
          selected && 'bg-gradient-radial from-yellow-200 to-yellow-100',
          isOriginal && selected && 'brightness-100',
          !selected && ''
        )}
        {...rest}
      >
        <TagComponent type={tag} shape={shape} />
      </button>
    );
  }
);

export default TagButton;
