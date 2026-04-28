import { AlienRegistry } from './AlienRegistry.js';
import { AnomaliesAlienPlugin } from './plugins/AnomaliesAlienPlugin.js';
import { DummyAlienPlugin } from './plugins/DummyAlienPlugin.js';
import { OumuamuaAlienPlugin } from './plugins/OumuamuaAlienPlugin.js';

export type {
  IAlienBoardInit,
  IAnomaliesAlienBoardInit,
  IOumuamuaAlienBoardInit,
  ITraceOccupant,
  ITraceSlot,
  ITraceSlotInit,
  TAlienBoardInit,
  TSlotOccupantSource,
  TSlotReward,
} from './AlienBoard.js';
export {
  AlienBoard,
  AnomaliesAlienBoard,
  createAlienBoard,
  isAnomaliesAlienBoard,
  isOumuamuaAlienBoard,
  OumuamuaAlienBoard,
} from './AlienBoard.js';
export { AlienRegistry } from './AlienRegistry.js';
export { AlienState } from './AlienState.js';
export type { IAlienPlugin } from './IAlienPlugin.js';

// ---- Plugin registration ---------------------------------------------------

AlienRegistry.register(new AnomaliesAlienPlugin());
AlienRegistry.register(new OumuamuaAlienPlugin());
AlienRegistry.register(new DummyAlienPlugin());
