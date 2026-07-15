import { e } from '@seti/common/constant/effect';
import { getIconItem } from '@seti/common/constant/icons';
import { EResource } from '@seti/common/types/element';
import { describe, expect, it } from 'vitest';

describe('icon item config', () => {
  it('renders signal tokens as repeated full icons instead of a numbered resource icon', () => {
    expect(getIconItem(e.SIGNAL_TOKEN(3))).toMatchObject({
      type: EResource.SIGNAL_TOKEN,
      value: 3,
      options: {
        showValue: false,
        shape: 'normal',
      },
    });
  });
});
