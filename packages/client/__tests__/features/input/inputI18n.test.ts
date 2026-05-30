import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { translateInputText } from '@/features/input/inputI18n';

describe('inputI18n', () => {
  it('keeps card names intact when translating explicit resource sentinels', () => {
    const t = ((key: string, options?: Record<string, unknown>) => {
      if (key === 'client.resources.data') {
        return '__DATA__';
      }
      return (options?.defaultValue as string) ?? key;
    }) as unknown as TFunction;

    expect(
      translateInputText(
        t,
        'Tracking and Data Relay Satellite (#2): [[res:data]] ×2',
      ),
    ).toBe('Tracking and Data Relay Satellite (#2): __DATA__ ×2');
  });

  it('localizes orbit and land picker titles', () => {
    const t = ((key: string, options?: Record<string, unknown>) => {
      if (key === 'client.input.choose_planet_to_orbit') {
        return '选择要环绕的行星';
      }
      if (key === 'client.input.choose_planet_to_land_on') {
        return '选择要降落的行星';
      }
      if (key === 'client.input.choose_landing_position') {
        return '选择降落位置';
      }
      return (options?.defaultValue as string) ?? key;
    }) as unknown as TFunction;

    expect(translateInputText(t, 'Choose planet to orbit')).toBe(
      '选择要环绕的行星',
    );
    expect(translateInputText(t, 'Choose planet to land on')).toBe(
      '选择要降落的行星',
    );
    expect(translateInputText(t, 'Choose landing position')).toBe(
      '选择降落位置',
    );
  });
});
