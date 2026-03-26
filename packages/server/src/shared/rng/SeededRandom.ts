export class SeededRandom {
  private state: number;

  public constructor(seed: string) {
    this.state = SeededRandom.seedToUint32(seed);
  }

  public next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;

    const normalized = (this.state >>> 0) / 0x100000000;
    return normalized;
  }

  public nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error('maxExclusive must be a positive integer');
    }

    return Math.floor(this.next() * maxExclusive);
  }

  public shuffle<TItem>(items: readonly TItem[]): TItem[] {
    const shuffledItems = [...items];

    for (
      let currentIndex = shuffledItems.length - 1;
      currentIndex > 0;
      currentIndex -= 1
    ) {
      const swapIndex = this.nextInt(currentIndex + 1);
      const currentValue = shuffledItems[currentIndex];
      shuffledItems[currentIndex] = shuffledItems[swapIndex];
      shuffledItems[swapIndex] = currentValue;
    }

    return shuffledItems;
  }

  public getState(): number {
    return this.state >>> 0;
  }

  public setState(state: number): void {
    const normalized = state >>> 0;
    this.state = normalized === 0 ? 1 : normalized;
  }

  public static fromState(seed: string, state: number): SeededRandom {
    const random = new SeededRandom(seed);
    random.setState(state);
    return random;
  }

  private static seedToUint32(seed: string): number {
    let hash = 2166136261;

    for (const character of seed) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }

    // xorshift can't start from zero.
    return hash === 0 ? 1 : hash >>> 0;
  }
}
