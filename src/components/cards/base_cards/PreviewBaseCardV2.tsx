/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-04 11:28:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-25 18:48:22
 * @Description:
 */
import { Popover, Transition } from '@headlessui/react';

import { BaseCard } from './BaseCard';

import { IBaseCard } from '@/types/BaseCard';
interface PreviewBaseCardProps {
  card: IBaseCard;
  showLink?: boolean;
}
import { useTranslation } from 'next-i18next';
import React from 'react';

export const PreviewBaseCardV2: React.FC<PreviewBaseCardProps> = ({
  card,
  showLink,
}) => {
  const { t } = useTranslation('seti');
  return (
    <Popover className='pointer-events-auto relative'>
      <Popover.Button className=''>
        <BaseCard card={card} />
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={React.Fragment}
          enter='duration-150 ease-out'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='duration-150 ease-in'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <Popover.Overlay className='fixed inset-0 bg-zinc-800/40 backdrop-blur dark:bg-black/80' />
        </Transition.Child>
        <Transition.Child
          as={React.Fragment}
          enter='duration-150 ease-out'
          enterFrom='opacity-0 scale-95'
          enterTo='opacity-100 scale-100'
          leave='duration-150 ease-in'
          leaveFrom='opacity-100 scale-100'
          leaveTo='opacity-0 scale-95'
        >
          <Popover.Panel
            focus
            className='fixed inset-x-4 top-8 z-50 origin-top h-2/3 rounded-3xl bg-gradient-to-b p-8 ring-1 from-zinc-900/50 to-zinc-900 ring-zinc-100/10'
          >
            <div className='flex flex-row-reverse items-center justify-between'>
              <Popover.Button aria-label='关闭菜单' className='-m-1 p-1'>
                <svg
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                  className='h-8 w-8 text-zinc-400'
                >
                  <path
                    d='m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </Popover.Button>
              <h2 className='text-lg font-medium text-zinc-200'>
                {t(card.name)}
              </h2>
            </div>
            <div className='mt-32 w-full flex justify-center items-center h-fit'>
              <div className='scale-[2] w-fit h-fit'>
                <BaseCard card={card} />
              </div>
            </div>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  );
};
