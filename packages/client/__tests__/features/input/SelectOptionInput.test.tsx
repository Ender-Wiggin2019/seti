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

  it('renders card-reference options with full card visuals and the same OPTION response', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'input-option',
          type: EPlayerInputType.OPTION,
          title: 'Choose any card',
          options: [
            { id: 'take-93', label: 'Take [[card:93]] from card row' },
            { id: 'draw-deck', label: 'Draw from deck' },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    const cardOption = screen.getByTestId('input-option-take-93');
    expect(screen.getByTestId('card-render-93')).toBeInTheDocument();
    expect(screen.getByTestId('input-option-draw-deck')).toHaveTextContent(
      'Draw from deck',
    );

    fireEvent.click(cardOption);

    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'input-option',
      type: EPlayerInputType.OPTION,
      optionId: 'take-93',
    });
  });

  it('renders card-id option metadata with full card visuals and the same OPTION response', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'draw-alien-source',
          type: EPlayerInputType.OPTION,
          title: 'Choose how to draw from Oumuamua',
          options: [
            {
              id: 'draw-face-up',
              label: 'Draw face-up alien card',
              cardId: 'ET.21',
            },
            { id: 'draw-random', label: 'Draw random alien card' },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    const cardOption = screen.getByTestId('input-option-draw-face-up');
    expect(screen.getByTestId('card-render-ET.21')).toBeInTheDocument();
    expect(screen.getByTestId('input-option-draw-random')).toHaveTextContent(
      'Draw random alien card',
    );

    fireEvent.click(cardOption);

    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'draw-alien-source',
      type: EPlayerInputType.OPTION,
      optionId: 'draw-face-up',
    });
  });

  it('renders Mascamites sample options with sample visuals and the same OPTION response', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'collect-mascamites-sample',
          type: EPlayerInputType.OPTION,
          title: 'Collect Mascamites sample from jupiter',
          options: [
            {
              id: 'sample:mascamites-credit-2',
              label: 'mascamites-credit-2',
            },
            {
              id: 'sample:mascamites-energy-2',
              label: 'Hidden sample',
              sampleTokenId: 'mascamites-energy-2',
              sampleFaceDown: true,
            },
          ] as never,
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByTestId('mascamites-sample-token-mascamites-credit-2-front'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('mascamites-sample-token-mascamites-energy-2-back'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('input-option-sample:mascamites-credit-2'),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'collect-mascamites-sample',
      type: EPlayerInputType.OPTION,
      optionId: 'sample:mascamites-credit-2',
    });
  });

  it('renders organization setup choices with the real organization card visual and same OPTION response', () => {
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
    expect(
      screen.getByTestId(
        `organization-card-${EOrganizationId.ORBITAL_DYNAMICS}`,
      ),
    ).toBeInTheDocument();
    expect(option).toHaveAccessibleName(
      /Orbital Dynamics\. Setup: 2 credits, 2 energy, 0 cards, 3 publicity, 0 data, 2 tuck income cards/,
    );
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

    expect(
      screen.getByTestId(
        `organization-card-${EOrganizationId.ORBITAL_DYNAMICS}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
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
    expect(screen.getByTestId('card-render-SR.3')).toBeInTheDocument();
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
