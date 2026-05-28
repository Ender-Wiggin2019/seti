import { describe, expect, it } from 'vitest';
import { isLayoutDevPanelShortcut } from '@/features/layout/LayoutShell';
import { getInputFocusSection } from '@/features/layout/sectionInputs';
import { EPlayerInputType, ETrace } from '@/types/re-exports';

describe('layout helpers', () => {
  it('accepts both Ctrl+Shift+L and Cmd+Shift+L for the dev panel', () => {
    expect(
      isLayoutDevPanelShortcut(
        new KeyboardEvent('keydown', {
          key: 'L',
          ctrlKey: true,
          shiftKey: true,
        }),
      ),
    ).toBe(true);
    expect(
      isLayoutDevPanelShortcut(
        new KeyboardEvent('keydown', {
          key: 'l',
          metaKey: true,
          shiftKey: true,
        }),
      ),
    ).toBe(true);
  });

  it('routes alien and planetary pending inputs to their layout sections', () => {
    expect(
      getInputFocusSection({
        inputId: 'alien-input',
        type: EPlayerInputType.TRACE,
        title: 'Trace alien',
        options: [ETrace.BLUE],
      }),
    ).toBe('alienBoard');

    expect(
      getInputFocusSection({
        inputId: 'planet-input',
        type: EPlayerInputType.OPTION,
        title: 'Choose Mars slot',
        options: [{ id: 'main-action-orbit-slot-mars-first', label: 'Mars' }],
      }),
    ).toBe('planetBoard');
  });
});
