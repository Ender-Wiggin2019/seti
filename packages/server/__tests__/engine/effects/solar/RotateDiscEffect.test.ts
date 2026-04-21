import { vi } from 'vitest';
import { BoardBuilder } from '@/engine/board/BoardBuilder.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { RotateDiscEffect } from '@/engine/effects/solar/RotateDiscEffect.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

describe('RotateDiscEffect', () => {
  it('[4.1.1] rotates top disc and changes space positions', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('rotate-top-test'),
    );
    const game = { solarSystem };

    const disc0BeforeRotation = solarSystem.discs[0].currentRotation;

    expect(RotateDiscEffect.canExecute(game as never)).toBe(true);

    const result = RotateDiscEffect.execute(game as never);

    expect(result.rotatedDisc).toBe(0);
    expect(solarSystem.rotationCounter).toBe(1);
    expect(solarSystem.discs[0].currentRotation).toBe(
      (disc0BeforeRotation + 1) % 8,
    );
  });

  it('[4.1.2] rotates middle disc and changes space positions', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('rotate-middle-test'),
    );
    solarSystem.rotationCounter = 1;
    const game = { solarSystem };

    const disc0Before = solarSystem.discs[0].currentRotation;
    const disc1Before = solarSystem.discs[1].currentRotation;

    const result = RotateDiscEffect.execute(game as never);

    expect(result.rotatedDisc).toBe(1);
    expect(solarSystem.rotationCounter).toBe(2);
    expect(solarSystem.discs[0].currentRotation).toBe((disc0Before + 1) % 8);
    expect(solarSystem.discs[1].currentRotation).toBe((disc1Before + 1) % 8);
  });

  it('[4.1.3] rotates bottom disc and changes space positions', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('rotate-bottom-test'),
    );
    solarSystem.rotationCounter = 2;
    const game = { solarSystem };

    const disc0Before = solarSystem.discs[0].currentRotation;
    const disc1Before = solarSystem.discs[1].currentRotation;
    const disc2Before = solarSystem.discs[2].currentRotation;

    const result = RotateDiscEffect.execute(game as never);

    expect(result.rotatedDisc).toBe(2);
    expect(solarSystem.rotationCounter).toBe(3);
    expect(solarSystem.discs[0].currentRotation).toBe((disc0Before + 1) % 8);
    expect(solarSystem.discs[1].currentRotation).toBe((disc1Before + 1) % 8);
    expect(solarSystem.discs[2].currentRotation).toBe((disc2Before + 1) % 8);
  });

  it('[4.1.4] probe follows disc rotation and changes position', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('probe-rotates-test'),
    );
    const game = { solarSystem };

    const probe = solarSystem.placeProbe('player-1', 'ring-1-cell-0');

    expect(
      solarSystem.getProbesAt('ring-1-cell-0').some((p) => p.id === probe.id),
    ).toBe(true);

    RotateDiscEffect.execute(game as never);

    expect(
      solarSystem.getProbesAt('ring-1-cell-0').some((p) => p.id === probe.id),
    ).toBe(false);
    expect(
      solarSystem.getProbesAt('ring-1-cell-1').some((p) => p.id === probe.id),
    ).toBe(true);
  });

  it('[4.1.5] probe gets pushed to next valid space when covered', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('probe-push-test'),
    );
    const game = { solarSystem };

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
      throw new Error('expected ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];

    const probe = solarSystem.placeProbe('player-1', ring2cell0.id);

    RotateDiscEffect.execute(game as never);

    expect(
      solarSystem.getProbesAt(ring2cell0.id).some((p) => p.id === probe.id),
    ).toBe(false);
    expect(
      solarSystem.getProbesAt(ring2cell1.id).some((p) => p.id === probe.id),
    ).toBe(true);
  });

  it('[4.1.6] probe gains publicity when pushed through publicity icon', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('probe-push-publicity-test'),
    );
    const game = { solarSystem };

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
      throw new Error('expected ring cells to exist');
    }

    ring1cell0.elements = [{ type: ESolarSystemElementType.NULL, amount: 1 }];
    ring1cell7.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
    ring2cell1.hasPublicityIcon = true;

    const probe = solarSystem.placeProbe('player-1', ring2cell0.id);

    expect(solarSystem.getPlayerPublicity('player-1')).toBe(0);

    RotateDiscEffect.execute(game as never);

    expect(
      solarSystem.getProbesAt(ring2cell1.id).some((p) => p.id === probe.id),
    ).toBe(true);
    expect(solarSystem.getPlayerPublicity('player-1')).toBe(1);
  });

  it('[4.1.7] alienState.onSolarSystemRotated is called with game', () => {
    const solarSystem = BoardBuilder.buildSolarSystemFromRandom(
      new SeededRandom('alien-callback-test'),
    );
    const onSolarSystemRotated = vi.fn();
    const game = {
      solarSystem,
      alienState: {
        onSolarSystemRotated,
      },
    };

    RotateDiscEffect.execute(game as never);

    expect(onSolarSystemRotated).toHaveBeenCalledOnce();
    expect(onSolarSystemRotated).toHaveBeenCalledWith(game);
  });
});
