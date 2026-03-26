import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

describe('SolarSystem', () => {
  it('builds expected total space count from 4 rings', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('space-count'),
    );
    expect(board.spaces).toHaveLength(8 + 16 + 24 + 32);
  });

  it('keeps adjacency symmetric', () => {
    const board = BoardBuilder.buildSolarSystem(new SeededRandom('adjacency'));

    for (const [spaceId, neighbors] of board.adjacency.entries()) {
      for (const neighborId of neighbors) {
        expect(board.adjacency.get(neighborId) ?? []).toContain(spaceId);
      }
    }
  });

  it('moves probes with rotated disc', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('rotation-move'),
    );
    const space0 = 'ring-1-cell-0';
    const space1 = 'ring-1-cell-1';
    const probe = board.placeProbe('p1', space0);

    board.rotate(0);

    expect(board.getProbesAt(space0).some((item) => item.id === probe.id)).toBe(
      false,
    );
    expect(board.getProbesAt(space1).some((item) => item.id === probe.id)).toBe(
      true,
    );
  });

  it('rotates in sequence top -> middle -> bottom -> top', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('rotation-seq'),
    );
    expect(board.rotateNextDisc()).toBe(0);
    expect(board.rotateNextDisc()).toBe(1);
    expect(board.rotateNextDisc()).toBe(2);
    expect(board.rotateNextDisc()).toBe(0);
  });

  it('pushes lower-ring probes when upper NULL closes after rotation', () => {
    const board = BoardBuilder.buildSolarSystem(new SeededRandom('push'));
    const ring1cell0 = board.spaces.find(
      (space) => space.id === 'ring-1-cell-0',
    );
    const ring1cell7 = board.spaces.find(
      (space) => space.id === 'ring-1-cell-7',
    );
    const ring2cell0 = board.spaces.find(
      (space) => space.id === 'ring-2-cell-0',
    );
    const ring2cell1 = board.spaces.find(
      (space) => space.id === 'ring-2-cell-1',
    );

    if (!ring1cell0 || !ring1cell7 || !ring2cell0 || !ring2cell1) {
      throw new Error('Expected ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    ring2cell1.hasPublicityIcon = true;

    const probe = board.placeProbe('p1', ring2cell0.id);
    board.rotate(0);

    expect(
      board.getProbesAt(ring2cell0.id).some((item) => item.id === probe.id),
    ).toBe(false);
    expect(
      board.getProbesAt(ring2cell1.id).some((item) => item.id === probe.id),
    ).toBe(true);
    expect(board.getPlayerPublicity('p1')).toBe(1);
  });

  it('awards publicity only on enter', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('publicity-enter'),
    );
    const from = board.spaces.find((space) => space.id === 'ring-2-cell-0');
    const to = board.spaces.find((space) => space.id === 'ring-2-cell-1');
    if (!from || !to) {
      throw new Error('Expected spaces for move test');
    }

    from.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    to.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    from.hasPublicityIcon = false;
    to.hasPublicityIcon = true;

    const probe = board.placeProbe('p2', from.id);
    const firstMove = board.moveProbe(probe.id, from.id, to.id);
    expect(firstMove.publicityGained).toBe(1);
    expect(board.getPlayerPublicity('p2')).toBe(1);

    const secondMove = board.moveProbe(probe.id, to.id, from.id);
    expect(secondMove.publicityGained).toBe(0);
    expect(board.getPlayerPublicity('p2')).toBe(1);
  });

  it('does not allow traversing sun', () => {
    const board = BoardBuilder.buildSolarSystem(new SeededRandom('sun'));
    const probe = board.placeProbe('p1', 'ring-1-cell-0');

    const sunSpace = board.spaces.find((space) => space.id === 'sun-center');
    if (sunSpace) {
      sunSpace.elements = [{ type: ESolarSystemElementType.SUN, amount: 1 }];
    } else {
      board.spaces.push({
        id: 'sun-center',
        ringIndex: 0,
        indexInRing: 0,
        discIndex: null,
        hasPublicityIcon: false,
        elements: [{ type: ESolarSystemElementType.SUN, amount: 1 }],
        occupants: [],
      });
    }

    expect(() =>
      board.moveProbe(probe.id, 'ring-1-cell-0', 'sun-center'),
    ).toThrow();
  });

  it('charges extra movement cost when leaving asteroid', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('asteroid-cost'),
    );
    const from = board.spaces.find((space) => space.id === 'ring-2-cell-0');
    const to = board.spaces.find((space) => space.id === 'ring-2-cell-1');
    if (!from || !to) {
      throw new Error('Expected spaces for asteroid move');
    }

    from.elements = [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }];
    to.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    const probe = board.placeProbe('p3', from.id);
    const moveResult = board.moveProbe(probe.id, from.id, to.id);

    expect(moveResult.movementCost).toBe(2);
  });
});
