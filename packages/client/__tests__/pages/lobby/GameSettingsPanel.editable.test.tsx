import { EAlienType } from '@seti/common/types/BaseCard';
import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameSettingsPanel } from '@/pages/lobby/GameSettingsPanel';

describe('GameSettingsPanel editable', () => {
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
});
