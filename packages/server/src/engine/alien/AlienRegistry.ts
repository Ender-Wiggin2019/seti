import type { EAlienType } from '@seti/common/types/protocol/enums';
import type { IAlienPlugin } from './IAlienPlugin.js';

const registry = new Map<EAlienType, IAlienPlugin>();

export class AlienRegistry {
  public static register(plugin: IAlienPlugin): void {
    registry.set(plugin.alienType, plugin);
  }

  public static get(alienType: EAlienType): IAlienPlugin | undefined {
    return registry.get(alienType);
  }

  public static has(alienType: EAlienType): boolean {
    return registry.has(alienType);
  }

  public static clear(): void {
    registry.clear();
  }
}
