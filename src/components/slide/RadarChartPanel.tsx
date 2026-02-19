import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import type { CorpData } from './CorpCard';

function normalizeValue(value: number, min: number, max: number): number {
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

type StatsConfig = {
  initStrength: { avg: number; min: number; max: number };
  model: { avg: number; min: number; max: number };
  ceiling: { avg: number; min: number; max: number };
};

interface RadarChartPanelProps {
  corp: CorpData;
  statsConfig: StatsConfig;
  activeDimension: string | null;
  onDimensionClick: (dimension: string | null) => void;
  scale: number;
}

export const RadarChartPanel = ({
  corp,
  statsConfig,
  activeDimension,
  onDimensionClick,
  scale,
}: RadarChartPanelProps) => {
  const getRadarData = () => {
    return [
      {
        subject: '首轮强度',
        value: normalizeValue(
          corp.initStrength,
          statsConfig.initStrength.min,
          statsConfig.initStrength.max,
        ),
        fullMark: 100,
        dimension: 'firstRound',
      },
      {
        subject: '公司模型',
        value: normalizeValue(
          corp.model,
          statsConfig.model.min,
          statsConfig.model.max,
        ),
        fullMark: 100,
        dimension: 'overall',
      },
      {
        subject: '上限能力',
        value: normalizeValue(
          corp.ceiling,
          statsConfig.ceiling.min,
          statsConfig.ceiling.max,
        ),
        fullMark: 100,
        dimension: 'potential',
      },
    ];
  };

  const getDimensionLabel = (dimension: string) => {
    const labels: Record<string, string> = {
      firstRound: '首轮强度',
      overall: '综合评价',
      potential: '上限能力',
    };
    return labels[dimension] || dimension;
  };

  const getEvaluationContent = (dimension: string | null) => {
    if (!dimension) return null;
    return corp.evaluation[dimension as keyof typeof corp.evaluation];
  };

  const radarData = getRadarData();

  return (
    <div className='flex flex-col gap-4'>
      <div
        className='rounded-2xl p-4 md:p-5 relative overflow-hidden'
        style={{
          background:
            'linear-gradient(135deg, rgba(39, 39, 42, 0.35), rgba(20, 20, 22, 0.55))',
          border: '1px solid rgba(63, 63, 70, 0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.015)',
        }}
      >
        <div
          className='absolute top-0 left-0 right-0 h-px'
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.2), transparent)',
          }}
        />
        <ResponsiveContainer width='100%' height={160 * scale}>
          <RadarChart data={radarData}>
            <PolarGrid
              stroke='rgba(156, 163, 175, 0.3)'
              strokeWidth={1}
              strokeDasharray='4 4'
            />
            {/* @ts-expect-error recharts type compatibility */}
            <PolarAngleAxis
              dataKey='subject'
              tick={({ payload, x, y, ...props }: any) => {
                const dimension = radarData.find(
                  (d) => d.subject === payload.value,
                )?.dimension;
                const isActive = activeDimension === dimension;
                return (
                  <text
                    {...props}
                    x={x}
                    y={y}
                    fill={isActive ? '#9ca3af' : '#a1a1aa'}
                    fontSize={(isActive ? 13 : 12) * scale}
                    fontWeight={isActive ? 600 : 400}
                    textAnchor='middle'
                    className='cursor-pointer transition-all'
                    style={{
                      transition: 'all 0.2s',
                      outline: 'none',
                      stroke: 'none',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onClick={() => {
                      if (dimension) {
                        onDimensionClick(
                          activeDimension === dimension ? null : dimension,
                        );
                      }
                    }}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis
              tick={false}
              stroke='rgba(156, 163, 175, 0.2)'
              strokeWidth={1}
              angle={90}
              domain={[0, 100]}
            />
            <Radar
              name={corp.name}
              dataKey='value'
              stroke='#9ca3af'
              fill='url(#radarGradient)'
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <defs>
              <linearGradient id='radarGradient' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#9ca3af' />
                <stop offset='100%' stopColor='#67e8f9' />
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
        <p
          className='text-center mt-1 uppercase tracking-[0.12em]'
          style={{ color: '#52525b', fontSize: `${0.55 * scale}rem` }}
        >
          点击标签查看分析
        </p>
      </div>

      {activeDimension && (
        <div
          className='rounded-xl p-4 md:p-5 overflow-auto relative'
          style={{
            maxHeight: `${10 * scale}rem`,
            background:
              'linear-gradient(135deg, rgba(39, 39, 42, 0.5), rgba(20, 20, 22, 0.7))',
            border: '1px solid rgba(156, 163, 175, 0.2)',
            boxShadow: '0 0 16px rgba(156, 163, 175, 0.06)',
          }}
        >
          <div
            className='absolute top-0 left-4 right-4 h-px'
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.3), transparent)',
            }}
          />
          <div className='flex items-center gap-2'>
            <div
              className='w-1.5 h-1.5 rounded-full'
              style={{
                background: '#9ca3af',
                boxShadow: '0 0 6px rgba(156, 163, 175, 0.4)',
              }}
            />
            <h4
              className='font-semibold uppercase tracking-[0.1em]'
              style={{
                color: '#9ca3af',
                fontSize: `${0.7 * scale}rem`,
              }}
            >
              {getDimensionLabel(activeDimension)}
            </h4>
          </div>
          <p
            className='leading-relaxed mt-2'
            style={{
              color: '#d4d4d8',
              fontSize: `${0.85 * scale}rem`,
            }}
          >
            {getEvaluationContent(activeDimension)}
          </p>
        </div>
      )}
    </div>
  );
};
