import { EAlienType } from '@seti/common/types/BaseCard';
import {
  DEFAULT_ALIEN_MODULES_ENABLED,
  EExpansion,
} from '@seti/common/types/protocol/options';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { GameSettingsPanel } from '@/pages/lobby/GameSettingsPanel';

describe('GameSettingsPanel editable', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en');
  });

  it('emits room option changes for alien toggles', () => {
    const onChange = vi.fn();

    render(
      <GameSettingsPanel
        options={{
          playerCount: 2,
          isSoloMode: false,
          soloDifficulty: 1,
          alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
          undoAllowed: true,
          timerPerTurn: 0,
          expansions: [],
        }}
        readOnly={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Anomalies' }));

    expect(onChange).toHaveBeenCalledWith({
      alienModulesEnabled: {
        ...DEFAULT_ALIEN_MODULES_ENABLED,
        [EAlienType.ANOMALIES]: false,
      },
    });
  });

  it('emits dependent Space Agency option patches', () => {
    const onChange = vi.fn();

    render(
      <GameSettingsPanel
        options={{
          playerCount: 2,
          isSoloMode: false,
          soloDifficulty: 1,
          alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
          undoAllowed: true,
          timerPerTurn: 0,
          expansions: [EExpansion.BASE],
        }}
        readOnly={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Space Agency' }));

    expect(onChange).toHaveBeenCalledWith({
      expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
      alienModulesEnabled: {
        [EAlienType.GLYPHIDS]: true,
        [EAlienType.AMOEBA]: true,
        [EAlienType.ARKHOS]: true,
      },
      spaceAgencyOptions: {
        enabled: true,
        agencies: true,
        startResourceCards: true,
        newDeck: true,
        newAlienSpecies: true,
      },
    });
  });

  it('localizes Space Agency option controls through common/i18n', async () => {
    await i18n.changeLanguage('zh-CN');

    render(
      <GameSettingsPanel
        options={{
          playerCount: 2,
          isSoloMode: false,
          soloDifficulty: 1,
          alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
          undoAllowed: true,
          timerPerTurn: 0,
          expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
          spaceAgencyOptions: {
            enabled: true,
            agencies: true,
            startResourceCards: false,
            newDeck: false,
            newAlienSpecies: true,
          },
        }}
        readOnly={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('switch', { name: '太空机构' })).toBeChecked();
    expect(screen.getByRole('switch', { name: '组织' })).toBeChecked();
    expect(
      screen.getByRole('switch', { name: '快速起步卡' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '新外星物种' })).toBeChecked();
    expect(
      screen.getByRole('switch', { name: '阿尔霍斯' }),
    ).toBeInTheDocument();
  });

  it('clears dependent Space Agency toggles when agencies are disabled', () => {
    const onChange = vi.fn();

    render(
      <GameSettingsPanel
        options={{
          playerCount: 2,
          isSoloMode: false,
          soloDifficulty: 1,
          alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
          undoAllowed: true,
          timerPerTurn: 0,
          expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
          spaceAgencyOptions: {
            enabled: true,
            agencies: true,
            startResourceCards: true,
            newDeck: false,
            newAlienSpecies: false,
          },
        }}
        readOnly={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Organizations' }));

    expect(onChange).toHaveBeenCalledWith({
      spaceAgencyOptions: {
        enabled: true,
        agencies: false,
        startResourceCards: false,
        newDeck: false,
        newAlienSpecies: false,
      },
    });
  });

  it('emits Space Agency alien module patches for Arkhos', () => {
    const onChange = vi.fn();

    render(
      <GameSettingsPanel
        options={{
          playerCount: 2,
          isSoloMode: false,
          soloDifficulty: 1,
          alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
          undoAllowed: true,
          timerPerTurn: 0,
          expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
          spaceAgencyOptions: {
            enabled: true,
            agencies: false,
            startResourceCards: false,
            newDeck: false,
            newAlienSpecies: true,
          },
        }}
        readOnly={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Arkhos' }));

    expect(onChange).toHaveBeenCalledWith({
      alienModulesEnabled: {
        ...DEFAULT_ALIEN_MODULES_ENABLED,
        [EAlienType.ARKHOS]: true,
      },
    });
  });
});
