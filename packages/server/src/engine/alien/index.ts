import { AlienRegistry } from './AlienRegistry.js';
import { DummyAlienPlugin } from './plugins/DummyAlienPlugin.js';

export type {
  IAlienBoardInit,
  ITraceOccupant,
  ITraceSlot,
  ITraceSlotInit,
  TSlotOccupantSource,
  TSlotReward,
} from './AlienBoard.js';
export { AlienBoard } from './AlienBoard.js';
export { AlienRegistry } from './AlienRegistry.js';
export { AlienState } from './AlienState.js';
export type { IAlienPlugin } from './IAlienPlugin.js';

// ---- Plugin registration ---------------------------------------------------

AlienRegistry.register(new DummyAlienPlugin());
