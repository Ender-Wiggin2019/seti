import { describe, expect, it } from 'vitest';
import {
  isAlienBoardInput,
  isPlanetaryBoardInput,
} from '@/features/layout/sectionInputs';
import type {
  IPlayerInputModel,
  ISelectOptionInputModel,
} from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';

function optionInput(
  optionIds: string[],
  inputId = 'input-1',
): ISelectOptionInputModel {
  return {
    inputId,
    type: EPlayerInputType.OPTION,
    title: undefined,
    options: optionIds.map((id) => ({ id, label: id })),
  };
}

describe('layout routing helpers', () => {
  describe('isAlienBoardInput', () => {
    it('matches the Oumuamua main-action ORBIT slot picker (lowercase wire id)', () => {
      // Regression: EPlanet.OUMUAMUA serializes as the lowercase
      // 'oumuamua' wire value, not the TypeScript identifier
      // 'OUMUAMUA'. The earlier regex matched only uppercase, so
      // clicking ORBIT/LAND on Oumuamua never auto-jumped to the
      // Aliens tab — players were stuck on the Planets tab while
      // the prompt was for the alien board.
      expect(
        isAlienBoardInput(
          optionInput([
            'main-action-orbit-slot-oumuamua-first',
            'main-action-orbit-slot-oumuamua-regular',
          ]),
        ),
      ).toBe(true);
    });

    it('matches the Oumuamua main-action LAND slot picker (lowercase wire id)', () => {
      expect(
        isAlienBoardInput(
          optionInput(['main-action-land-slot-oumuamua-planet']),
        ),
      ).toBe(true);
    });

    it('does not match non-Oumuamua planet slot pickers', () => {
      expect(
        isAlienBoardInput(
          optionInput([
            'main-action-orbit-slot-mars-first',
            'main-action-orbit-slot-mars-regular',
          ]),
        ),
      ).toBe(false);
      expect(
        isAlienBoardInput(optionInput(['main-action-land-slot-saturn-planet'])),
      ).toBe(false);
    });

    it('matches alien-board trace slot pickers', () => {
      expect(
        isAlienBoardInput(optionInput(['alien-0-discovery-pink-trace'])),
      ).toBe(true);
      expect(
        isAlienBoardInput(optionInput(['alien-1-anomaly-column|red-trace|1'])),
      ).toBe(true);
      expect(
        isAlienBoardInput(optionInput(['mascamites-fixed-blue-trace-8'])),
      ).toBe(true);
      expect(
        isAlienBoardInput(optionInput(['alien-0-mascamites-public-sample-0'])),
      ).toBe(true);
      expect(
        isAlienBoardInput(optionInput(['alien-0-mascamites-sample-blue-0'])),
      ).toBe(true);
      expect(
        isAlienBoardInput(optionInput(['exertians-danger-1-blue-trace-0'])),
      ).toBe(true);
    });
  });

  describe('isPlanetaryBoardInput', () => {
    it('matches planet pickers for non-Oumuamua planets', () => {
      expect(
        isPlanetaryBoardInput(
          optionInput([
            'main-action-orbit-planet-mars',
            'main-action-orbit-planet-venus',
          ]),
        ),
      ).toBe(true);
    });

    it('matches native non-earth planet inputs', () => {
      const planetInput: IPlayerInputModel = {
        inputId: 'planet-input',
        type: EPlayerInputType.PLANET,
        title: 'Choose Mars',
        options: [EPlanet.MARS],
      };

      expect(isPlanetaryBoardInput(planetInput)).toBe(true);
    });

    it('matches non-Oumuamua slot pickers', () => {
      expect(
        isPlanetaryBoardInput(
          optionInput(['main-action-orbit-slot-mars-first']),
        ),
      ).toBe(true);
    });

    it('does not match a slot picker that is exclusively Oumuamua', () => {
      // Mirror of the alien-board test above — Oumuamua's slot
      // picker should route to the Aliens tab, not Planets.
      expect(
        isPlanetaryBoardInput(
          optionInput([
            'main-action-orbit-slot-oumuamua-first',
            'main-action-orbit-slot-oumuamua-regular',
          ]),
        ),
      ).toBe(false);
      expect(
        isPlanetaryBoardInput(
          optionInput(['main-action-land-slot-oumuamua-planet']),
        ),
      ).toBe(false);
    });
  });
});
