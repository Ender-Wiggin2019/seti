import type { ICard } from './ICard.js';
import { registerAlienCards } from './register/registerAlienCards.js';
import { registerBaseCards } from './register/registerBaseCards.js';
import { registerSpaceAgencyAliens } from './register/registerSpaceAgencyAliens.js';
import { registerSpaceAgencyCards } from './register/registerSpaceAgencyCards.js';

export type TCardFactory = () => ICard;

export class CardRegistry {
  private readonly factories = new Map<string, TCardFactory>();

  public register(id: string, factory: TCardFactory): void {
    this.factories.set(id, factory);
  }

  public has(id: string): boolean {
    return this.factories.has(id);
  }

  public create(id: string): ICard {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Card "${id}" has not been registered`);
    }
    return factory();
  }

  public createAll(ids: readonly string[]): ICard[] {
    return ids.map((id) => this.create(id));
  }

  public get size(): number {
    return this.factories.size;
  }
}

const defaultCardRegistry = new CardRegistry();
registerBaseCards(defaultCardRegistry);
registerAlienCards(defaultCardRegistry);
registerSpaceAgencyCards(defaultCardRegistry);
registerSpaceAgencyAliens(defaultCardRegistry);

export function getCardRegistry(): CardRegistry {
  return defaultCardRegistry;
}
