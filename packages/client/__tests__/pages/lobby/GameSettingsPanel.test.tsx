import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameSettingsPanel } from '@/pages/lobby/GameSettingsPanel';

describe('GameSettingsPanel', () => {
  it('renders solo mode, difficulty, and human player count', () => {
    render(
      <GameSettingsPanel
        readOnly
        options={{
          playerCount: 2,
          isSoloMode: true,
          soloDifficulty: 4,
          alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
          undoAllowed: true,
          timerPerTurn: 0,
          expansions: [],
        }}
      />,
    );

    expect(screen.getByTestId('game-setting-value-mode')).toHaveTextContent(
      'Solo',
    );
    expect(screen.getByTestId('game-setting-value-players')).toHaveTextContent(
      '1',
    );
    expect(
      screen.getByTestId('game-setting-value-solo-difficulty'),
    ).toHaveTextContent('D4');
  });
});
