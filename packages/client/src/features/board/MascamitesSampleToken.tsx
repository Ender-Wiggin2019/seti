/*
 * @Author: Ender-Wiggin
 * @Date: 2026-06-11 03:49:53
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2026-06-11 04:03:28
 * @Description:
 */
import { DescRender } from '@seti/cards';
import {
  getMascamitesSampleToken,
  type TMascamitesSampleTokenId,
} from '@seti/common/constant/mascamites';
import {
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { TPublicSlotReward } from '@/types/re-exports';
import { TokenCountBadge } from './TokenCountBadge';

interface IMascamitesSampleTokenProps {
  sampleTokenId?: TMascamitesSampleTokenId;
  face?: 'front' | 'back';
  count?: number;
  playerColor?: string;
  className?: string;
}

export function MascamitesSampleToken({
  sampleTokenId,
  face = 'back',
  count = 1,
  playerColor,
  className,
}: IMascamitesSampleTokenProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const side = face === 'front' ? 'front' : 'back';
  const sample = sampleTokenId ? getMascamitesSampleToken(sampleTokenId) : null;
  const rewards = sample
    ? toTraceRewardPresentations(sample.rewards as readonly TPublicSlotReward[])
    : [];

  return (
    <span
      className={cn(
        'pointer-events-none relative inline-flex h-7 w-7 select-none items-center justify-center rounded-full border border-surface-200/70 bg-surface-950/90 shadow-[0_0_0_1px_rgba(0,0,0,0.7),0_2px_6px_rgba(0,0,0,0.55)]',
        className,
      )}
      data-testid={`mascamites-sample-token-${sampleTokenId ?? 'hidden'}-${side}`}
      title={t('client.solar_system_view.sample_title', {
        sampleTokenId,
        defaultValue: sampleTokenId ?? 'Mascamites sample',
      })}
      style={
        playerColor
          ? {
              boxShadow: `0 0 0 2px ${playerColor}, 0 2px 6px rgba(0,0,0,0.55)`,
            }
          : undefined
      }
    >
      {side === 'front' && rewards.length > 0 ? (
        <span className='flex items-center justify-center gap-0.5'>
          {rewards.map((reward, index) => (
            <SampleRewardIcon
              key={`${reward.token}-${index}`}
              reward={reward}
            />
          ))}
        </span>
      ) : (
        <DescRender desc='{sample}' size='sm' smartSize />
      )}
      <TokenCountBadge count={count} />
    </span>
  );
}

function SampleRewardIcon({
  reward,
}: {
  reward: TTraceRewardPresentation;
}): React.JSX.Element {
  if (reward.kind === 'text') {
    return (
      <span className='font-mono text-[8px] font-bold leading-none text-text-100'>
        {reward.text}
      </span>
    );
  }

  return <DescRender desc={reward.token} size='desc-mini' smartSize />;
}
