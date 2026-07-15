/* eslint-disable @next/next/no-img-element */
/*
 * @Author: Ender-Wiggin
 * @Date: 2023-09-13 06:17:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2026-04-30 10:26:40
 * @Description:
 */
// import { Analytics } from '@vercel/analytics/react';
import React, { Suspense } from 'react';

import { Header } from '@/components/layout/Header';
import { QueryProvider } from '@/components/layout/QueryProvider';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
       * 3-tier lobby scene backdrop.
       *   - solid mid color (--scene-bg) sits beneath everything (set on <body>).
       *   - hero image fades from top, masked downward into the mid color.
       *   - footer image fades from bottom, masked upward into the mid color.
       */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden bg-[var(--scene-bg)]'
      >
        <div
          className='absolute inset-x-0 top-0 h-[58vh] bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: 'var(--scene-hero-image)',
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div
          className='absolute inset-x-0 bottom-0 h-[42vh] bg-cover bg-bottom bg-no-repeat'
          style={{
            backgroundImage: 'var(--scene-footer-image)',
            WebkitMaskImage:
              'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>
      <span className='pointer-events-none fixed top-0 block h-[800px] w-full select-none bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(5,5,5,0.045)_0%,rgba(0,0,0,0)_100%)] dark:bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0)_100%)]' />

      <div className='fixed inset-0 flex justify-center sm:px-8'>
        <div className='flex w-full max-w-7xl lg:px-8'>
          <div className='w-full bg-primary/10 ring-1 ring-primary-500 dark:bg-zinc-900/60 dark:ring-white/25' />
        </div>
      </div>

      <Header />
      <QueryProvider>
        <div className='relative text-zinc-200'>
          <main className='flex flex-col items-center'>
            <div className='relative w-full sm:px-8 sm:md:max-w-3xl md:max-w-4xl lg:max-w-4xl xl:max-w-6xl'>
              <div className='absolute z-10 flex justify-center -top-8 left-2 md:left-8'>
                <img
                  src='/images/logo.png'
                  alt='logo'
                  width={60}
                  height={60}
                  className='h-auto w-[60px]'
                />
              </div>
              {children}
            </div>
          </main>
          <Toaster />
          <Suspense>{/*<Footer />*/}</Suspense>
        </div>
      </QueryProvider>
      {/*<Analytics />*/}
    </>
  );
}
