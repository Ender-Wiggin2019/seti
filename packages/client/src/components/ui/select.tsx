import * as SelectPrimitive from '@radix-ui/react-select';
import * as React from 'react';
import { cn } from '@/lib/cn';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

/**
 * Select — matches the Input treatment: hairline metal frame on a dark fill,
 * with an inset top highlight. Chevron uses the dim text color.
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'group flex h-10 w-full items-center justify-between gap-2 px-3 py-2',
      'rounded-[5px]',
      'bg-[oklch(0.12_0.02_260)]',
      'border border-[color:var(--metal-edge)]',
      'shadow-hairline-inset',
      'text-sm text-text-100',
      'transition-[box-shadow,border-color] duration-150',
      'hover:border-[oklch(0.40_0.04_240)]',
      'focus:outline-none',
      'focus:border-accent-500',
      'focus:shadow-[inset_0_1px_0_oklch(0.78_0.04_240/0.25),0_0_0_3px_oklch(0.68_0.11_240/0.25)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[placeholder]:text-text-500',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <span
        aria-hidden
        className='text-text-500 transition-transform duration-150 group-data-[state=open]:rotate-180'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='h-4 w-4'
        >
          <path d='m6 9 6 6 6-6' />
        </svg>
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        'rounded-[6px]',
        'bg-surface-900/95 backdrop-blur-md',
        'border border-[color:var(--metal-edge)]',
        'shadow-instrument',
        'text-text-100',
        'animate-panel-rise',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-1.5 pl-8 pr-2',
      'font-mono text-[0.6875rem] uppercase tracking-microlabel text-text-500',
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center',
      'rounded-[4px] py-1.5 pl-8 pr-2 text-sm outline-none',
      'text-text-300',
      'transition-colors duration-100',
      'focus:bg-[oklch(0.22_0.03_260)] focus:text-text-100',
      'data-[state=checked]:text-text-100',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-accent-500'>
      <SelectPrimitive.ItemIndicator>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='h-3.5 w-3.5'
        >
          <path d='M20 6 9 17l-5-5' />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      '-mx-1 my-1 h-px bg-[color:var(--metal-edge-soft)]',
      className,
    )}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
