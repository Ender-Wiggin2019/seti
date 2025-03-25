'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

import { clamp } from '@/lib/math';
import { cn } from '@/lib/utils';

import LocaleSelector from '@/components/layout/LocaleSelector';
import { Container } from '@/components/ui/Container';

import { NavigationBar } from './NavigationBar';

export function Header() {
  const isHomePage = usePathname() === '/';

  const headerRef = React.useRef<HTMLDivElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  const isInitial = React.useRef(true);

  React.useEffect(() => {
    const downDelay = avatarRef.current?.offsetTop ?? 0;
    const upDelay = 64;

    function setProperty(property: string, value: string | null) {
      document.documentElement.style.setProperty(property, value);
    }

    function removeProperty(property: string) {
      document.documentElement.style.removeProperty(property);
    }

    function updateHeaderStyles() {
      if (!headerRef.current) {
        return;
      }

      const { top, height } = headerRef.current.getBoundingClientRect();
      const scrollY = clamp(
        window.scrollY,
        0,
        document.body.scrollHeight - window.innerHeight
      );

      if (isInitial.current) {
        setProperty('--header-position', 'sticky');
      }

      setProperty('--content-offset', `${downDelay}px`);

      if (isInitial.current || scrollY < downDelay) {
        setProperty('--header-height', `${downDelay + height}px`);
        setProperty('--header-mb', `${-downDelay}px`);
      } else if (top + height < -upDelay) {
        const offset = Math.max(height, scrollY - upDelay);
        setProperty('--header-height', `${offset}px`);
        setProperty('--header-mb', `${height - offset}px`);
      } else if (top === 0) {
        setProperty('--header-height', `${scrollY + height}px`);
        setProperty('--header-mb', `${-scrollY}px`);
      }

      if (top === 0 && scrollY > 0 && scrollY >= downDelay) {
        setProperty('--header-inner-position', 'fixed');
        removeProperty('--header-top');
        removeProperty('--avatar-top');
      } else {
        removeProperty('--header-inner-position');
        setProperty('--header-top', '0px');
        setProperty('--avatar-top', '0px');
      }
    }

    function updateStyles() {
      updateHeaderStyles();
      isInitial.current = false;
    }

    updateStyles();
    window.addEventListener('scroll', updateStyles, { passive: true });
    window.addEventListener('resize', updateStyles);

    return () => {
      window.removeEventListener('scroll', updateStyles);
      window.removeEventListener('resize', updateStyles);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHomePage]);

  return (
    <>
      <motion.header
        className={cn(
          'mb-var(--header-mb mb-[0px])flex pointer-events-none relative z-50 flex-col',
          isHomePage
            ? 'h-[var(--header-heighth-180px)]'
            : 'h-[var(--header-heighth-64px)]'
        )}
        layout
        layoutRoot
      >
        <div
          ref={headerRef}
          className='top-0 z-10 h-16 pt-6'
          style={{
            position:
              'var(--header-position)' as React.CSSProperties['position'],
          }}
        >
          <Container
            className='top-[var(--header-top,theme(spacing.6))] w-full'
            style={{
              position:
                'var(--header-inner-position)' as React.CSSProperties['position'],
            }}
          >
            <div className='relative flex gap-4'>
              <motion.div
                className='flex flex-1'
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  damping: 30,
                  stiffness: 200,
                }}
              ></motion.div>
              <div className='flex flex-1 justify-end md:justify-center'>
                <NavigationBar.Mobile className='pointer-events-auto relative z-50 md:hidden' />
                <NavigationBar.Desktop className='pointer-events-auto relative z-50 hidden md:block' />
              </div>
              <div className='flex justify-end gap-3 md:flex-1'>
                {/* <UserInfo /> */}
                <div className='pointer-events-auto'>
                  <LocaleSelector />
                </div>
              </div>
            </div>
          </Container>
        </div>
      </motion.header>
      {isHomePage && <div className='h-[--content-offset]' />}
    </>
  );
}
