import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SetupChoiceModal } from '@/features/setup/SetupChoiceModal';
import i18n from '@/i18n';
import { EPlayerInputType, ESetupChoiceStepKind } from '@/types/re-exports';

describe('SetupChoiceModal', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en');
  });

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

  it('localizes fallback setup choice labels through common/i18n', async () => {
    await i18n.changeLanguage('zh-CN');

    render(
      <SetupChoiceModal
        model={{
          inputId: 'setup-choice',
          type: EPlayerInputType.OPTION,
          setupChoice: {
            kind: ESetupChoiceStepKind.ORGANIZATION,
            stepIndex: 0,
            totalSteps: 3,
            minSelections: 1,
            maxSelections: 1,
          },
          options: [{ id: 'org-a', label: 'Organization A' }],
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: '设置选择' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
    expect(screen.getByText('设置选择')).toBeInTheDocument();
  });
});
