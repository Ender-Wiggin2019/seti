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
          alienModulesEnabled: [true, true, false, false, false],
          undoAllowed: true,
          timerPerTurn: 0,
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
