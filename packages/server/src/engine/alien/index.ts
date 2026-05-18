import { AlienRegistry } from './AlienRegistry.js';
import { AmoebaAlienPlugin } from './plugins/AmoebaAlienPlugin.js';
import { AnomaliesAlienPlugin } from './plugins/AnomaliesAlienPlugin.js';
import { ArkhosAlienPlugin } from './plugins/ArkhosAlienPlugin.js';
import { CentauriansAlienPlugin } from './plugins/CentauriansAlienPlugin.js';
import { DummyAlienPlugin } from './plugins/DummyAlienPlugin.js';
import { ExertiansAlienPlugin } from './plugins/ExertiansAlienPlugin.js';
import { GlyphidsAlienPlugin } from './plugins/GlyphidsAlienPlugin.js';
import { MascamitesAlienPlugin } from './plugins/MascamitesAlienPlugin.js';
import { OumuamuaAlienPlugin } from './plugins/OumuamuaAlienPlugin.js';

export type {
  IAlienBoardInit,
  IAmoebaAlienBoardInit,
  IAnomaliesAlienBoardInit,
  IArkhosAlienBoardInit,
  ICentauriansAlienBoardInit,
  ICentauriansMessageMilestoneComponent,
  IGlyphidsAlienBoardInit,
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
  AmoebaAlienBoard,
  AnomaliesAlienBoard,
  ArkhosAlienBoard,
  CentauriansAlienBoard,
  createAlienBoard,
  ExertiansAlienBoard,
  GlyphidsAlienBoard,
  isAmoebaAlienBoard,
  isAnomaliesAlienBoard,
  isArkhosAlienBoard,
  isCentauriansAlienBoard,
  isExertiansAlienBoard,
  isGlyphidsAlienBoard,
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
AlienRegistry.register(new GlyphidsAlienPlugin());
AlienRegistry.register(new AmoebaAlienPlugin());
AlienRegistry.register(new ArkhosAlienPlugin());
AlienRegistry.register(new DummyAlienPlugin());
