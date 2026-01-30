/* eslint-disable @next/next/no-img-element */
/*
 * @Author: Ender-Wiggin
 * @Date: 2023-09-13 06:17:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-01-30 12:00:00
 * @Description:
 */
// import { Analytics } from '@vercel/analytics/react';
import Image from 'next/image';
import React, { Suspense } from 'react';

import { Header } from '@/components/layout/Header';
import { QueryProvider } from '@/components/layout/QueryProvider';
import { ThemeProvider } from '@/components/layout/ThemeContext';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/* Background layer - CSS-based starfield */}
      <div className='pointer-events-none fixed inset-0 select-none'>
        {/* Base dark background */}
        <div className='absolute inset-0 bg-space-950' />

        {/* Star layers */}
        <div className='stars-layer-1 absolute inset-0' />
        <div className='stars-layer-2 absolute inset-0' />
        <div className='stars-layer-3 absolute inset-0' />

        {/* Theme-aware nebula effect */}
        <div className='nebula-bg absolute inset-0' />
      </div>

      {/* Theme-aware radial gradient overlay */}
      <span className='theme-gradient pointer-events-none fixed top-0 block h-[800px] w-full select-none' />

      {/* Main content container */}
      <div className='fixed inset-0 flex justify-center sm:px-8'>
        <div className='flex w-full max-w-7xl lg:px-8'>
          <div className='w-full bg-space-900/40 ring-1 ring-space-700/20 backdrop-blur-sm' />
        </div>
      </div>

      <Header />
      <QueryProvider>
        <div className='relative text-space-100'>
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
          <Toaster />
          <Suspense>{/*<Footer />*/}</Suspense>
        </div>
      </QueryProvider>
      {/*<Analytics />*/}
    </ThemeProvider>
  );
}
