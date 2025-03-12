/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-14 10:52:47
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-13 01:18:46
 * @Description:
 */
import * as React from 'react';

import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-950 ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:ring-primary',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
