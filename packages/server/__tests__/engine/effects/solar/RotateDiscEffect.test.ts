import { vi } from 'vitest';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { RotateDiscEffect } from '@/engine/effects/solar/RotateDiscEffect.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createBoard(seed: string) {
  return BoardBuilder.buildSolarSystemFromRandom(new SeededRandom(seed));
}

describe('RotateDiscEffect', () => {
  it('returns -1 when solar system is missing', () => {
    const game = { solarSystem: null };
    expect(RotateDiscEffect.canExecute(game as never)).toBe(false);
    expect(RotateDiscEffect.execute(game as never)).toEqual({
      rotatedDisc: -1,
    });
  });

  it('rotates next disc when solar system exists', () => {
    const onSolarSystemRotated = vi.fn();
    const game = {
      solarSystem: {
        rotateNextDisc: vi.fn(() => 2),
      },
      alienState: {
        onSolarSystemRotated,
      },
    };

    expect(RotateDiscEffect.canExecute(game as never)).toBe(true);
    expect(RotateDiscEffect.execute(game as never)).toEqual({ rotatedDisc: 2 });
    expect(game.solarSystem.rotateNextDisc).toHaveBeenCalledOnce();
    expect(onSolarSystemRotated).toHaveBeenCalledOnce();
    expect(onSolarSystemRotated).toHaveBeenCalledWith(game);
  });

  it('rotates the top disc and moves probes with the real solar system', () => {
    const solarSystem = createBoard('rotate-top-disc');
    const probe = solarSystem.placeProbe('p1', 'ring-1-cell-0');
    const game = { solarSystem };

    expect(RotateDiscEffect.execute(game as never)).toEqual({ rotatedDisc: 0 });
    expect(
      solarSystem
        .getProbesAt('ring-1-cell-0')
        .some((item) => item.id === probe.id),
    ).toBe(false);
    expect(
      solarSystem
        .getProbesAt('ring-1-cell-1')
        .some((item) => item.id === probe.id),
    ).toBe(true);
  });

  it('rotates the middle and bottom discs in sequence using rotationCounter', () => {
    const middleBoard = createBoard('rotate-middle-disc');
    middleBoard.rotationCounter = 1;
    const middleProbe = middleBoard.placeProbe('p1', 'ring-2-cell-0');

    expect(
      RotateDiscEffect.execute({ solarSystem: middleBoard } as never),
    ).toEqual({ rotatedDisc: 1 });
    expect(
      middleBoard
        .getProbesAt('ring-2-cell-1')
        .some((item) => item.id === middleProbe.id),
    ).toBe(true);

    const bottomBoard = createBoard('rotate-bottom-disc');
    bottomBoard.rotationCounter = 2;
    const bottomProbe = bottomBoard.placeProbe('p1', 'ring-3-cell-0');

    expect(
      RotateDiscEffect.execute({ solarSystem: bottomBoard } as never),
    ).toEqual({ rotatedDisc: 2 });
    expect(
      bottomBoard
        .getProbesAt('ring-3-cell-1')
        .some((item) => item.id === bottomProbe.id),
    ).toBe(true);
  });

  it('pushes covered probes to the next valid space and grants publicity on enter', () => {
    const solarSystem = createBoard('rotate-push-publicity');
    const ring1cell0 = solarSystem.spaces.find(
      (space) => space.id === 'ring-1-cell-0',
    );
    const ring1cell7 = solarSystem.spaces.find(
      (space) => space.id === 'ring-1-cell-7',
    );
    const ring2cell0 = solarSystem.spaces.find(
      (space) => space.id === 'ring-2-cell-0',
    );
    const ring2cell1 = solarSystem.spaces.find(
      (space) => space.id === 'ring-2-cell-1',
    );

    if (!ring1cell0 || !ring1cell7 || !ring2cell0 || !ring2cell1) {
      throw new Error('expected solar-system ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    ring2cell1.hasPublicityIcon = true;

    const probe = solarSystem.placeProbe('p1', ring2cell0.id);

    expect(RotateDiscEffect.execute({ solarSystem } as never)).toEqual({
      rotatedDisc: 0,
    });
    expect(
      solarSystem
        .getProbesAt(ring2cell0.id)
        .some((item) => item.id === probe.id),
    ).toBe(false);
    expect(
      solarSystem
        .getProbesAt(ring2cell1.id)
        .some((item) => item.id === probe.id),
    ).toBe(true);
    expect(solarSystem.getPlayerPublicity('p1')).toBe(1);
  });

  it('honors publicityIconAmount > 1 when a probe enters a reinforced icon space', () => {
    // Regression for §9.2 / §5.7: the publicity icon is modeled as a
    // numeric amount (default 1 when omitted). Setting an explicit
    // `publicityIconAmount` on the destination space must translate into
    // that many publicity points for the entering probe.
    const solarSystem = createBoard('rotate-push-publicity-amount');
    const ring1cell0 = solarSystem.spaces.find(
      (space) => space.id === 'ring-1-cell-0',
    );
    const ring1cell7 = solarSystem.spaces.find(
      (space) => space.id === 'ring-1-cell-7',
    );
    const ring2cell0 = solarSystem.spaces.find(
      (space) => space.id === 'ring-2-cell-0',
    );
    const ring2cell1 = solarSystem.spaces.find(
      (space) => space.id === 'ring-2-cell-1',
    );

    if (!ring1cell0 || !ring1cell7 || !ring2cell0 || !ring2cell1) {
      throw new Error('expected solar-system ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    ring2cell1.hasPublicityIcon = true;
    ring2cell1.publicityIconAmount = 3;

    solarSystem.placeProbe('p1', ring2cell0.id);

    RotateDiscEffect.execute({ solarSystem } as never);

    expect(solarSystem.getPlayerPublicity('p1')).toBe(3);
  });
});
