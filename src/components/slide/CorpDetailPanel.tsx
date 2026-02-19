import { useTranslation } from 'next-i18next';
import { useCallback, useRef, useState } from 'react';
import { CardRender } from '@/components/form/CardRender';
import { IBaseCard } from '@/types/BaseCard';
import { CardHoverPreview } from './CardHoverPreview';
import type { CorpData } from './CorpCard';
import { RadarChartPanel } from './RadarChartPanel';
import { StatCard } from './StatCard';

const CORPS_WITH_TOP_CROP = [
  'deep-space-detection',
  'deep-space-strategy',
  'fenwick',
  'sentry-network',
  'stratus-core',
];

type StatsConfig = {
  initStrength: { avg: number; min: number; max: number };
  model: { avg: number; min: number; max: number };
  ceiling: { avg: number; min: number; max: number };
};

interface CorpDetailPanelProps {
  corp: CorpData;
  statsConfig: StatsConfig;
  currentPage: number;
  activeDimension: string | null;
  onDimensionClick: (dimension: string | null) => void;
  onPageChange: (page: number) => void;
  onPreviewCard: (card: IBaseCard | null) => void;
  scale: number;
  isMobile?: boolean;
}

export const CorpDetailPanel = ({
  corp,
  statsConfig,
  currentPage,
  activeDimension,
  onDimensionClick,
  onPageChange,
  onPreviewCard,
  scale,
  isMobile = false,
}: CorpDetailPanelProps) => {
  const { t } = useTranslation(['seti', 'flavorText']);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageBorderRadius = isMobile ? '14px' : '22px';
  const imageCropTop = isMobile ? '-4px' : '-8px';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentPage < 1) {
        onPageChange(currentPage + 1);
        onDimensionClick(null);
      } else if (diff < 0 && currentPage > 0) {
        onPageChange(currentPage - 1);
        onDimensionClick(null);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [currentPage, onDimensionClick, onPageChange]);

  return (
    <div
      className='h-full flex flex-col lg:flex-row'
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className='p-4 md:p-6 flex flex-col items-center justify-center relative'
        style={{
          width: '100%',
          borderRight: 'none',
        }}
      >
        <div className='lg:hidden w-full h-px mb-4 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent' />

        <div className='absolute inset-0 opacity-25 pointer-events-none hidden lg:block'>
          <div
            className='absolute top-0 left-0 right-0 h-px'
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.2), transparent)',
            }}
          />
          <div
            className='absolute bottom-0 left-0 right-0 h-px'
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.12), transparent)',
            }}
          />
        </div>

        <div className='relative mb-4 lg:mb-6'>
          <div
            className='absolute -inset-4 md:-inset-8 opacity-30'
            style={{
              background:
                'radial-gradient(circle, rgba(156, 163, 175, 0.18), transparent 60%)',
              filter: 'blur(20px)',
              borderRadius: '24px',
            }}
          />
          <div
            className='absolute -inset-2 md:-inset-4 opacity-12'
            style={{
              border: '1px solid rgba(156, 163, 175, 0.2)',
              borderRadius: '16px',
            }}
          />
          <div
            className='relative overflow-hidden'
            style={{
              borderRadius: imageBorderRadius,
              background:
                'linear-gradient(135deg, rgba(39, 39, 42, 0.4), rgba(20, 20, 22, 0.6))',
              border: '1px solid rgba(156, 163, 175, 0.12)',
              boxShadow: '0 0 40px rgba(156, 163, 175, 0.1)',
            }}
          >
            <div
              className='absolute inset-0 opacity-20'
              style={{
                background:
                  'linear-gradient(135deg, rgba(156, 163, 175, 0.06), transparent)',
              }}
            />
            <img
              src={corp.image}
              alt={corp.name}
              className='relative w-auto mx-auto'
              style={{
                objectFit: 'contain',
                maxHeight: `${50 * scale}vh`,
                filter: 'drop-shadow(0 0 20px rgba(156, 163, 175, 0.3))',
                marginTop: CORPS_WITH_TOP_CROP.includes(corp.id)
                  ? imageCropTop
                  : 0,
              }}
            />
          </div>
        </div>

        <div className='text-center'>
          <h2
            className='font-bold mb-2'
            style={{
              fontSize: `${1.25 * scale}rem`,
              background: 'linear-gradient(135deg, #9ca3af 0%, #67e8f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {corp.name}
          </h2>
          <div
            className='flex items-center justify-center gap-2 text-xs uppercase tracking-[0.15em]'
            style={{ color: '#71717a' }}
          >
            <div
              className='w-6 md:w-8 h-px'
              style={{
                background: 'linear-gradient(90deg, transparent, #71717a)',
              }}
            />
            <span>Corporation Profile</span>
            <div
              className='w-6 md:w-8 h-px'
              style={{
                background: 'linear-gradient(90deg, #71717a, transparent)',
              }}
            />
          </div>
        </div>
      </div>

      <div className='p-4 md:p-6 lg:p-8 flex flex-col relative flex-1'>
        <div className='hidden lg:block absolute top-6 right-6 left-6 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent' />

        {currentPage === 0 ? (
          <div className='flex-1 flex flex-col justify-center'>
            <RadarChartPanel
              corp={corp}
              statsConfig={statsConfig}
              activeDimension={activeDimension}
              onDimensionClick={onDimensionClick}
              scale={scale}
            />

            <div className='mt-4 md:mt-5 grid grid-cols-3 gap-2 md:gap-4'>
              {['firstRound', 'overall', 'potential'].map((dim) => {
                const labels: Record<
                  string,
                  { label: string; value: number; avg: number }
                > = {
                  firstRound: {
                    label: '首轮强度',
                    value: corp.initStrength,
                    avg: statsConfig.initStrength.avg,
                  },
                  overall: {
                    label: '公司模型',
                    value: corp.model,
                    avg: statsConfig.model.avg,
                  },
                  potential: {
                    label: '上限能力',
                    value: corp.ceiling,
                    avg: statsConfig.ceiling.avg,
                  },
                };
                const info = labels[dim];
                const colors: Record<string, string> = {
                  firstRound: '#9ca3af',
                  overall: '#67e8f9',
                  potential: '#a78bfa',
                };
                return (
                  <StatCard
                    key={dim}
                    label={info.label}
                    value={info.value}
                    avg={info.avg}
                    isActive={activeDimension === dim}
                    color={colors[dim]}
                    scale={scale}
                    onClick={() =>
                      onDimensionClick(activeDimension === dim ? null : dim)
                    }
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className='flex-1 flex flex-col justify-center'>
            <div
              className='rounded-2xl p-4 md:p-5 mb-4 overflow-auto relative'
              style={{
                maxHeight: `${12 * scale}rem`,
                background: `linear-gradient(135deg,
                  rgba(39, 39, 42, 0.6),
                  rgba(156, 163, 175, 0.03) 50%,
                  rgba(20, 20, 22, 0.7))`,
                border: '1px solid rgba(63, 63, 70, 0.2)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.02),
                  0 4px 24px rgba(0,0,0,0.2)
                `,
              }}
            >
              <div
                className='absolute inset-0 opacity-30 pointer-events-none rounded-2xl'
                style={{
                  background: `
                    radial-gradient(ellipse at 0% 0%, rgba(156, 163, 175, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse at 100% 100%, rgba(103, 232, 249, 0.05) 0%, transparent 50%)
                  `,
                }}
              />
              <div
                className='absolute top-0 left-6 right-6 h-px'
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.25), transparent)',
                }}
              />
              <div className='flex items-center gap-2 mb-3'>
                <div
                  className='w-1.5 h-1.5 rounded-full'
                  style={{
                    background: '#9ca3af',
                    boxShadow: '0 0 6px rgba(156, 163, 175, 0.4)',
                  }}
                />
                <h3
                  className='font-semibold uppercase tracking-[0.1em]'
                  style={{
                    color: '#9ca3af',
                    fontSize: `${0.8 * scale}rem`,
                  }}
                >
                  综合点评
                </h3>
              </div>
              <p
                className='leading-relaxed relative z-10'
                style={{ color: '#d4d4d8', fontSize: `${0.9 * scale}rem` }}
              >
                {corp.evaluation.overall}
              </p>
            </div>

            {corp.recommendCards.length > 0 && (
              <div
                className='rounded-2xl p-4 md:p-5 relative'
                style={{
                  background: `linear-gradient(135deg,
                    rgba(39, 39, 42, 0.5),
                    rgba(103, 232, 249, 0.02) 50%,
                    rgba(20, 20, 22, 0.6))`,
                  border: '1px solid rgba(103, 232, 249, 0.12)',
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.02),
                    0 4px 20px rgba(0,0,0,0.15)
                  `,
                }}
              >
                <div
                  className='absolute inset-0 opacity-25 pointer-events-none rounded-2xl'
                  style={{
                    background: `
                      radial-gradient(ellipse at 100% 0%, rgba(103, 232, 249, 0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 0% 100%, rgba(167, 139, 250, 0.04) 0%, transparent 50%)
                    `,
                  }}
                />
                <div
                  className='absolute top-0 left-6 right-6 h-px'
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.25), transparent)',
                  }}
                />
                <div className='flex items-center gap-2 mb-3'>
                  <div
                    className='w-1.5 h-1.5 rounded-full'
                    style={{
                      background: '#67e8f9',
                      boxShadow: '0 0 6px rgba(103, 232, 249, 0.4)',
                    }}
                  />
                  <h3
                    className='font-semibold uppercase tracking-[0.1em]'
                    style={{
                      color: '#67e8f9',
                      fontSize: `${0.8 * scale}rem`,
                    }}
                  >
                    推荐卡牌
                  </h3>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {corp.recommendCards.map((card, idx) => (
                    <CardHoverPreview
                      key={`${corp.id}-${card.name}-${idx}`}
                      card={{ id: card.id || '', name: card.name }}
                      scale={scale}
                      onCardClick={onPreviewCard}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className='flex justify-center items-center gap-4 mt-4 lg:hidden'>
          <button
            onClick={() => {
              if (currentPage > 0) {
                onPageChange(currentPage - 1);
                onDimensionClick(null);
              }
            }}
            className='w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300'
            style={{
              background:
                currentPage === 0
                  ? 'rgba(63, 63, 70, 0.3)'
                  : 'linear-gradient(135deg, rgba(156, 163, 175, 0.2), rgba(103, 232, 249, 0.1))',
              border:
                currentPage === 0
                  ? '1px solid rgba(63, 63, 70, 0.3)'
                  : '1px solid rgba(156, 163, 175, 0.3)',
              color: currentPage === 0 ? '#52525b' : '#9ca3af',
              opacity: currentPage === 0 ? 0.5 : 1,
            }}
            disabled={currentPage === 0}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M15 18l-6-6 6-6' />
            </svg>
          </button>

          <div className='flex gap-2'>
            {[0, 1].map((idx) => (
              <button
                key={idx}
                className='rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden'
                style={{
                  height: `${0.3 * scale}rem`,
                  width:
                    currentPage === idx
                      ? `${2.5 * scale}rem`
                      : `${0.3 * scale}rem`,
                  background:
                    currentPage === idx
                      ? 'linear-gradient(90deg, #9ca3af, #67e8f9)'
                      : 'rgba(82, 82, 91, 0.35)',
                  boxShadow:
                    currentPage === idx
                      ? '0 0 8px rgba(156, 163, 175, 0.3)'
                      : 'none',
                }}
                onClick={() => {
                  onPageChange(idx);
                  onDimensionClick(null);
                }}
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

          <button
            onClick={() => {
              if (currentPage < 1) {
                onPageChange(currentPage + 1);
                onDimensionClick(null);
              }
            }}
            className='w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300'
            style={{
              background:
                currentPage === 1
                  ? 'rgba(63, 63, 70, 0.3)'
                  : 'linear-gradient(135deg, rgba(156, 163, 175, 0.2), rgba(103, 232, 249, 0.1))',
              border:
                currentPage === 1
                  ? '1px solid rgba(63, 63, 70, 0.3)'
                  : '1px solid rgba(156, 163, 175, 0.3)',
              color: currentPage === 1 ? '#52525b' : '#9ca3af',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
            disabled={currentPage === 1}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M9 18l6-6-6-6' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CardPreviewModalProps {
  previewCard: IBaseCard | null;
  scale: number;
  onClose: () => void;
}

export const CardPreviewModal = ({
  previewCard,
  scale,
  onClose,
}: CardPreviewModalProps) => {
  const { t } = useTranslation(['seti', 'flavorText']);

  if (!previewCard) return null;

  return (
    <div
      className='absolute inset-0 z-50 flex items-center justify-center'
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className='relative rounded-2xl mx-4'
        style={{
          background: 'linear-gradient(145deg, #27272a, #141416)',
          border: '1px solid rgba(156, 163, 175, 0.2)',
          boxShadow:
            '0 0 40px rgba(156, 163, 175, 0.1), 0 0 80px rgba(103, 232, 249, 0.05)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className='absolute inset-0 pointer-events-none rounded-2xl'
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 30% 20%, rgba(156, 163, 175, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(103, 232, 249, 0.04) 0%, transparent 40%)
            `,
          }}
        />
        <div
          className='relative p-6 md:p-8 md:px-16'
          style={{ minHeight: `${300 * scale}px`, width: 'min(500px, 90vw)' }}
        >
          <button
            onClick={onClose}
            className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110'
            style={{
              background: 'rgba(39, 39, 42, 0.6)',
              border: '1px solid rgba(156, 163, 175, 0.2)',
              color: '#9ca3af',
              fontSize: `${1.25 * scale}rem`,
            }}
          >
            ×
          </button>
          <div
            className='font-semibold mb-4 text-center uppercase tracking-[0.1em]'
            style={{
              fontSize: `${0.7 * scale}rem`,
              background: 'linear-gradient(135deg, #9ca3af 0%, #67e8f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t(previewCard.name)}{' '}
            <span style={{ color: '#71717a' }}>#{previewCard.id}</span>
          </div>
          <div
            className='origin-top mx-auto'
            style={{
              width: 'fit-content',
              transform: `scale(${1.3 * scale})`,
            }}
          >
            <CardRender card={previewCard} />
          </div>
        </div>
      </div>
    </div>
  );
};
