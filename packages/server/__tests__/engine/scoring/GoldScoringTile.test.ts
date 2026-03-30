import { ETrace } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { EPieceType } from '@/engine/player/Pieces.js';
import { Player } from '@/engine/player/Player.js';
import { GoldScoringTile } from '@/engine/scoring/GoldScoringTile.js';

describe('GoldScoringTile', () => {
  it('scores all 8 tile formulas correctly', () => {
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      techs: [
        ETechId.PROBE_DOUBLE_PROBE,
        ETechId.PROBE_ASTEROID,
        ETechId.SCAN_EARTH_LOOK,
        ETechId.COMPUTER_VP_CREDIT,
        ETechId.COMPUTER_VP_ENERGY,
      ],
      completedMissions: ['m1', 'm2', 'm3'],
      endGameCards: ['eg1'],
      tuckedIncomeCards: [
        { income: 'credit' },
        { income: 'credit' },
        { income: 'energy' },
        { income: 'draw-card' },
      ],
      traces: {
        [ETrace.RED]: 4,
        [ETrace.YELLOW]: 2,
        [ETrace.BLUE]: 3,
      },
    });
    player.pieces.deploy(EPieceType.ORBITER);
    player.pieces.deploy(EPieceType.ORBITER);
    player.pieces.deploy(EPieceType.LANDER);

    const game = {
      sectors: [
        {
          sectorWinners: ['p1', 'p1', 'p2'],
        },
      ],
    } as never;

    const techA = new GoldScoringTile({
      id: 'tech',
      side: 'A',
      slotValues: [5],
    });
    techA.claim('p1');
    expect(techA.scorePlayer(player, game)).toBe(5);

    const techB = new GoldScoringTile({
      id: 'tech',
      side: 'B',
      slotValues: [5],
    });
    techB.claim('p1');
    expect(techB.scorePlayer(player, game)).toBe(10);

    const missionA = new GoldScoringTile({
      id: 'mission',
      side: 'A',
      slotValues: [5],
    });
    missionA.claim('p1');
    expect(missionA.scorePlayer(player, game)).toBe(15);

    const missionB = new GoldScoringTile({
      id: 'mission',
      side: 'B',
      slotValues: [5],
    });
    missionB.claim('p1');
    expect(missionB.scorePlayer(player, game)).toBe(5);

    const incomeA = new GoldScoringTile({
      id: 'income',
      side: 'A',
      slotValues: [5],
    });
    incomeA.claim('p1');
    expect(incomeA.scorePlayer(player, game)).toBe(10);

    const incomeB = new GoldScoringTile({
      id: 'income',
      side: 'B',
      slotValues: [5],
    });
    incomeB.claim('p1');
    expect(incomeB.scorePlayer(player, game)).toBe(10);

    const otherA = new GoldScoringTile({
      id: 'other',
      side: 'A',
      slotValues: [5],
    });
    otherA.claim('p1');
    expect(otherA.scorePlayer(player, game)).toBe(10);

    const otherB = new GoldScoringTile({
      id: 'other',
      side: 'B',
      slotValues: [5],
    });
    otherB.claim('p1');
    expect(otherB.scorePlayer(player, game)).toBe(10);
  });

  it('does not allow claiming same tile twice by same player', () => {
    const tile = new GoldScoringTile({
      id: 'tech',
      side: 'A',
      slotValues: [5, 4],
    });
    expect(tile.claim('p1')).toBe(5);
    expect(tile.claim('p1')).toBe(0);
  });
});
