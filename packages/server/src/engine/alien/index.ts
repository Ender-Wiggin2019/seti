import { AlienRegistry } from './AlienRegistry.js';
import { AnomaliesAlienPlugin } from './plugins/AnomaliesAlienPlugin.js';
import { CentauriansAlienPlugin } from './plugins/CentauriansAlienPlugin.js';
import { DummyAlienPlugin } from './plugins/DummyAlienPlugin.js';
import { ExertiansAlienPlugin } from './plugins/ExertiansAlienPlugin.js';
import { MascamitesAlienPlugin } from './plugins/MascamitesAlienPlugin.js';
import { OumuamuaAlienPlugin } from './plugins/OumuamuaAlienPlugin.js';

export type {
  IAlienBoardInit,
  IAnomaliesAlienBoardInit,
  ICentauriansAlienBoardInit,
  ICentauriansMessageMilestoneComponent,
  IMascamitesAlienBoardInit,
  IMascamitesCapsuleComponent,
  IMascamitesDeliveredSampleComponent,
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
  CentauriansAlienBoard,
  createAlienBoard,
  ExertiansAlienBoard,
  isAnomaliesAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isMascamitesAlienBoard,
  isOumuamuaAlienBoard,
  MascamitesAlienBoard,
  OumuamuaAlienBoard,
} from './AlienBoard.js';
export { AlienRegistry } from './AlienRegistry.js';
export { AlienState } from './AlienState.js';
export type { IAlienPlugin } from './IAlienPlugin.js';

// ---- Plugin registration ---------------------------------------------------

AlienRegistry.register(new AnomaliesAlienPlugin());
AlienRegistry.register(new CentauriansAlienPlugin());
AlienRegistry.register(new ExertiansAlienPlugin());
AlienRegistry.register(new MascamitesAlienPlugin());
AlienRegistry.register(new OumuamuaAlienPlugin());
AlienRegistry.register(new DummyAlienPlugin());
