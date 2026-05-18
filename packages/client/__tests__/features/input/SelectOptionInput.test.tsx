import { EOrganizationId } from '@seti/common/types/organization';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectOptionInput } from '@/features/input/SelectOptionInput';
import i18n from '@/i18n';
import { EPlayerInputType, ESetupChoiceStepKind } from '@/types/re-exports';

describe('SelectOptionInput', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en');
  });

  it('renders options and submits selected option id', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'input-option',
          type: EPlayerInputType.OPTION,
          options: [
            { id: 'opt-a', label: 'Option A' },
            { id: 'opt-b', label: 'Option B' },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Option B' }));
    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'input-option',
      type: EPlayerInputType.OPTION,
      optionId: 'opt-b',
    });
  });

  it('renders organization setup choices with organization metadata and same OPTION response', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'organization-choice',
          type: EPlayerInputType.OPTION,
          title: 'Choose organization',
          setupChoice: {
            kind: ESetupChoiceStepKind.ORGANIZATION,
            stepIndex: 0,
            totalSteps: 1,
            minSelections: 1,
            maxSelections: 1,
          },
          options: [
            {
              id: EOrganizationId.ORBITAL_DYNAMICS,
              label: 'Orbital Dynamics',
            },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    const option = screen.getByTestId(
      `input-option-${EOrganizationId.ORBITAL_DYNAMICS}`,
    );
    expect(option).toHaveTextContent('Orbital Dynamics');
    expect(option).toHaveTextContent('Start');
    expect(option).toHaveAccessibleName(
      /Setup: 2 credits, 2 energy, 0 cards, 3 publicity, 0 data, 2 tuck income cards/,
    );
    fireEvent.click(option);

    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'organization-choice',
      type: EPlayerInputType.OPTION,
      optionId: EOrganizationId.ORBITAL_DYNAMICS,
    });
  });

  it('localizes organization setup choice names and status copy', async () => {
    await i18n.changeLanguage('zh-CN');

    render(
      <SelectOptionInput
        model={{
          inputId: 'organization-choice',
          type: EPlayerInputType.OPTION,
          title: 'Choose organization',
          setupChoice: {
            kind: ESetupChoiceStepKind.ORGANIZATION,
            stepIndex: 0,
            totalSteps: 2,
            minSelections: 1,
            maxSelections: 1,
          },
          options: [
            {
              id: EOrganizationId.ORBITAL_DYNAMICS,
              label: 'Orbital Dynamics',
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('轨道动力')).toBeInTheDocument();
    expect(screen.getByText('初始')).toBeInTheDocument();
    expect(
      screen.getByText(
        /设置：2 金钱，2 能量，0 卡牌，3 声望，0 数据，2 张收入塞牌/,
      ),
    ).toBeInTheDocument();
  });

  it('renders Quick Start setup choices with card effects and same OPTION response', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'quick-start-choice',
          type: EPlayerInputType.OPTION,
          title: 'Choose Quick Start Cards',
          setupChoice: {
            kind: ESetupChoiceStepKind.QUICK_START_CARDS,
            stepIndex: 1,
            totalSteps: 2,
            minSelections: 2,
            maxSelections: 2,
          },
          options: [{ id: 'SR.3', label: 'Quick Start Card SR.3' }],
        }}
        onSubmit={onSubmit}
      />,
    );

    const option = screen.getByTestId('input-option-SR.3');
    expect(option).toHaveTextContent('SR.3');
    expect(
      screen.getByTestId('quick-start-card-preview-SR.3'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('seti-effect-red-signal')).toBeInTheDocument();
    expect(screen.getByTestId('seti-effect-score')).toBeInTheDocument();
    fireEvent.click(option);

    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'quick-start-choice',
      type: EPlayerInputType.OPTION,
      optionId: 'SR.3',
    });
  });
});
