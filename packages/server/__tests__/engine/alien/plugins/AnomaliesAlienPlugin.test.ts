import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import { AlienState } from '@/engine/alien/AlienState.js';
import { AnomaliesAlienPlugin } from '@/engine/alien/plugins/AnomaliesAlienPlugin.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(id: string, seatIndex: number): Player {
  return new Player({
    id,
    name: id,
    color: seatIndex === 0 ? 'red' : 'blue',
    seatIndex,
  });
}

describe('AnomaliesAlienPlugin', () => {
  it('adds anomaly column and token slots on discover', () => {
    const plugin = new AnomaliesAlienPlugin();
    const alienState = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
    const board = alienState.boards[0];
    board.discovered = true;

    const game = {
      alienState,
      players: [],
      eventLog: new EventLog(),
      random: new SeededRandom('anomalies-discover'),
      sectors: Array.from({ length: 8 }, (_, i) => ({ id: `s${i}` })),
      solarSystem: {
        getSpacesOnPlanet: (planet: EPlanet) =>
          planet === EPlanet.EARTH ? [{ ringIndex: 3, indexInRing: 0 }] : [],
      },
    } as unknown as IGame;

    plugin.onDiscover(game, []);

    const columnSlots = board.slots.filter((slot) =>
      slot.slotId.includes('anomaly-column'),
    );
    const tokenSlots = board.slots.filter((slot) =>
      slot.slotId.includes('anomaly-token'),
    );

    expect(columnSlots).toHaveLength(3);
    expect(tokenSlots).toHaveLength(3);
  });

  it('awards token reward to the top marker owner of triggered color', () => {
    const plugin = new AnomaliesAlienPlugin();
    const p1 = createPlayer('p1', 0);
    const p2 = createPlayer('p2', 1);

    const alienState = AlienState.createFromHiddenAliens([EAlienType.ANOMALIES]);
    const board = alienState.boards[0];
    board.discovered = true;

    let earthSector = 0;
    const game = {
      alienState,
      players: [p1, p2],
      eventLog: new EventLog(),
      random: new SeededRandom('anomalies-trigger'),
      sectors: Array.from({ length: 8 }, (_, i) => ({ id: `s${i}` })),
      solarSystem: {
        getSpacesOnPlanet: (planet: EPlanet) =>
          planet === EPlanet.EARTH
            ? [{ ringIndex: 3, indexInRing: earthSector * 3 }]
            : [],
      },
    } as unknown as IGame;

    plugin.onDiscover(game, []);

    const tokenAtEarth = board.slots.find((slot) =>
      slot.slotId.includes('anomaly-token|0|'),
    );
    expect(tokenAtEarth).toBeDefined();

    const triggeredColor = tokenAtEarth!.slotId.split('|')[2] as ETrace;
    const columnSlot = board.getSlot(
      `alien-${board.alienIndex}-anomaly-column|${triggeredColor}`,
    );
    expect(columnSlot).toBeDefined();

    board.placeTrace(columnSlot!, { playerId: p1.id }, triggeredColor);
    board.placeTrace(columnSlot!, { playerId: p2.id }, triggeredColor);

    const p1Before = p1.score;
    const p2Before = p2.score;
    plugin.onSolarSystemRotated(game);

    expect(p1.score).toBe(p1Before);
    expect(p2.score).toBe(p2Before + 2);
    expect(game.eventLog.recent(1)[0]?.type).toBe('ACTION');

    earthSector = 4;
    const p2AfterFirstTrigger = p2.score;
    plugin.onSolarSystemRotated(game);
    expect(p2.score).toBe(p2AfterFirstTrigger);
  });
});
