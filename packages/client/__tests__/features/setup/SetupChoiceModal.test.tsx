import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SetupChoiceModal } from '@/features/setup/SetupChoiceModal';
import { EPlayerInputType, ESetupChoiceStepKind } from '@/types/re-exports';

describe('SetupChoiceModal', () => {
  it('exposes setup choice as a labelled modal dialog', () => {
    render(
      <SetupChoiceModal
        model={{
          inputId: 'setup-choice',
          type: EPlayerInputType.OPTION,
          title: 'Choose organization',
          setupChoice: {
            kind: ESetupChoiceStepKind.ORGANIZATION,
            stepIndex: 0,
            totalSteps: 2,
            minSelections: 1,
            maxSelections: 1,
          },
          options: [{ id: 'org-a', label: 'Organization A' }],
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Choose organization' }),
    ).toHaveAttribute('aria-modal', 'true');
  });
});
