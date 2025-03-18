import { motion, Variants } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { BiChevronDown } from 'react-icons/bi';

import { cn } from '@/lib/utils';

import TagButton from '@/components/buttons/TagButton';

import {
  EResource,
  EScanAction,
  ESpecialAction,
  ETech,
  ETrace,
  TIcon,
} from '@/types/element';

type AdvancedFilterProps = {
  onFilterChange: (tags: TIcon[]) => void;
  reset: boolean;
};

const itemVariants: Variants = {
  open: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  closed: { opacity: 0, x: -100, transition: { duration: 0.2 } },
};

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  onFilterChange,
  reset,
}) => {
  const { t } = useTranslation('common');
  const [selectedTags, setSelectedTags] = useState<TIcon[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // console.log(selectedTags);

  const toggleTag = (tag: TIcon) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // logic: and, or

  useEffect(() => {
    onFilterChange(selectedTags);
  }, [onFilterChange, selectedTags]);

  useEffect(() => {
    if (reset) {
      setSelectedTags([]);
    }
  }, [reset]);

  return (
    <motion.nav
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      className='menu'
      // style={{ overflow: 'hidden' }} // 这里添加 overflow: hidden
    >
      <motion.button
        className={cn(
          'group mt-1 flex w-40 items-center justify-between space-x-2 rounded-full bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20'
        )}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {t('Advanced')}
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
      <motion.ul
        className='flex flex-wrap gap-4 px-4 pt-4'
        variants={{
          open: {
            clipPath: 'inset(0% 0% 0% 0% round 10px)',
            maxHeight: 520, // expand size
            transition: {
              type: 'spring',
              bounce: 0,
              duration: 0.2,
              delayChildren: 0.1,
              staggerChildren: 0.05,
            },
          },
          closed: {
            clipPath: 'inset(0% 50% 100% 50% round 10px)',
            maxHeight: 15, // collapse size
            transition: {
              type: 'spring',
              bounce: 0,
              duration: 0.2,
            },
          },
        }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {[
          ESpecialAction.LAUNCH,
          ESpecialAction.LAND,
          ESpecialAction.SCAN,
          ETrace.ANY,
          ETech.ANY,
          ETech.SCAN,
          ETech.PROBE,
          ETech.COMPUTER,
          EResource.MOVE,
          EScanAction.ANY,
        ].map((icon) => (
          <motion.li variants={itemVariants} key={icon}>
            <TagButton
              key={icon}
              tag={icon}
              brightMode={true}
              onClick={() => toggleTag(icon)}
              selected={selectedTags.includes(icon)}
            />
          </motion.li>
        ))}
      </motion.ul>
    </motion.nav>
  );
};
