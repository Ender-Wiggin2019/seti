/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-13 09:52:34
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-02 21:22:19
 * @Description:
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';
import { BiChevronDown } from 'react-icons/bi';

import { cn } from '@/lib/utils';

type AccordionV2Props = {
  title: string;
  className?: string;
  children: React.ReactNode;
};

export const AccordionV2: React.FC<AccordionV2Props> = ({
  title,
  className,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('common');
  return (
    <motion.nav
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      className='menu'
      // style={{ overflow: 'hidden' }} // 这里添加 overflow: hidden
    >
      <motion.button
        className={cn(
          'group mt-1 flex w-40 items-center justify-between space-x-2 rounded-full bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20',
          className,
        )}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {t(title)}
        <motion.div
          variants={{
            open: { rotate: 180 },
            closed: { rotate: 0 },
          }}
          transition={{ duration: 0.2 }}
          style={{ originY: 0.55 }}
        >
          <BiChevronDown className='h-4 w-4 opacity-50' />
        </motion.div>
      </motion.button>
      <div
        className={cn({
          'border-l-2 border-zinc-300/50 rounded-none mb-2 p-2': isOpen,
        })}
      >
        <motion.ul
          className='flex flex-wrap gap-4 px-1 pt-1'
          variants={{
            open: {
              clipPath: 'inset(0% 0% 0% 0% round 10px)',
              maxHeight: 1600, // expand size
              overflowY: 'auto',
              transition: {
                type: 'spring',
                bounce: 0,
                duration: 0.5,
                delayChildren: 0.1,
                // staggerChildren: 0.05,
              },
            },
            closed: {
              clipPath: 'inset(0% 50% 100% 50% round 10px)',
              maxHeight: 15, // collapse size
              transition: {
                type: 'spring',
                bounce: 0,
                duration: 0.5,
              },
            },
          }}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        >
          {children}
        </motion.ul>
      </div>
    </motion.nav>
  );
};
