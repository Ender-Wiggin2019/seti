import { render, screen } from '@testing-library/react';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import type { IPublicAlienState } from '@/types/re-exports';
import { EAlienType, ETrace } from '@/types/re-exports';

describe('AlienBoardView', () => {
  it('renders all public alien reward labels', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      slots: [
        {
          slotId: 'reward-slot',
          traceColor: ETrace.RED,
          occupants: [],
          maxOccupants: -1,
          rewards: [
            { type: 'VP', amount: 4 },
            { type: 'PUBLICITY', amount: 2 },
            { type: 'CREDIT', amount: 1 },
            { type: 'ENERGY', amount: 1 },
            { type: 'DATA', amount: 1 },
            { type: 'CARD', amount: 1 },
            { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
          ],
          isDiscovery: false,
        },
      ],
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    expect(
      screen.getByText(
        '4VP, 2PR, 1CR, 1EN, 1DATA, 1CARD, DRAW_ALIEN_CARD',
      ),
    ).toBeInTheDocument();
  });
});
