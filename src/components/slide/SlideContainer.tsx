import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  GradientOrbs,
  GridOverlay,
  HexPattern,
  ScanLines,
  StarField,
} from './BackgroundEffects';

interface SlideContainerProps {
  children: ReactNode;
  isFullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
}

export const SlideContainer = ({
  children,
  isFullscreen,
  onFullscreenChange,
}: SlideContainerProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
      onFullscreenChange(true);
    } else {
      document.exitFullscreen();
      onFullscreenChange(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      onFullscreenChange(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onFullscreenChange]);

  return {
    container: (
      <>
        <StarField />
        <div
          ref={wrapperRef}
          className={`min-h-screen flex items-center justify-center py-4 md:py-8 px-2 md:px-4 ${
            isFullscreen ? 'bg-[#050810]' : ''
          }`}
        >
          <div
            className={
              isFullscreen
                ? 'w-full h-full flex items-center justify-center'
                : 'w-full max-w-7xl'
            }
          >
            <div
              className='relative rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden'
              style={{
                width: isFullscreen ? 'calc(100vh * 16 / 9)' : undefined,
                height: isFullscreen ? '100vh' : undefined,
                maxWidth: isFullscreen ? '100vw' : undefined,
                minHeight: isFullscreen ? undefined : '80vh',
                background:
                  'linear-gradient(145deg, #0a0a0b 0%, #141416 30%, #0a0a0b 70%, #050507 100%)',
                border: '1px solid rgba(63, 63, 70, 0.3)',
                boxShadow: `
                  0 0 60px rgba(0, 0, 0, 0.4),
                  0 0 100px rgba(156, 163, 175, 0.03),
                  inset 0 1px 0 rgba(255, 255, 255, 0.015)
                `,
              }}
            >
              <GradientOrbs />
              <HexPattern />
              <ScanLines />
              <GridOverlay />
              <div className='relative z-10 h-full'>{children}</div>
            </div>
          </div>
        </div>
      </>
    ),
    wrapperRef,
    toggleFullscreen,
  };
};

interface ControlButtonsProps {
  isFullscreen: boolean;
  scale: number;
  onToggleFullscreen: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const ControlButtons = ({
  isFullscreen,
  scale,
  onToggleFullscreen,
  showBack,
  onBack,
}: ControlButtonsProps) => {
  return (
    <div className='absolute top-3 md:top-4 right-3 md:right-4 flex gap-2 md:gap-3 z-20'>
      {showBack && onBack && (
        <button
          onClick={onBack}
          className='px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-medium transition-all duration-300 hover:scale-105 group flex items-center gap-1.5 md:gap-2'
          style={{
            fontSize: `${0.65 * scale}rem`,
            background:
              'linear-gradient(135deg, rgba(39, 39, 42, 0.6), rgba(20, 20, 22, 0.8))',
            border: '1px solid rgba(156, 163, 175, 0.2)',
            color: '#9ca3af',
            boxShadow: '0 0 16px rgba(156, 163, 175, 0.06)',
            letterSpacing: '0.05em',
          }}
        >
          <svg
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='transition-transform group-hover:-translate-x-1'
          >
            <path d='M19 12H5M12 19l-7-7 7-7' />
          </svg>
          返回
        </button>
      )}
      <button
        onClick={onToggleFullscreen}
        className='px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-medium transition-all duration-300 hover:scale-105 group flex items-center gap-1.5 md:gap-2'
        style={{
          fontSize: `${0.65 * scale}rem`,
          background:
            'linear-gradient(135deg, rgba(39, 39, 42, 0.6), rgba(20, 20, 22, 0.8))',
          border: '1px solid rgba(63, 63, 70, 0.3)',
          color: '#a1a1aa',
          letterSpacing: '0.05em',
        }}
      >
        <svg
          width='12'
          height='12'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          className='transition-transform group-hover:scale-110'
        >
          {isFullscreen ? (
            <path d='M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3' />
          ) : (
            <path d='M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3' />
          )}
        </svg>
        <span className='hidden sm:inline'>
          {isFullscreen ? '退出' : '全屏'}
        </span>
      </button>
    </div>
  );
};

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PageIndicator = ({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  className = '',
}: PageIndicatorProps) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      {Array.from({ length: totalPages }).map((_, idx) => (
        <button
          key={idx}
          className='rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden'
          style={{
            height: `${0.3 * scale}rem`,
            width:
              currentPage === idx ? `${2.5 * scale}rem` : `${0.3 * scale}rem`,
            background:
              currentPage === idx
                ? 'linear-gradient(90deg, #9ca3af, #67e8f9)'
                : 'rgba(82, 82, 91, 0.35)',
            boxShadow:
              currentPage === idx ? '0 0 8px rgba(156, 163, 175, 0.3)' : 'none',
          }}
          onClick={() => onPageChange(idx)}
        >
          {currentPage === idx && (
            <div
              className='absolute inset-0 animate-pulse'
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

interface FooterInfoProps {
  scale: number;
  isFullscreen: boolean;
}

export const FooterInfo = ({ scale, isFullscreen }: FooterInfoProps) => {
  return (
    <>
      <div
        className='absolute bottom-4 md:bottom-6 left-4 md:left-6 flex items-center gap-2 text-xs uppercase tracking-[0.15em] z-20'
        style={{ color: '#52525b' }}
      >
        <div
          className='w-1.5 h-1.5 rounded-full animate-pulse'
          style={{ background: '#67e8f9' }}
        />
        <span className='hidden sm:inline'>SETI Analysis System</span>
      </div>

      {!isFullscreen && (
        <div
          className='hidden md:flex mt-4 text-center absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-3'
          style={{ color: '#52525b', fontSize: `${0.65 * scale}rem` }}
        >
          <span className='flex items-center gap-1.5'>
            <kbd
              className='px-1.5 py-0.5 rounded text-xs'
              style={{
                background: 'rgba(39, 39, 42, 0.4)',
                border: '1px solid rgba(63, 63, 70, 0.3)',
              }}
            >
              ←
            </kbd>
            <kbd
              className='px-1.5 py-0.5 rounded text-xs'
              style={{
                background: 'rgba(39, 39, 42, 0.4)',
                border: '1px solid rgba(63, 63, 70, 0.3)',
              }}
            >
              →
            </kbd>
            切换
          </span>
          <span style={{ color: '#3f3f46' }}>|</span>
          <span className='flex items-center gap-1.5'>
            <kbd
              className='px-1.5 py-0.5 rounded text-xs'
              style={{
                background: 'rgba(39, 39, 42, 0.4)',
                border: '1px solid rgba(63, 63, 70, 0.3)',
              }}
            >
              ESC
            </kbd>
            返回
          </span>
        </div>
      )}
    </>
  );
};
