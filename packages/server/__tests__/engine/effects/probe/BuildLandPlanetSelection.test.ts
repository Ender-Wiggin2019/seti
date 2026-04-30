import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { buildLandPlanetSelection } from '@/engine/effects/probe/BuildLandPlanetSelection.js';

function createPlayer(canLandMap: Partial<Record<string, boolean>>) {
  const calls: Array<{ planet: EPlanet; isMoon: boolean }> = [];
  const player = {
    canLand: (planet: EPlanet, options: { isMoon?: boolean }) => {
      const key = `${planet}:${options.isMoon ? 'moon' : 'planet'}`;
      return canLandMap[key] ?? false;
    },
    land: (planet: EPlanet, options: { isMoon?: boolean }) => {
      calls.push({ planet, isMoon: options.isMoon ?? false });
      return undefined;
    },
  } as never;

  return { player, calls };
}

describe('buildLandPlanetSelection', () => {
  it('returns undefined when no land targets are available', () => {
    const { player } = createPlayer({});

    const input = buildLandPlanetSelection(player, {} as never, {
      prompt: 'Choose landing',
      allowMoons: true,
      payCost: true,
    });

    expect(input).toBeUndefined();
  });

  it('builds options and triggers player.land on select', () => {
    const { player, calls } = createPlayer({
      [`${EPlanet.MARS}:planet`]: true,
      [`${EPlanet.MARS}:moon`]: true,
    });

    const input = buildLandPlanetSelection(player, {} as never, {
      prompt: 'Choose landing',
      allowMoons: true,
      includeSkipOption: false,
      payCost: true,
    });

    expect(input).toBeDefined();
    const model = input?.toModel();
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    if (!model || model.type !== EPlayerInputType.OPTION) return;
    expect(
      model.options.some((option) => option.id.includes('land-mars')),
    ).toBe(true);

    input?.process({ type: EPlayerInputType.OPTION, optionId: 'land-mars' });
    expect(calls).toEqual([{ planet: EPlanet.MARS, isMoon: false }]);
  });

  it('does not include skip option by default', () => {
    const { player } = createPlayer({
      [`${EPlanet.MERCURY}:planet`]: true,
    });

    const input = buildLandPlanetSelection(player, {} as never, {
      prompt: 'Choose landing',
      payCost: true,
    });

    const model = input?.toModel();
    if (!model || model.type !== EPlayerInputType.OPTION) return;
    expect(model.options.some((option) => option.id === 'skip-land')).toBe(
      false,
    );
  });

  it('includes skip option when explicitly requested', () => {
    const { player } = createPlayer({
      [`${EPlanet.MERCURY}:planet`]: true,
    });

    const input = buildLandPlanetSelection(player, {} as never, {
      prompt: 'Choose landing',
      includeSkipOption: true,
      payCost: true,
    });

    const model = input?.toModel();
    if (!model || model.type !== EPlayerInputType.OPTION) return;
    expect(model.options.some((option) => option.id === 'skip-land')).toBe(
      true,
    );
  });
});
