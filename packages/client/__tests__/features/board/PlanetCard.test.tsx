import type { TPlanetReward } from '@seti/common/constant/boardLayout';
import { EResource, ESector, ETrace } from '@seti/common/types/element';
import { extractDesc, renderNode2Effect } from '@seti/common/utils/desc';
import { describe, expect, it } from 'vitest';
import { planetRewardListToDesc } from '@/features/board/PlanetCard';

describe('PlanetCard reward desc', () => {
  it('emits desc tokens that the real DescRender parser resolves to effects', () => {
    const rewards: TPlanetReward[] = [
      { type: 'signal', target: 'planet-sector', amount: 1 },
      { type: 'signal', sector: ESector.RED, amount: 1 },
      { type: 'card', source: 'any', amount: 1 },
      { type: 'resource', resource: EResource.SCORE, amount: 12 },
      { type: 'trace', trace: ETrace.YELLOW, amount: 2 },
      { type: 'tuck', amount: 1 },
    ];

    const components = extractDesc(planetRewardListToDesc(rewards))
      .flat()
      .filter((node) => node.type === 'component');

    expect(components.map((node) => node.name)).toEqual([
      'any-signal',
      'red-signal',
      'any-card',
      'score',
      'yellow-trace',
      'income',
    ]);
    expect(components.map(renderNode2Effect)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'any-signal', value: 1 }),
        expect.objectContaining({ type: 'red-signal', value: 1 }),
        expect.objectContaining({ type: 'any-card', value: 1 }),
        expect.objectContaining({ type: 'score', value: 12 }),
        expect.objectContaining({ type: 'yellow-trace', value: 2 }),
        expect.objectContaining({ type: 'income', value: 1 }),
      ]),
    );
  });
});
