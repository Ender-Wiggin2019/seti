import { SeededRandom } from '@/shared/rng/SeededRandom.js';

describe('SeededRandom', () => {
  it('generates the same sequence for the same seed', () => {
    const randomA = new SeededRandom('same-seed');
    const randomB = new SeededRandom('same-seed');

    const sequenceA = Array.from({ length: 6 }, () => randomA.next());
    const sequenceB = Array.from({ length: 6 }, () => randomB.next());

    expect(sequenceA).toStrictEqual(sequenceB);
  });

  it('generates different sequences for different seeds', () => {
    const randomA = new SeededRandom('seed-a');
    const randomB = new SeededRandom('seed-b');

    const sequenceA = Array.from({ length: 6 }, () => randomA.next());
    const sequenceB = Array.from({ length: 6 }, () => randomB.next());

    expect(sequenceA).not.toStrictEqual(sequenceB);
  });

  it('shuffles deterministically with the same seed', () => {
    const source = [1, 2, 3, 4, 5, 6, 7];
    const randomA = new SeededRandom('shuffle-seed');
    const randomB = new SeededRandom('shuffle-seed');

    const shuffledA = randomA.shuffle(source);
    const shuffledB = randomB.shuffle(source);

    expect(shuffledA).toStrictEqual(shuffledB);
    expect(shuffledA).not.toStrictEqual(source);
  });
});
