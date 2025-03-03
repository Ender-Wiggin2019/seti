/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 01:39:49
 * @Description:
 */
// TagButton.tsx
import * as React from 'react';

import { cn } from '@/lib/utils';

import TagComponent from '@/components/icons/Tag';

import { TIcon } from '@/types/element';

type TagButtonProps = {
  isLoading?: boolean;
  tag: TIcon;
  selected: boolean;
  onTagClick?: (tag: TIcon) => void;
} & React.ComponentPropsWithRef<'button'>;

const TagButton = React.forwardRef<HTMLButtonElement, TagButtonProps>(
  ({ className, isLoading, tag, selected, onTagClick, ...rest }, ref) => {
    const isHex = tag.includes('action');

    return (
      <button
        ref={ref}
        type='button'
        onClick={() => onTagClick && onTagClick(tag)}
        className={cn(
          !isHex &&
            'filter-button h-min w-min rounded-full duration-200 bg-gradient-to-b from-zinc-50/50 to-white/90 p-1 text-sm shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition',
          isHex && 'ring-0 border-none brightness-50 duration-200 scale-125',
          selected && 'bg-gradient-radial from-yellow-200 to-yellow-100',
          isHex && selected && 'brightness-100',
          !selected && ''
        )}
        {...rest}
      >
        <TagComponent type={tag} shape={isHex ? 'normal' : 'round'} />
      </button>
    );
  }
);

export default TagButton;
