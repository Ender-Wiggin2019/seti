/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-27 23:31:28
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 01:35:12
 * @Description:
 */
import * as React from 'react';

import { cn } from '@/lib/utils';

const TextButtonVariant = ['primary', 'basic'] as const;
type TextButtonProps = {
  selected: boolean;
  selectClassName?: string;
  variant?: (typeof TextButtonVariant)[number];
} & React.ComponentPropsWithRef<'button'>;

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  (
    {
      children,
      className,
      selected,
      selectClassName,
      variant = 'basic',
      disabled: buttonDisabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type='button'
        disabled={buttonDisabled}
        className={cn(
          'group mt-1 flex w-24 items-center justify-center space-x-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none focus-visible:ring-2 bg-gradient-to-b from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20',
          //#region  //*=========== Variant ===========
          variant === 'primary' && [
            'text-primary-500 hover:text-primary-600 active:text-primary-700',
            'disabled:text-primary-200',
          ],
          variant === 'basic' && [
            'text-white hover:text-gray-300 active:text-zinc-100',
            'disabled:text-gray-300',
          ],

          //#endregion  //*======== Variant ===========
          'disabled:cursor-not-allowed disabled:brightness-105 disabled:hover:underline',
          className,
          selected &&
            selectClassName === undefined &&
            'ring-2 ring-primary-700/90',
          selected && selectClassName !== undefined && selectClassName
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

export default TextButton;
