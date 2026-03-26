import { AdvancedNavigationSystem } from './base/AdvancedNavigationSystemCard.js';
import { AreciboObservatory } from './base/AreciboObservatoryCard.js';
import { BarnardsStarObservation } from './base/BarnardsStarObservationCard.js';
import { createGenericCard } from './base/GenericCards.js';
import { SquareKilometreArray } from './base/SquareKilometreArrayCard.js';
import { Starship } from './base/StarshipCard.js';
import type { ICard } from './ICard.js';
import { loadAllCardData, loadCardData } from './loadCardData.js';

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

  public registerFromLoadedData(ids?: readonly string[]): void {
    const allCardIds = (
      ids ?? loadAllCardData().map((card) => card.id)
    ).slice();
    for (const id of allCardIds) {
      this.register(id, () => createGenericCard(loadCardData(id)));
    }
  }
}

const defaultCardRegistry = new CardRegistry();
defaultCardRegistry.registerFromLoadedData();
defaultCardRegistry.register('55', () => new AreciboObservatory());
defaultCardRegistry.register('128', () => new AdvancedNavigationSystem());
defaultCardRegistry.register('38', () => new BarnardsStarObservation());
defaultCardRegistry.register('50', () => new SquareKilometreArray());
defaultCardRegistry.register('85', () => new Starship());

export function getCardRegistry(): CardRegistry {
  return defaultCardRegistry;
}
