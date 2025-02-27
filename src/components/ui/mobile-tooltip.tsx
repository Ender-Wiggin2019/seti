/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 14:19:38
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 11:16:04
 * @Description:
 */
'use client';

import {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '@radix-ui/react-popover';
import {
  TooltipContentProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
} from '@radix-ui/react-tooltip';
import { createContext, useContext, useEffect, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Tooltip as OriginalTooltip,
  TooltipContent as OriginalTooltipContent,
  TooltipProvider as OriginalTooltipProvider,
  TooltipTrigger as OriginalTooltipTrigger,
} from './tooltip';

const TouchContext = createContext<boolean | undefined>(undefined);
const useTouch = () => useContext(TouchContext);

export const TooltipProvider = ({
  children,
  ...props
}: TooltipProviderProps) => {
  const [isTouch, setTouch] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  return (
    <TouchContext.Provider value={isTouch}>
      <OriginalTooltipProvider {...props}>{children}</OriginalTooltipProvider>
    </TouchContext.Provider>
  );
};

export const Tooltip = (props: TooltipProps & PopoverProps) => {
  const isTouch = useTouch();
  console.log('🎸 [test] - Tooltip - isTouch:', isTouch);

  return isTouch ? <Popover {...props} /> : <OriginalTooltip {...props} />;
};

export const TooltipTrigger = (
  props: TooltipTriggerProps & PopoverTriggerProps
) => {
  const isTouch = useTouch();

  return isTouch ? (
    <PopoverTrigger {...props} />
  ) : (
    <OriginalTooltipTrigger {...props} />
  );
};

export const TooltipContent = (
  props: TooltipContentProps & PopoverContentProps
) => {
  const isTouch = useTouch();

  return isTouch ? (
    <PopoverContent {...props} />
  ) : (
    <OriginalTooltipContent {...props} />
  );
};
