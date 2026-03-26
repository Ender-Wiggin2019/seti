import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { SeededRandom } from '@/shared/rng/SeededRandom.js';

export class Deck<T> {
  private drawPile: T[];

  private discardPile: T[];

  public constructor(items: readonly T[] = [], discards: readonly T[] = []) {
    this.drawPile = [...items];
    this.discardPile = [...discards];
  }

  public get drawSize(): number {
    return this.drawPile.length;
  }

  public get discardSize(): number {
    return this.discardPile.length;
  }

  public get totalSize(): number {
    return this.drawPile.length + this.discardPile.length;
  }

  public isEmpty(): boolean {
    return this.drawPile.length === 0;
  }

  public shuffle(rng: SeededRandom): void {
    this.drawPile = rng.shuffle(this.drawPile);
  }

  public draw(): T | undefined {
    return this.drawPile.shift();
  }

  public drawOrThrow(): T {
    const item = this.draw();
    if (item === undefined) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Cannot draw from an empty deck',
      );
    }
    return item;
  }

  public drawN(count: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.draw();
      if (item === undefined) break;
      result.push(item);
    }
    return result;
  }

  public peek(count = 1): readonly T[] {
    return this.drawPile.slice(0, count);
  }

  public addToTop(...items: T[]): void {
    this.drawPile.unshift(...items);
  }

  public addToBottom(...items: T[]): void {
    this.drawPile.push(...items);
  }

  public discard(...items: T[]): void {
    this.discardPile.push(...items);
  }

  /** Shuffle discard pile into draw pile (appends shuffled discards to bottom of draw pile) */
  public reshuffleDiscards(rng: SeededRandom): void {
    const shuffled = rng.shuffle(this.discardPile);
    this.drawPile.push(...shuffled);
    this.discardPile = [];
  }

  /** Auto-reshuffle: if draw pile is empty, reshuffle discards first, then draw */
  public drawWithReshuffle(rng: SeededRandom): T | undefined {
    if (this.isEmpty() && this.discardPile.length > 0) {
      this.reshuffleDiscards(rng);
    }
    return this.draw();
  }

  public getDrawPile(): readonly T[] {
    return this.drawPile;
  }

  public getDiscardPile(): readonly T[] {
    return this.discardPile;
  }
}
