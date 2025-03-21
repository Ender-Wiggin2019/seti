/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 14:20:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-20 00:56:00
 * @Description:
 */
import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-950 ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:ring-zinc-300',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
