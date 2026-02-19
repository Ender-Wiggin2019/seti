import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect, useRef, useState } from 'react';
import corpsData from '@/../public/corps-analysis.json';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import {
  CardPreviewModal,
  ControlButtons,
  CorpData,
  CorpDetailPanel,
  FooterInfo,
  PageIndicator,
  TierRow,
} from '@/components/slide';
import { IBaseCard } from '@/types/BaseCard';

type Props = {
  corps: CorpData[];
};

const TIER_CONFIG = {
  top: {
    label: '夯',
    color: '#9ca3af',
    gradient: 'from-silver-400 to-silver-500',
    corps: ['future-span'],
  },
  high: {
    label: '顶级',
    color: '#d4d4d8',
    gradient: 'from-zinc-300 to-zinc-400',
    corps: ['deep-space-detection', 'deep-space-strategy'],
  },
  good: {
    label: '人上人',
    color: '#67e8f9',
    gradient: 'from-ice-300 to-ice-400',
    corps: ['fenwick', 'universal-power'],
  },
  average: {
    label: 'NPC',
    color: '#a78bfa',
    gradient: 'from-violet-400 to-violet-500',
    corps: ['alien-lab', 'sentry-network', 'star-orbit', 'alpha-assembly'],
  },
  low: {
    label: '拉完了',
    color: '#71717a',
    gradient: 'from-zinc-500 to-zinc-600',
    corps: ['stratus-core', 'turing-system'],
  },
};

const STATS_CONFIG = {
  initStrength: { min: 13, max: 16, label: '首轮强度' },
  model: { min: 34, max: 39, label: '公司模型' },
  ceiling: { min: 36, max: 46, label: '上限能力' },
};

function calculateNormalizedStats(corps: CorpData[]) {
  const avg = (arr: number[]) =>
    arr.reduce((sum, v) => sum + v, 0) / arr.length;
  const min = (arr: number[]) => Math.min(...arr);
  const max = (arr: number[]) => Math.max(...arr);

  const initStrengthValues = corps.map((c) => c.initStrength);
  const modelValues = corps.map((c) => c.model);
  const ceilingValues = corps.map((c) => Math.min(c.ceiling, 42));

  return {
    initStrength: {
      avg: avg(initStrengthValues),
      min: Math.min(
        STATS_CONFIG.initStrength.min,
        min(initStrengthValues) - 0.5,
      ),
      max: Math.max(
        STATS_CONFIG.initStrength.max,
        max(initStrengthValues) + 0.5,
      ),
    },
    model: {
      avg: avg(modelValues),
      min: Math.min(STATS_CONFIG.model.min, min(modelValues) - 0.5),
      max: Math.max(STATS_CONFIG.model.max, max(modelValues) + 0.5),
    },
    ceiling: {
      avg: avg(ceilingValues),
      min: 36,
      max: 42,
    },
  };
}

export default function SlidePage({
  corps,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewCard, setPreviewCard] = useState<IBaseCard | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentCorp = selectedCorpId
    ? corps.find((c) => c.id === selectedCorpId)
    : null;
  const statsConfig = calculateNormalizedStats(corps);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleBackToHome = () => {
    setSelectedCorpId(null);
    setCurrentPage(0);
    setActiveDimension(null);
  };

  const handleSelectCorp = (corpId: string) => {
    setSelectedCorpId(corpId);
    setCurrentPage(0);
    setActiveDimension(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewCard) {
          setPreviewCard(null);
          return;
        }
        if (selectedCorpId) {
          handleBackToHome();
        }
      }
      if (!selectedCorpId) return;
      if (e.key === 'ArrowLeft') {
        setCurrentPage((prev) => Math.max(0, prev - 1));
        setActiveDimension(null);
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((prev) => Math.min(1, prev + 1));
        setActiveDimension(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCorpId, previewCard]);

  const scale = isFullscreen ? 1.8 : isMobile ? 0.9 : 1;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const renderHomePage = () => (
    <div className='h-full flex flex-col p-4 md:p-6 overflow-auto'>
      <div className='text-center mb-6 md:mb-8 relative flex-shrink-0'>
        <div
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[150px] md:h-[200px] pointer-events-none'
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(156, 163, 175, 0.1), transparent 60%)',
          }}
        />
        <div className='relative'>
          <h1
            className='font-bold mb-2 md:mb-3 tracking-tight'
            style={{
              fontSize: `${1.5 * scale}rem`,
              background:
                'linear-gradient(135deg, #9ca3af 0%, #67e8f9 50%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 8s ease infinite',
            }}
          >
            SETI 公司梯度排名
          </h1>
          <p
            style={{ color: '#67e8f9', fontSize: `${0.6 * scale}rem` }}
            className='tracking-wide px-4'
          >
            特别感谢：火焰(欢迎加群，群里还有完整分析论文)、PETEREN、卷柏的分析意见
          </p>
        </div>
      </div>

      <div className='flex-1 flex flex-col gap-2.5 md:gap-3 min-h-0'>
        {Object.entries(TIER_CONFIG).map(([tierKey, tierConfig]) => (
          <TierRow
            key={tierKey}
            tierConfig={tierConfig}
            corps={corps}
            scale={scale}
            isMobile={isMobile}
            onSelect={handleSelectCorp}
          />
        ))}
      </div>
    </div>
  );

  const renderCorpDetail = () => {
    if (!currentCorp) return null;

    return (
      <CorpDetailPanel
        corp={currentCorp}
        statsConfig={statsConfig}
        currentPage={currentPage}
        activeDimension={activeDimension}
        onDimensionClick={setActiveDimension}
        onPageChange={setCurrentPage}
        onPreviewCard={setPreviewCard}
        scale={scale}
        isMobile={isMobile}
      />
    );
  };

  return (
    <Layout>
      <Seo templateTitle='SETI 公司攻略' />
      <style jsx global>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>

      <div
        ref={wrapperRef}
        className={`min-h-screen flex items-center justify-center pt-2 pb-4 md:py-8 px-2 md:px-4 ${
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
            className='relative shadow-2xl overflow-hidden'
            style={{
              width: isFullscreen ? 'calc(100vh * 16 / 9)' : undefined,
              height: isFullscreen ? '100vh' : undefined,
              maxWidth: isFullscreen ? '100vw' : undefined,
              minHeight: isFullscreen
                ? undefined
                : selectedCorpId
                  ? 'auto'
                  : '80vh',
              background:
                'linear-gradient(145deg, #0a0a0b 0%, #141416 30%, #0a0a0b 70%, #050507 100%)',
              border: '1px solid rgba(63, 63, 70, 0.3)',
              borderRadius: isMobile ? '12px' : '24px',
              boxShadow: `
                0 0 60px rgba(0, 0, 0, 0.4),
                0 0 100px rgba(156, 163, 175, 0.03),
                inset 0 1px 0 rgba(255, 255, 255, 0.015)
              `,
            }}
          >
            <div
              className='absolute inset-0 pointer-events-none'
              style={{
                backgroundImage: `
                  radial-gradient(ellipse at 15% 20%, rgba(156, 163, 175, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse at 85% 80%, rgba(103, 232, 249, 0.05) 0%, transparent 45%),
                  radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 60%)
                `,
              }}
            />
            <svg className='absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none'>
              <defs>
                <pattern
                  id='hexagons'
                  width='56'
                  height='100'
                  patternUnits='userSpaceOnUse'
                  patternTransform='scale(2)'
                >
                  <path
                    d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100'
                    fill='none'
                    stroke='rgba(156, 163, 175, 0.5)'
                    strokeWidth='0.5'
                  />
                  <path
                    d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34'
                    fill='none'
                    stroke='rgba(156, 163, 175, 0.5)'
                    strokeWidth='0.5'
                  />
                </pattern>
              </defs>
              <rect width='100%' height='100%' fill='url(#hexagons)' />
            </svg>
            <div
              className='absolute inset-0 pointer-events-none opacity-[0.02]'
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 255, 255, 0.03) 2px,
                  rgba(255, 255, 255, 0.03) 4px
                )`,
              }}
            />
            <div
              className='absolute inset-0 opacity-[0.012] pointer-events-none'
              style={{
                backgroundImage: `
                  linear-gradient(rgba(156, 163, 175, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(156, 163, 175, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />

            <div className='relative z-10 h-full'>
              {selectedCorpId ? renderCorpDetail() : renderHomePage()}
            </div>

            <ControlButtons
              isFullscreen={isFullscreen}
              scale={scale}
              onToggleFullscreen={toggleFullscreen}
              showBack={!!selectedCorpId}
              onBack={handleBackToHome}
            />

            {selectedCorpId && !isMobile && (
              <PageIndicator
                currentPage={currentPage}
                totalPages={2}
                scale={scale}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setActiveDimension(null);
                }}
                className='absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:flex'
              />
            )}

            {previewCard && (
              <CardPreviewModal
                previewCard={previewCard}
                scale={scale}
                onClose={() => setPreviewCard(null)}
              />
            )}

            <FooterInfo scale={scale} isFullscreen={isFullscreen} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  return {
    props: {
      corps: corpsData as unknown as CorpData[],
      ...(await serverSideTranslations(locale ?? 'zh-CN', ['common', 'seti'])),
    },
  };
};
