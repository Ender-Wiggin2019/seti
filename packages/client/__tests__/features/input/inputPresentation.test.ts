import { ESector, ETrace } from '@seti/common/types/element';
import { describe, expect, it } from 'vitest';
import {
  getPlayerInputPresentationMode,
  ORBITAL_DYNAMICS_MOVE_INPUT_TITLE,
} from '@/features/input/inputPresentation';
import type { IPlayerInputModel } from '@/types/re-exports';
import {
  EPlayerInputPresentationMode,
  EPlayerInputType,
  ESetupChoiceStepKind,
  ETech,
} from '@/types/re-exports';

describe('input presentation policy', () => {
  it('honors explicit presentation mode from the input model', () => {
    const model: IPlayerInputModel = {
      inputId: 'explicit',
      type: EPlayerInputType.OPTION,
      presentationMode: EPlayerInputPresentationMode.DIALOG_AND_IN_GAME,
      options: [{ id: 'done', label: 'Done' }],
    };

    expect(getPlayerInputPresentationMode(model)).toBe(
      EPlayerInputPresentationMode.DIALOG_AND_IN_GAME,
    );
  });

  it('keeps setup, card, and tech choices in dialog mode by default', () => {
    const setupModel: IPlayerInputModel = {
      inputId: 'setup',
      type: EPlayerInputType.OPTION,
      setupChoice: {
        kind: ESetupChoiceStepKind.ORGANIZATION,
        stepIndex: 0,
        totalSteps: 2,
        minSelections: 1,
        maxSelections: 1,
      },
      options: [{ id: 'org-a', label: 'Org A' }],
    };
    const cardModel: IPlayerInputModel = {
      inputId: 'card',
      type: EPlayerInputType.CARD,
      cards: [],
      minSelections: 1,
      maxSelections: 1,
    };
    const techModel: IPlayerInputModel = {
      inputId: 'tech',
      type: EPlayerInputType.TECH,
      options: [ETech.SCAN],
    };

    expect(getPlayerInputPresentationMode(setupModel)).toBe(
      EPlayerInputPresentationMode.DIALOG_ONLY,
    );
    expect(getPlayerInputPresentationMode(cardModel)).toBe(
      EPlayerInputPresentationMode.DIALOG_ONLY,
    );
    expect(getPlayerInputPresentationMode(techModel)).toBe(
      EPlayerInputPresentationMode.DIALOG_ONLY,
    );
  });

  it('routes card-row card choices to in-game interaction when card row context matches', () => {
    const cardModel: IPlayerInputModel = {
      inputId: 'card-row',
      type: EPlayerInputType.CARD,
      cards: [{ id: 'row-1', name: 'Row Card' } as never],
      minSelections: 1,
      maxSelections: 1,
    };

    expect(
      getPlayerInputPresentationMode(cardModel, {
        cardRowCardIds: new Set(['row-1', 'row-2']),
      }),
    ).toBe(EPlayerInputPresentationMode.IN_GAME_INTERACTIVE);
  });

  it('routes sector and Orbital Dynamics move inputs to in-game interaction', () => {
    const sectorModel: IPlayerInputModel = {
      inputId: 'sector',
      type: EPlayerInputType.SECTOR,
      options: [ESector.RED],
    };
    const moveModel: IPlayerInputModel = {
      inputId: 'move',
      type: EPlayerInputType.OPTION,
      title: ORBITAL_DYNAMICS_MOVE_INPUT_TITLE,
      options: [
        { id: 'probe-1:ring-1-cell-1', label: 'probe-1 to ring-1-cell-1' },
        { id: 'done', label: 'Done' },
      ],
    };

    expect(getPlayerInputPresentationMode(sectorModel)).toBe(
      EPlayerInputPresentationMode.IN_GAME_INTERACTIVE,
    );
    expect(getPlayerInputPresentationMode(moveModel)).toBe(
      EPlayerInputPresentationMode.IN_GAME_INTERACTIVE,
    );
  });

  it('routes sector-id option inputs to in-game interaction', () => {
    const sectorOptionModel: IPlayerInputModel = {
      inputId: 'earth-look',
      type: EPlayerInputType.OPTION,
      title: 'Earth Look: choose sector for earth signal',
      options: [
        { id: 'sector-0', label: 'Earth - Red sector' },
        { id: 'sector-7', label: 'Adjacent - Blue sector' },
      ],
    };

    expect(getPlayerInputPresentationMode(sectorOptionModel)).toBe(
      EPlayerInputPresentationMode.IN_GAME_INTERACTIVE,
    );
  });

  it('routes alien trace slot option inputs to in-game interaction', () => {
    const alienTraceModel: IPlayerInputModel = {
      inputId: 'alien-trace-slot',
      type: EPlayerInputType.OPTION,
      title: 'Choose a trace slot',
      options: [
        {
          id: `alien-0-oumuamua-trace|${ETrace.PINK}|1|0`,
          label: 'Oumuamua pink trace slot',
        },
        {
          id: 'mascamites-fixed-blue-trace-8',
          label: 'Mascamites fixed blue trace slot',
        },
        {
          id: 'alien-0-mascamites-public-sample-0',
          label: 'Mascamites public sample trace slot',
        },
        {
          id: 'alien-0-mascamites-sample-blue-0',
          label: 'Mascamites delivered sample trace slot',
        },
      ],
    };

    expect(getPlayerInputPresentationMode(alienTraceModel)).toBe(
      EPlayerInputPresentationMode.IN_GAME_INTERACTIVE,
    );
  });
});
