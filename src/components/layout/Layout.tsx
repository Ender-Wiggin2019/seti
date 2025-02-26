/*
 * @Author: Ender-Wiggin
 * @Date: 2023-09-13 06:17:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 15:16:59
 * @Description:
 */
// import { Analytics } from '@vercel/analytics/react';
import Image from 'next/image';
import React, { Suspense } from 'react';

import { Header } from '@/components/layout/Header';
import { QueryProvider } from '@/components/layout/QueryProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className='pointer-events-none fixed inset-0 select-none bg-black'>
        <div className='h-full w-full'>
          <Image
            src='/images/background.jpg'
            className='h-auto w-full object-contain object-top'
            alt='background'
            fill
            priority
            quality={100}
          />
        </div>
      </div>
      <span className='pointer-events-none fixed top-0 block h-[800px] w-full select-none bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(5,5,5,0.045)_0%,rgba(0,0,0,0)_100%)] dark:bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0)_100%)]' />

      <div className='fixed inset-0 flex justify-center sm:px-8'>
        <div className='flex w-full max-w-7xl lg:px-8'>
          <div className='w-full bg-primary/10 ring-1 ring-primary-500 dark:bg-zinc-900/80 dark:ring-zinc-400/20' />
        </div>
      </div>

      <Header />
      <QueryProvider>
        <div className='relative text-zinc-800 dark:text-zinc-800'>
          <main className='flex flex-col items-center'>
            <div className='relative w-full sm:px-8 sm:md:max-w-3xl md:max-w-4xl lg:max-w-4xl xl:max-w-6xl'>
              <div className='absolute z-10 flex justify-center -top-8 left-2 md:left-8'>
                <Image
                  src='/images/logo.png'
                  alt='logo'
                  width={60}
                  height={60}
                  priority
                  className='h-auto w-auto'
                />
              </div>
              {children}
            </div>
          </main>
          <Suspense>{/*<Footer />*/}</Suspense>
        </div>
      </QueryProvider>
      {/*<Analytics />*/}
    </>
  );
}
